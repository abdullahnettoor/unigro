import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        totalValue: v.number(),
        contribution: v.number(),
        frequency: v.string(),
        duration: v.number(),
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
            config: {
                totalValue: args.totalValue,
                contribution: args.contribution,
                frequency: args.frequency,
                duration: args.duration,
            },
            status: "DRAFT",
            currentMonth: 0,
        });

        // Add creator as a member automatically
        // Fetch user again to get ID? We have user._id

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
                isVerified: false,
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

        // Logic: Ensure enough members? 
        // const members = await ctx.db.query("members").withIndex("by_pot", q => q.eq("potId", args.potId)).collect();
        // if (members.length < 2) throw new Error("Need at least 2 members");

        await ctx.db.patch(args.potId, {
            status: "ACTIVE",
            currentMonth: 1
        });
    },
});

export const runDraw = mutation({
    args: { potId: v.id("pots") },
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

        // Find eligible members (those who haven't won yet)
        const eligibleMembers = members.filter((m) => !m.drawOrder);

        if (eligibleMembers.length === 0) throw new Error("No eligible members left to win");

        // Randomly select winner
        const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
        const winner = eligibleMembers[randomIndex];

        // Assign drawOrder to winner
        await ctx.db.patch(winner._id, {
            drawOrder: pot.currentMonth,
        });

        return winner._id;
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

        return {
            ...pot,
            members: memberUsers
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
        const existing = await ctx.db
            .query("members")
            .withIndex("by_user_pot", (q) => q.eq("userId", user._id).eq("potId", args.potId))
            .unique();

        if (existing) {
            if (existing.status === "REQUESTED") throw new Error("Join request already sent");
            if (existing.status === "REJECTED") throw new Error("Join request was rejected");
            throw new Error("Already a member");
        }

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
