import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Join Pool (Self-service - On Demand Seats)
export const join = mutation({
    args: {
        poolId: v.id("pools"),
        seatCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const organizer = await ctx.db.get(pool.organizerId);
        if (!organizer || organizer.verificationStatus !== "VERIFIED") {
            throw new Error("Cannot join: Pool Organizer is unverified.");
        }

        const count = args.seatCount || 1;

        const existingSeats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) => q.eq("poolId", args.poolId))
            .collect();

        const usedNumbers = new Set(existingSeats.map((s) => s.seatNumber));
        const availableNumbers: number[] = [];

        for (let i = 1; i <= pool.config.totalSeats; i++) {
            if (!usedNumbers.has(i)) availableNumbers.push(i);
            if (availableNumbers.length === count) break;
        }

        if (availableNumbers.length < count) {
            throw new Error(`Only ${availableNumbers.length} seats available, requested ${count}`);
        }

        for (const num of availableNumbers) {
            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: num,
                userId: user._id,
                status: "FILLED",
                isGuest: false,
            });
        }

        return availableNumbers[0];
    },
});

export const joinAsGuest = mutation({
    args: {
        poolId: v.id("pools"),
        name: v.string(),
        phone: v.string(),
        seatCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const organizer = await ctx.db.get(pool.organizerId);
        if (!organizer || organizer.verificationStatus !== "VERIFIED") {
            throw new Error("Cannot join: Pool Organizer is unverified.");
        }

        let userId;
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .unique();

        if (existingUser) {
            if (existingUser.clerkId) throw new Error("ALREADY_REGISTERED");
            userId = existingUser._id;
        } else {
            userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                verificationStatus: "UNVERIFIED",
            });
        }

        const count = args.seatCount || 1;
        const existingSeats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) => q.eq("poolId", args.poolId))
            .collect();

        const usedNumbers = new Set(existingSeats.map((s) => s.seatNumber));
        const availableNumbers: number[] = [];

        for (let i = 1; i <= pool.config.totalSeats; i++) {
            if (!usedNumbers.has(i)) availableNumbers.push(i);
            if (availableNumbers.length === count) break;
        }

        if (availableNumbers.length < count) {
            throw new Error(`Only ${availableNumbers.length} seats available.`);
        }

        for (const num of availableNumbers) {
            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: num,
                userId,
                status: "RESERVED",
                isGuest: true,
            });
        }

        return { success: true, userId, firstSeat: availableNumbers[0] };
    },
});

// Organizer assigns a participant (Guest or Real) to a seat
export const assignSeat = mutation({
    args: {
        poolId: v.id("pools"),
        seatNumber: v.number(),
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const organizer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!organizer || organizer._id !== pool.organizerId)
            throw new Error("Only the Organizer can assign seats");
        if (organizer.verificationStatus !== "VERIFIED")
            throw new Error("You must be a Verified User to invite members.");

        const seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) =>
                q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber)
            )
            .unique();

        if (seat && seat.status !== "OPEN") throw new Error("Seat already filled");

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .unique();
        let userId;
        let isGuest = true;

        if (existingUser) {
            userId = existingUser._id;
            isGuest = !existingUser.clerkId;
        } else {
            userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                verificationStatus: "UNVERIFIED",
            });
        }

        if (seat) {
            await ctx.db.patch(seat._id, { userId, status: "FILLED", isGuest });
        } else {
            if (args.seatNumber > pool.config.totalSeats)
                throw new Error("Seat number exceeds total seats");
            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: args.seatNumber,
                userId,
                status: "FILLED",
                isGuest,
            });
        }
    },
});

// Organizer removes a seat (Draft only)
export const deleteSeat = mutation({
    args: {
        poolId: v.id("pools"),
        seatNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");
        if (pool.status !== "DRAFT") throw new Error("Can only delete seats in Draft mode");

        const organizer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!organizer || organizer._id !== pool.organizerId)
            throw new Error("Only the Organizer can delete seats");

        const seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) =>
                q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber)
            )
            .unique();

        if (!seat) throw new Error("Seat not found");
        await ctx.db.delete(seat._id);
    },
});

// Assign Co-Seat (Partial Ownership)
export const assignCoSeat = mutation({
    args: {
        poolId: v.id("pools"),
        seatNumber: v.number(),
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        sharePercentage: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const organizer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!organizer || organizer._id !== pool.organizerId)
            throw new Error("Only the Organizer can assign seats");
        if (organizer.verificationStatus !== "VERIFIED")
            throw new Error("You must be a Verified User to invite members.");
        if (args.sharePercentage <= 0 || args.sharePercentage > 100)
            throw new Error("Invalid share percentage");

        let user = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .unique();

        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                email: args.email,
                verificationStatus: "UNVERIFIED",
            });
            user = await ctx.db.get(userId);
        }
        if (!user) throw new Error("Failed to resolve user");

        let seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) =>
                q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber)
            )
            .unique();

        if (!seat) {
            const seatId = await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: args.seatNumber,
                status: "RESERVED",
                isGuest: false,
                isCoSeat: true,
            });
            seat = await ctx.db.get(seatId);
        }
        if (!seat) throw new Error("Failed to resolve seat");

        if (seat.status !== "OPEN" && !seat.isCoSeat)
            throw new Error("Seat is already completely assigned. Remove them first.");

        const existingShares = await ctx.db
            .query("seat_shares")
            .withIndex("by_seat", (q) => q.eq("seatId", seat!._id))
            .collect();

        const activeShares = existingShares.filter((s) => s.status === "ACTIVE");
        const currentTotal = activeShares.reduce((sum, s) => sum + s.sharePercentage, 0);

        if (currentTotal + args.sharePercentage > 100) {
            throw new Error(
                `Cannot assign ${args.sharePercentage}%. Only ${100 - currentTotal}% remaining.`
            );
        }

        const newTotal = currentTotal + args.sharePercentage;
        const isOnlyOwner = activeShares.every((s) => s.userId === user!._id);

        if (newTotal === 100 && isOnlyOwner) {
            await ctx.db.patch(seat._id, {
                status: "FILLED",
                userId: user._id,
                isCoSeat: false,
                isGuest: !user.clerkId,
            });
            for (const s of activeShares) await ctx.db.delete(s._id);
            return;
        }

        const existingShare = activeShares.find((s) => s.userId === user!._id);
        if (existingShare) {
            await ctx.db.patch(existingShare._id, {
                sharePercentage: existingShare.sharePercentage + args.sharePercentage,
            });
        } else {
            await ctx.db.insert("seat_shares", {
                seatId: seat._id,
                userId: user._id,
                sharePercentage: args.sharePercentage,
                status: "ACTIVE",
            });
        }

        await ctx.db.patch(seat._id, {
            status: newTotal === 100 ? "FILLED" : "RESERVED",
            isCoSeat: true,
        });
    },
});
