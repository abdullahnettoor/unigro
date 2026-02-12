import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))),
        totalValue: v.number(),
        totalSlots: v.number(), // New
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
        foremanFirst: v.optional(v.boolean()), // New
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Create Pot
        const potId = await ctx.db.insert("pots", {
            title: args.title,
            foremanId: user._id,
            description: args.description,
            bankDetails: args.bankDetails,
            drawStrategy: args.drawStrategy,
            startDate: args.startDate,
            config: {
                totalValue: args.totalValue,
                totalSlots: args.totalSlots,
                contribution: args.contribution,
                frequency: args.frequency,
                duration: args.duration,
                commission: args.commission,
                gracePeriodDays: args.gracePeriodDays,
            },
            status: "DRAFT",
            currentMonth: 0,
        });

        // Create Slots (On-Demand: Only create if Foreman First)
        if (args.foremanFirst) {
            await ctx.db.insert("slots", {
                potId,
                slotNumber: 1,
                userId: user._id,
                status: "FILLED",
                isGhost: false,
            });
        }

        return potId;
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

        // Find all slots where user is owner
        const userSlots = await ctx.db
            .query("slots")
            .withIndex("by_user_pot", (q) => q.eq("userId", user._id))
            .collect();

        // Also find pots where user is Foreman (even if he has no slots, though unlikely)
        const foremanPots = await ctx.db
            .query("pots")
            .filter(q => q.eq(q.field("foremanId"), user._id))
            .collect();

        const potIds = new Set([
            ...userSlots.map((s) => s.potId),
            ...foremanPots.map((p) => p._id)
        ]);

        const pots = await Promise.all([...potIds].map(async (id) => {
            const pot = await ctx.db.get(id);
            if (!pot) return null;
            const foreman = await ctx.db.get(pot.foremanId);
            return {
                ...pot,
                foreman: foreman ? { name: foreman.name } : null
            };
        }));
        return pots.filter((p) => p !== null);
    },
});

export const get = query({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const pot = await ctx.db.get(args.potId);
        if (!pot) return null;

        // Fetch slots
        const slots = await ctx.db
            .query("slots")
            .withIndex("by_pot_slotNumber", (q) => q.eq("potId", args.potId))
            .collect();

        // Fetch user details for filled slots
        const slotsWithUsers = await Promise.all(
            slots.map(async (slot) => {
                let user = null;
                if (slot.userId) {
                    user = await ctx.db.get(slot.userId);
                }
                return {
                    ...slot,
                    user
                };
            })
        );

        const foreman = await ctx.db.get(pot.foremanId);

        return {
            ...pot,
            slots: slotsWithUsers, // Renamed from members
            foreman: foreman ? { name: foreman.name, phone: foreman.phone, _id: foreman._id } : null
        };
    },
});

// Join Pot (Self-service - On Demand Slots)
export const join = mutation({
    args: {
        potId: v.id("pots"),
        slotCount: v.optional(v.number()), // Default 1
    },
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

        const count = args.slotCount || 1;

        // Find available slot numbers
        const existingSlots = await ctx.db
            .query("slots")
            .withIndex("by_pot_slotNumber", q => q.eq("potId", args.potId))
            .collect();

        const usedNumbers = new Set(existingSlots.map(s => s.slotNumber));
        const availableNumbers = [];

        for (let i = 1; i <= pot.config.totalSlots; i++) {
            if (!usedNumbers.has(i)) {
                availableNumbers.push(i);
            }
            if (availableNumbers.length === count) break;
        }

        if (availableNumbers.length < count) {
            throw new Error(`Only ${availableNumbers.length} slots available, requested ${count}`);
        }

        // Create Slots
        for (const num of availableNumbers) {
            await ctx.db.insert("slots", {
                potId: args.potId,
                slotNumber: num,
                userId: user._id,
                status: "FILLED",
                isGhost: false
            });
        }

        return availableNumbers[0]; // Return first assigned slot number
    },
});

// Foreman adds a participant (Ghost or Real) to a slot
export const assignSlot = mutation({
    args: {
        potId: v.id("pots"),
        slotNumber: v.number(),
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        const foreman = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!foreman || foreman._id !== pot.foremanId) throw new Error("Only Foreman can assign slots");

        // Find Slot (might not exist in On-Demand)
        let slot = await ctx.db
            .query("slots")
            .withIndex("by_pot_slotNumber", q => q.eq("potId", args.potId).eq("slotNumber", args.slotNumber))
            .unique();

        if (slot) {
            if (slot.status !== "OPEN") throw new Error("Slot already filled");
        }

        // Find or Create User
        let userId;
        const existingUser = await ctx.db.query("users").withIndex("by_phone", q => q.eq("phone", args.phone)).unique();
        let isGhost = true;

        if (existingUser) {
            userId = existingUser._id;
            isGhost = !existingUser.clerkId;
        } else {
            userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                verificationStatus: "UNVERIFIED",
            });
        }

        if (slot) {
            // Update existing OPEN slot
            await ctx.db.patch(slot._id, {
                userId,
                status: "FILLED",
                isGhost
            });
        } else {
            // Create new slot
            if (args.slotNumber > pot.config.totalSlots) throw new Error("Slot number exceeds total slots");

            await ctx.db.insert("slots", {
                potId: args.potId,
                slotNumber: args.slotNumber,
                userId,
                status: "FILLED",
                isGhost
            });
        }
    }
});

// Foreman removes a slot (Draft only)
export const deleteSlot = mutation({
    args: {
        potId: v.id("pots"),
        slotNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        // Allow deleting in DRAFT. (Maybe Active too if we handle refunds? For now Draft only)
        if (pot.status !== "DRAFT") throw new Error("Can only delete slots in Draft mode");

        const foreman = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!foreman || foreman._id !== pot.foremanId) throw new Error("Only Foreman can delete slots");

        const slot = await ctx.db
            .query("slots")
            .withIndex("by_pot_slotNumber", q => q.eq("potId", args.potId).eq("slotNumber", args.slotNumber))
            .unique();

        if (!slot) throw new Error("Slot not found");

        await ctx.db.delete(slot._id);
    }
});

export const runDraw = mutation({
    args: {
        potId: v.id("pots"),
        customWinnerSlotNumber: v.optional(v.number()), // Manual override
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");
        if (pot.status !== "ACTIVE") throw new Error("Pot is not active");

        const foreman = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!foreman || foreman._id !== pot.foremanId) throw new Error("Only Foreman can run draw");

        // Validate winner provided if Manual? 
        // We simplified Draw Strategy to "Slot Logic".
        // Let's assume Random unless customWinner provided.

        const slots = await ctx.db
            .query("slots")
            .withIndex("by_pot_slotNumber", q => q.eq("potId", args.potId))
            .collect();

        // Elgible: Filled, Has User, No Draw Order
        const eligibleSlots = slots.filter(s => s.status === "FILLED" && s.userId && !s.drawOrder);

        if (eligibleSlots.length === 0) throw new Error("No eligible slots left");

        let winningSlot;

        if (args.customWinnerSlotNumber) {
            winningSlot = eligibleSlots.find(s => s.slotNumber === args.customWinnerSlotNumber);
            if (!winningSlot) throw new Error("Selected slot is not eligible");
        } else {
            // Random
            const randIndex = Math.floor(Math.random() * eligibleSlots.length);
            winningSlot = eligibleSlots[randIndex];
        }

        // Apply Win
        await ctx.db.patch(winningSlot._id, {
            drawOrder: pot.currentMonth
        });

        return winningSlot.slotNumber;
    },
});

export const activate = mutation({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");
        if (pot.status !== "DRAFT") throw new Error("Pot already active");

        // Verify all slots filled?
        // "ACTIVE: Only possible when 100% of Slots are filled." (Architecture V3)
        const slots = await ctx.db.query("slots").withIndex("by_pot", q => q.eq("potId", args.potId)).collect();
        const emptySlots = slots.filter(s => s.status === "OPEN");
        if (emptySlots.length > 0) throw new Error(`Cannot activate: ${emptySlots.length} slots are still OPEN.`);

        await ctx.db.patch(args.potId, {
            status: "ACTIVE",
            currentMonth: 1,
            // duration update needed?
        });
    },
});

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

        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!user || user._id !== pot.foremanId) throw new Error("Unauthorized");

        // Validate winner exists for current month
        const winner = await ctx.db
            .query("slots")
            .withIndex("by_pot", q => q.eq("potId", args.potId))
            .filter(q => q.eq(q.field("drawOrder"), pot.currentMonth))
            .unique();

        if (!winner) throw new Error("No winner selected for current cycle");

        const isLast = pot.currentMonth >= pot.config.duration;

        await ctx.db.patch(args.potId, {
            currentMonth: pot.currentMonth + 1,
            nextDrawDate: args.nextDrawDate,
            status: isLast ? "COMPLETED" : "ACTIVE"
        });
    }
});

// Update Pot (Edit Draft)
export const updatePot = mutation({
    args: {
        potId: v.id("pots"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
        startDate: v.optional(v.number()),
        // Full config support for Draft edits
        totalValue: v.optional(v.number()),
        totalSlots: v.optional(v.number()), // Added
        contribution: v.optional(v.number()),
        frequency: v.optional(v.string()),
        duration: v.optional(v.number()),
        commission: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))),
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
            if (args.totalSlots) configUpdates.totalSlots = args.totalSlots; // Update totalSlots
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
                drawStrategy: args.drawStrategy ?? pot.drawStrategy,
                startDate: args.startDate ?? pot.startDate,
                config: { ...pot.config, ...configUpdates },
            });
        } else {
            // Active/Closed: Partial update only
            await ctx.db.patch(args.potId, {
                title: args.title ?? pot.title,
                description: args.description ?? pot.description,
                bankDetails: args.bankDetails ?? pot.bankDetails,
                drawStrategy: args.drawStrategy ?? pot.drawStrategy,
                // Ignored: startDate, config updates
            });
        }
    }
});
