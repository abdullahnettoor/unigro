import { v } from "convex/values";

import { mutation } from "./_generated/server";

export const runDraw = mutation({
    args: {
        poolId: v.id("pools"),
        customWinnerSeatNumber: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");
        if (pool.status !== "ACTIVE") throw new Error("Pool is not active");

        const organizer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!organizer || organizer._id !== pool.organizerId)
            throw new Error("Only the Organizer can run the Draw");

        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) => q.eq("poolId", args.poolId))
            .collect();

        // Eligible: Filled (or Reserved Guest), Has User OR is a co-seat, no roundWon yet
        const eligibleSeats = seats.filter(
            (s) => (s.status === "FILLED" || (s.status === "RESERVED" && s.isGuest)) && (s.userId || s.isCoSeat) && !s.roundWon
        );

        if (eligibleSeats.length === 0) throw new Error("No eligible seats left");

        let winningSeat;
        if (args.customWinnerSeatNumber) {
            winningSeat = eligibleSeats.find(
                (s) => s.seatNumber === args.customWinnerSeatNumber
            );
            if (!winningSeat) throw new Error("Selected seat is not eligible");
        } else {
            winningSeat = eligibleSeats[Math.floor(Math.random() * eligibleSeats.length)];
        }

        await ctx.db.patch(winningSeat._id, { roundWon: pool.currentRound });
        return winningSeat.seatNumber;
    },
});

export const advanceRound = mutation({
    args: {
        poolId: v.id("pools"),
        nextDrawDate: v.number(),
        markAllAsPaid: v.optional(v.boolean()),
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

        const winner = await ctx.db
            .query("seats")
            .withIndex("by_pool", (q) => q.eq("poolId", args.poolId))
            .filter((q) => q.eq(q.field("roundWon"), pool.currentRound))
            .first();

        if (!winner) throw new Error("No winner selected for current round");

        // 1. Optional Bulk Payment Recording
        if (args.markAllAsPaid) {
            const recordDate = pool.nextDrawDate ?? pool.startDate ?? Date.now();
            const seats = await ctx.db
                .query("seats")
                .withIndex("by_pool", (q) => q.eq("poolId", args.poolId))
                .collect();

            const existingTxs = await ctx.db
                .query("transactions")
                .withIndex("by_pool_round", (q) =>
                    q.eq("poolId", args.poolId).eq("roundIndex", pool.currentRound)
                )
                .collect();

            const paidSeatIds = new Set(
                existingTxs.filter((tx) => tx.status === "PAID").map((tx) => tx.seatId)
            );

            for (const seat of seats) {
                // If the seat is occupied and hasn't paid yet for this round
                if (
                    (seat.status === "FILLED" || seat.status === "RESERVED") &&
                    !paidSeatIds.has(seat._id)
                ) {
                    await ctx.db.insert("transactions", {
                        poolId: args.poolId,
                        seatId: seat._id,
                        roundIndex: pool.currentRound,
                        userId: seat.userId ?? undefined,
                        status: "PAID",
                        type: "online",
                        paidAt: recordDate,
                        remarks: "Auto-marked by Organizer during round advancement",
                    });
                }
            }
        }

        const isLast = pool.currentRound >= pool.config.duration;

        await ctx.db.patch(args.poolId, {
            currentRound: pool.currentRound + 1,
            nextDrawDate: args.nextDrawDate,
            status: isLast ? "COMPLETED" : "ACTIVE",
        });
    },
});

