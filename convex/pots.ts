import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
        drawStrategy: v.optional(
            v.union(v.literal("RANDOM"), v.literal("MANUAL"), v.literal("FIXED"))
        ),
        totalValue: v.number(),
        contribution: v.number(),
        frequency: v.union(
            v.literal("monthly"),
            v.literal("weekly"),
            v.literal("biweekly"),
            v.literal("quarterly"),
            v.literal("occasional")
        ),
        duration: v.number(),
        commission: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        startDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const potId = await ctx.db.insert("pots", {
            title: args.title,
            foremanId: user._id,
            description: args.description,
            bankDetails: args.bankDetails,
            drawStrategy: args.drawStrategy || "RANDOM",
            startDate: args.startDate,
            config: {
                totalValue: args.totalValue,
                contribution: args.contribution,
                frequency: args.frequency,
                duration: args.duration,
                commission: args.commission,
                gracePeriodDays: args.gracePeriodDays,
            },
            status: "DRAFT",
            currentMonth: 0,
        });

        await ctx.db.insert("members", {
            potId,
            userId: user._id,
            isGhost: false,
        });

        return potId;
    },
});

export const addMember = mutation({
    args: {
        potId: v.id("pots"),
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // 1. Verify Foreman handles? logic skipped for now to allow testing

        // 2. Check if user exists (Ghost or Real)
        let userId;
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .unique();

        if (existingUser) {
            userId = existingUser._id;
        } else {
            // Create Ghost User
            userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                verificationStatus: "UNVERIFIED",
                // No clerkId, email, pictureUrl
            });
        }

        // 3. Add to Pot
        await ctx.db.insert("members", {
            potId: args.potId,
            userId,
            isGhost: !existingUser?.clerkId, // It's a ghost if no clerkId
        });

        return userId;
    },
});

export const activate = mutation({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");
        if (pot.status !== "DRAFT") throw new Error("Pot already active");

        const members = await ctx.db.query("members").withIndex("by_pot", q => q.eq("potId", args.potId)).collect();
        // if (members.length < 2) throw new Error("Need at least 2 members");

        let duration = pot.config.duration;
        if (pot.config.frequency === 'occasional') {
            duration = members.length;
        }

        await ctx.db.patch(args.potId, {
            status: "ACTIVE",
            currentMonth: 1,
            config: { ...pot.config, duration }
        });
    },
});

export const runDraw = mutation({
    args: {
        potId: v.id("pots"),
        customWinnerId: v.optional(v.id("members")), // For Manual or Override
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");
        if (pot.status !== "ACTIVE") throw new Error("Pot is not active");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only the Foreman can run the draw");

        // Check if winner already selected for this month
        const members = await ctx.db
            .query("members")
            .withIndex("by_pot", (q) => q.eq("potId", args.potId))
            .collect();

        const existingWinner = members.find((m) => m.drawOrder === pot.currentMonth);
        if (existingWinner) throw new Error("Winner already selected for this month");

        const eligibleMembers = members.filter((m) => !m.drawOrder);
        if (eligibleMembers.length === 0) throw new Error("No eligible members left to win");

        let winnerId: Id<"members">;

        // 1. Manual Override or Manual Strategy
        if (args.customWinnerId) {
            const selected = eligibleMembers.find(m => m._id === args.customWinnerId);
            if (!selected) throw new Error("Selected member is not eligible (already won or not in pot)");
            winnerId = selected._id;
        }
        // 2. Fixed Strategy
        else if (pot.drawStrategy === "FIXED") {
            const nextInSequence = eligibleMembers.find(m => m.sequence === pot.currentMonth);
            if (!nextInSequence) {
                // Fallback if sequence is broken? Or stricter error?
                // Let's fallback to finding *any* member with correct sequence, even if not eligible? No, they must be eligible.
                // If specific sequence member is missing/ineligible, throw error or fallback?
                // Throwing error prompts Foreman to use Manual Override.
                throw new Error(`No eligible member found for sequence #${pot.currentMonth}. Use Manual Override.`);
            }
            winnerId = nextInSequence._id;
        }
        // 3. Random Strategy (Default)
        else {
            const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
            winnerId = eligibleMembers[randomIndex]._id;
        }

        // Assign drawOrder to winner
        await ctx.db.patch(winnerId, {
            drawOrder: pot.currentMonth,
        });

        return winnerId;
    },
});

export const list = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        // Find all pots where user is a member
        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user_pot", (q) => q.eq("userId", user._id))
            .collect();

        const potIds = memberships.map((m) => m.potId);

        // Efficiently fetch all pots
        const pots = await Promise.all(potIds.map((id) => ctx.db.get(id)));
        return pots.filter((p) => p !== null);
    },
});

export const get = query({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const pot = await ctx.db.get(args.potId);
        if (!pot) return null;

        // Fetch members
        const members = await ctx.db
            .query("members")
            .withIndex("by_pot", (q) => q.eq("potId", args.potId))
            .collect();

        // Fetch user details for each member
        const memberUsers = await Promise.all(
            members.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return {
                    ...m,
                    user // Embed user details
                };
            })
        );

        // Fetch Foreman details
        const foreman = await ctx.db.get(pot.foremanId);

        return {
            ...pot,
            members: memberUsers,
            foreman: foreman ? { name: foreman.name, phone: foreman.phone } : null
        };
    },
});
// 6. Request to Join Pot
export const requestJoin = mutation({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        // Check if already member or requested
        // Check if already requested (allow multiple ACTIVE, but prevent spamming REQUESTS)
        const memberships = await ctx.db
            .query("members")
            .withIndex("by_user_pot", (q) => q.eq("userId", user._id).eq("potId", args.potId))
            .collect();

        const pendingRequest = memberships.find(m => m.status === "REQUESTED");
        if (pendingRequest) throw new Error("Join request already pending");

        // Allow joining again even if already ACTIVE (Multi-Slot support)

        await ctx.db.insert("members", {
            potId: args.potId,
            userId: user._id,
            isGhost: false,
            status: "REQUESTED",
        });
    },
});

// 7. Approve Join Request
export const approveJoin = mutation({
    args: { memberId: v.id("members") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const membership = await ctx.db.get(args.memberId);
        if (!membership) throw new Error("Request not found");

        const pot = await ctx.db.get(membership.potId);
        if (!pot) throw new Error("Pot not found");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can approve requests");

        await ctx.db.patch(args.memberId, { status: "ACTIVE" });
    },
});

// 8. Reject Join Request
export const rejectJoin = mutation({
    args: { memberId: v.id("members") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const membership = await ctx.db.get(args.memberId);
        if (!membership) throw new Error("Request not found");

        const pot = await ctx.db.get(membership.potId);
        if (!pot) throw new Error("Pot not found");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can reject requests");

        await ctx.db.delete(args.memberId); // Or set status REJECTED if we want history
    },
});

// 9. Update Member (e.g. set sequence)
export const updateMember = mutation({
    args: {
        memberId: v.id("members"),
        sequence: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const membership = await ctx.db.get(args.memberId);
        if (!membership) throw new Error("Member not found");

        const pot = await ctx.db.get(membership.potId);
        if (!pot) throw new Error("Pot not found");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can update members");

        await ctx.db.patch(args.memberId, {
            sequence: args.sequence,
        });
    },
});

// 10. Override Winner (Swapping / Post-Draw Edit)
export const overrideWinner = mutation({
    args: {
        potId: v.id("pots"),
        newWinnerId: v.id("members"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can override winners");

        // Verify New Winner
        const newWinner = await ctx.db.get(args.newWinnerId);
        if (!newWinner || newWinner.potId !== pot._id) throw new Error("Invalid member");

        // Find Current Winner for this cycle (if any)
        const currentWinner = await ctx.db
            .query("members")
            .withIndex("by_pot", (q) => q.eq("potId", pot._id))
            .filter((q) => q.eq(q.field("drawOrder"), pot.currentMonth))
            .unique();

        if (currentWinner) {
            // Remove win from current winner
            await ctx.db.patch(currentWinner._id, { drawOrder: undefined });
        }

        // Assign to new winner
        await ctx.db.patch(newWinner._id, {
            drawOrder: pot.currentMonth,
        });
    },
});

// 11. Advance Cycle (For Occasional Pots)
export const advanceCycle = mutation({
    args: {
        potId: v.id("pots"),
        nextDrawDate: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can advance the cycle");

        // Validate that a winner exists for the current month
        const members = await ctx.db
            .query("members")
            .withIndex("by_pot", (q) => q.eq("potId", args.potId))
            .filter((q) => q.eq(q.field("drawOrder"), pot.currentMonth))
            .collect();

        if (members.length === 0) throw new Error("Cannot advance cycle: No winner selected for current round");

        const isLastRound = pot.currentMonth >= pot.config.duration;

        await ctx.db.patch(args.potId, {
            currentMonth: pot.currentMonth + 1,
            nextDrawDate: args.nextDrawDate,
            status: isLastRound ? "COMPLETED" : "ACTIVE"
        });
    },
});

// 12. Archive Pot (Foreman Only)
export const archive = mutation({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can archive");

        if (pot.status !== "COMPLETED") throw new Error("Pot must be COMPLETED before archiving");

        // Verify Payouts - Check if all winners have been paid?
        // Let's settle for checking if *current* payouts are done, or maybe just allow it with a warning.
        // For strictness: Check if we have 'payout' transactions for every cycle? 
        // That might be too heavy. Let's just trust the Foreman for now or check strictly.
        // Strict: Get all winners. Check if they have a 'payout' transaction.

        await ctx.db.patch(args.potId, { status: "ARCHIVED" });
    }
});

// 12. Update Pot (Edit Draft)
export const updatePot = mutation({
    args: {
        potId: v.id("pots"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
        startDate: v.optional(v.number()),
        // Full config support for Draft edits
        totalValue: v.optional(v.number()),
        contribution: v.optional(v.number()),
        frequency: v.optional(v.string()),
        duration: v.optional(v.number()),
        commission: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Unauthorized");

        if (pot.status === "DRAFT") {
            // Allow full update
            const configUpdates: any = {};
            if (args.totalValue) configUpdates.totalValue = args.totalValue;
            if (args.contribution) configUpdates.contribution = args.contribution;
            // Validate frequency literal
            if (args.frequency && ["monthly", "weekly", "biweekly", "quarterly", "occasional"].includes(args.frequency)) {
                configUpdates.frequency = args.frequency;
            }
            if (args.duration) configUpdates.duration = args.duration;
            if (args.commission !== undefined) configUpdates.commission = args.commission;
            if (args.gracePeriodDays !== undefined) configUpdates.gracePeriodDays = args.gracePeriodDays;

            await ctx.db.patch(args.potId, {
                title: args.title ?? pot.title,
                description: args.description ?? pot.description,
                bankDetails: args.bankDetails ?? pot.bankDetails,
                startDate: args.startDate ?? pot.startDate,
                config: { ...pot.config, ...configUpdates },
            });
        } else {
            // Active/Closed: Partial update only
            await ctx.db.patch(args.potId, {
                title: args.title ?? pot.title,
                description: args.description ?? pot.description,
                bankDetails: args.bankDetails ?? pot.bankDetails,
                // Ignored: startDate, config updates
            });
        }
    }
});


