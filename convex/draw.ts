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

        // Eligible: Filled, Has User OR is a co-seat, no roundWon yet
        const eligibleSeats = seats.filter(
            (s) => s.status === "FILLED" && (s.userId || s.isCoSeat) && !s.roundWon
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

        const isLast = pool.currentRound >= pool.config.duration;

        await ctx.db.patch(args.poolId, {
            currentRound: pool.currentRound + 1,
            nextDrawDate: args.nextDrawDate,
            status: isLast ? "COMPLETED" : "ACTIVE",
        });
    },
});
