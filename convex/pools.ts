import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        terms: v.optional(v.string()),
        paymentDetails: v.optional(v.object({
            upiId: v.optional(v.string()),
            accountName: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifsc: v.optional(v.string()),
            note: v.optional(v.string()),
        })),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))),
        totalValue: v.number(),
        totalSeats: v.number(),
        contribution: v.number(),
        currency: v.optional(v.string()),
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
        organizerFirst: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const userPoolsCount = await ctx.db
            .query("pools")
            .filter((q) => q.eq(q.field("organizerId"), user._id))
            .collect();
        if (userPoolsCount.length >= 5) throw new Error("You can only create up to 5 pools.");

        if (args.totalSeats < 1 || args.totalSeats > 50)
            throw new Error("Number of seats must be between 1 and 50.");

        const poolId = await ctx.db.insert("pools", {
            title: args.title,
            organizerId: user._id,
            terms: args.terms,
            paymentDetails: args.paymentDetails,
            drawStrategy: args.drawStrategy,
            startDate: args.startDate,
            config: {
                totalValue: args.totalValue,
                totalSeats: args.totalSeats,
                contribution: args.contribution,
                currency: args.currency,
                frequency: args.frequency,
                duration: args.duration,
                commission: args.commission,
                gracePeriodDays: args.gracePeriodDays,
            },
            status: "DRAFT",
            currentRound: 0,
        });

        if (args.organizerFirst) {
            await ctx.db.insert("seats", {
                poolId,
                seatNumber: 1,
                userId: user._id,
                status: "FILLED",
                isGuest: false,
            });
        }

        return poolId;
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

        const userSeats = await ctx.db
            .query("seats")
            .withIndex("by_user_pool", (q) => q.eq("userId", user._id))
            .collect();

        const organizerPools = await ctx.db
            .query("pools")
            .filter((q) => q.eq(q.field("organizerId"), user._id))
            .collect();

        const poolIds = new Set([
            ...userSeats.map((s) => s.poolId),
            ...organizerPools.map((p) => p._id),
        ]);

        const pools = await Promise.all(
            [...poolIds].map(async (id) => {
                const pool = await ctx.db.get(id);
                if (!pool) return null;
                const organizer = await ctx.db.get(pool.organizerId);
                const seats = await ctx.db
                    .query("seats")
                    .withIndex("by_pool", (q) => q.eq("poolId", id))
                    .collect();
                const filledSeats = seats.filter((seat) => seat.status !== "OPEN").length;
                return {
                    ...pool,
                    filledSeats,
                    organizer: organizer ? { name: organizer.name } : null
                };
            })
        );
        return pools.filter((p) => p !== null);
    },
});

export const get = query({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const pool = await ctx.db.get(args.poolId);
        if (!pool) return null;

        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) => q.eq("poolId", args.poolId))
            .collect();

        const seatsWithUsers = await Promise.all(
            seats.map(async (seat) => {
                let user = null;
                if (seat.userId) user = await ctx.db.get(seat.userId);

                let coOwners: any[] = [];
                let remainingPercentage = 100;

                if (seat.isCoSeat) {
                    const shares = await ctx.db
                        .query("seat_shares")
                        .withIndex("by_seat", (q) => q.eq("seatId", seat._id))
                        .collect();

                    coOwners = await Promise.all(
                        shares.map(async (share) => {
                            const u = await ctx.db.get(share.userId);
                            return {
                                ...share,
                                userName: u?.name,
                                userPhone: u?.phone,
                                userPictureUrl: u?.pictureUrl,
                                isGuest: u?.verificationStatus === "UNVERIFIED" && !u?.clerkId,
                            };
                        })
                    );

                    const filled = shares
                        .filter((s) => s.status === "ACTIVE")
                        .reduce((sum, s) => sum + s.sharePercentage, 0);
                    remainingPercentage = 100 - filled;
                }

                return { ...seat, user, coOwners, remainingPercentage };
            })
        );

        const organizer = await ctx.db.get(pool.organizerId);
        return {
            ...pool,
            seats: seatsWithUsers,
            organizer: organizer
                ? {
                    name: organizer.name,
                    phone: organizer.phone,
                    _id: organizer._id,
                    verificationStatus: organizer.verificationStatus,
                }
                : null,
        };
    },
});

export const activate = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");
        if (pool.status !== "DRAFT") throw new Error("Pool already active");

        const organizer = await ctx.db.get(pool.organizerId);
        if (!organizer || organizer.verificationStatus !== "VERIFIED")
            throw new Error("You must be a Verified User to activate a pool.");

        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool", (q) => q.eq("poolId", args.poolId))
            .collect();
        const emptySeats = seats.filter((s) => s.status === "OPEN");
        if (emptySeats.length > 0)
            throw new Error(`Cannot activate: ${emptySeats.length} seats are still OPEN.`);

        await ctx.db.patch(args.poolId, { status: "ACTIVE", currentRound: 1 });
    },
});

export const updatePool = mutation({
    args: {
        poolId: v.id("pools"),
        title: v.optional(v.string()),
        terms: v.optional(v.string()),
        paymentDetails: v.optional(v.object({
            upiId: v.optional(v.string()),
            accountName: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifsc: v.optional(v.string()),
            note: v.optional(v.string()),
        })),
        startDate: v.optional(v.number()),
        totalValue: v.optional(v.number()),
        totalSeats: v.optional(v.number()),
        contribution: v.optional(v.number()),
        currency: v.optional(v.string()),
        frequency: v.optional(v.string()),
        duration: v.optional(v.number()),
        commission: v.optional(v.number()),
        gracePeriodDays: v.optional(v.number()),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId) throw new Error("Unauthorized");

        if (pool.status === "DRAFT") {
            const joinedMembers = await ctx.db
                .query("seats")
                .withIndex("by_pool", (q) => q.eq("poolId", pool._id))
                .filter((q) =>
                    q.and(q.neq(q.field("status"), "OPEN"), q.eq(q.field("isGuest"), false))
                )
                .collect();

            const isConfigLocked = joinedMembers.length > 0;
            const configUpdates: any = {};

            if (!isConfigLocked) {
                if (args.totalValue) configUpdates.totalValue = args.totalValue;
                if (args.totalSeats) {
                    if (args.totalSeats < 1 || args.totalSeats > 50)
                        throw new Error("Number of seats must be between 1 and 50.");
                    configUpdates.totalSeats = args.totalSeats;
                }
                if (args.contribution) configUpdates.contribution = args.contribution;
                if (args.currency) configUpdates.currency = args.currency;
                if (
                    args.frequency &&
                    ["monthly", "weekly", "biweekly", "quarterly", "occasional"].includes(
                        args.frequency
                    )
                )
                    configUpdates.frequency = args.frequency;
                if (args.duration) configUpdates.duration = args.duration;
                if (args.gracePeriodDays !== undefined)
                    configUpdates.gracePeriodDays = args.gracePeriodDays;
            }

            if (args.commission !== undefined) configUpdates.commission = args.commission;

            await ctx.db.patch(args.poolId, {
                title: args.title ?? pool.title,
                terms: args.terms ?? pool.terms,
                paymentDetails: args.paymentDetails ?? pool.paymentDetails,
                drawStrategy: args.drawStrategy ?? pool.drawStrategy,
                startDate: args.startDate ?? pool.startDate,
                config: { ...pool.config, ...configUpdates },
            });
        } else {
            await ctx.db.patch(args.poolId, {
                title: args.title ?? pool.title,
                terms: args.terms ?? pool.terms,
                paymentDetails: args.paymentDetails ?? pool.paymentDetails,
                drawStrategy: args.drawStrategy ?? pool.drawStrategy,
            });
        }
    },
});

export const archivePool = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId)
            throw new Error("Only the Organizer can archive this pool");

        await ctx.db.patch(args.poolId, { status: "ARCHIVED" });
    },
});

export const unarchivePool = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId)
            throw new Error("Only the Organizer can unarchive this pool");

        await ctx.db.patch(args.poolId, { status: "ACTIVE" });
    },
});

export const deletePool = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId)
            throw new Error("Only the Organizer can delete this pool");

        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool", (q) => q.eq("poolId", args.poolId))
            .collect();

        for (const seat of seats) {
            const shares = await ctx.db
                .query("seat_shares")
                .withIndex("by_seat", (q) => q.eq("seatId", seat._id))
                .collect();
            for (const share of shares) await ctx.db.delete(share._id);
        }

        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_pool_round", (q) => q.eq("poolId", args.poolId))
            .collect();
        for (const tx of transactions) await ctx.db.delete(tx._id);

        for (const seat of seats) await ctx.db.delete(seat._id);
        await ctx.db.delete(args.poolId);
    },
});
