import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
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

        // Restriction: Max 5 pools per user
        const userPoolsCount = await ctx.db
            .query("pools")
            .filter((q) => q.eq(q.field("organizerId"), user._id))
            .collect();
        if (userPoolsCount.length >= 5) {
            throw new Error("You can only create up to 5 pools.");
        }

        // Restriction: Seats between 1 and 50
        if (args.totalSeats < 1 || args.totalSeats > 50) {
            throw new Error("Number of seats must be between 1 and 50.");
        }

        // Create Pool
        const poolId = await ctx.db.insert("pools", {
            title: args.title,
            organizerId: user._id,
            description: args.description,
            bankDetails: args.bankDetails,
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

        // Create Seats (On-Demand: Only create if Organizer First)
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

        // Find all seats where user is owner
        const userSeats = await ctx.db
            .query("seats")
            .withIndex("by_user_pool", (q) => q.eq("userId", user._id))
            .collect();

        // Also find pools where user is Organizer
        const organizerPools = await ctx.db
            .query("pools")
            .filter(q => q.eq(q.field("organizerId"), user._id))
            .collect();

        const poolIds = new Set([
            ...userSeats.map((s) => s.poolId),
            ...organizerPools.map((p) => p._id)
        ]);

        const pools = await Promise.all([...poolIds].map(async (id) => {
            const pool = await ctx.db.get(id);
            if (!pool) return null;
            const organizer = await ctx.db.get(pool.organizerId);
            return {
                ...pool,
                organizer: organizer ? { name: organizer.name } : null
            };
        }));
        return pools.filter((p) => p !== null);
    },
});

export const get = query({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const pool = await ctx.db.get(args.poolId);
        if (!pool) return null;

        // Fetch seats
        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", (q) => q.eq("poolId", args.poolId))
            .collect();

        // Fetch user details for filled seats
        const seatsWithUsers = await Promise.all(
            seats.map(async (seat) => {
                let user = null;
                if (seat.userId) {
                    user = await ctx.db.get(seat.userId);
                }

                let coOwners: any[] = [];
                let remainingPercentage = 100;
                if (seat.isCoSeat) {
                    const shares = await ctx.db
                        .query("seat_shares")
                        .withIndex("by_seat", (q) => q.eq("seatId", seat._id))
                        .collect();

                    coOwners = await Promise.all(shares.map(async (share) => {
                        const u = await ctx.db.get(share.userId);
                        return {
                            ...share,
                            userName: u?.name,
                            userPhone: u?.phone,
                            userPictureUrl: u?.pictureUrl,
                            isGuest: u?.verificationStatus === "UNVERIFIED" && !u?.clerkId
                        };
                    }));

                    const filledShares = shares.filter(s => s.status === "ACTIVE").reduce((sum, s) => sum + s.sharePercentage, 0);
                    remainingPercentage = 100 - filledShares;
                }

                return {
                    ...seat,
                    user,
                    coOwners,
                    remainingPercentage
                };
            })
        );

        const organizer = await ctx.db.get(pool.organizerId);

        return {
            ...pool,
            seats: seatsWithUsers,
            organizer: organizer ? {
                name: organizer.name,
                phone: organizer.phone,
                _id: organizer._id,
                verificationStatus: organizer.verificationStatus
            } : null
        };
    },
});

// Join Pool (Self-service - On Demand Seats)
export const join = mutation({
    args: {
        poolId: v.id("pools"),
        seatCount: v.optional(v.number()), // Default 1
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

        // Verify Organizer Status
        const organizer = await ctx.db.get(pool.organizerId);
        if (!organizer || organizer.verificationStatus !== "VERIFIED") {
            throw new Error("Cannot join: Pool Organizer is unverified.");
        }

        const count = args.seatCount || 1;

        // Find available seat numbers
        const existingSeats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId))
            .collect();

        const usedNumbers = new Set(existingSeats.map(s => s.seatNumber));
        const availableNumbers = [];

        for (let i = 1; i <= pool.config.totalSeats; i++) {
            if (!usedNumbers.has(i)) {
                availableNumbers.push(i);
            }
            if (availableNumbers.length === count) break;
        }

        if (availableNumbers.length < count) {
            throw new Error(`Only ${availableNumbers.length} seats available, requested ${count}`);
        }

        // Create Seats
        for (const num of availableNumbers) {
            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: num,
                userId: user._id,
                status: "FILLED",
                isGuest: false
            });
        }

        return availableNumbers[0]; // Return first assigned seat number
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

        let userId: Id<"users">;
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .unique();

        if (existingUser) {
            if (existingUser.clerkId) {
                throw new Error("ALREADY_REGISTERED");
            }
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
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId))
            .collect();

        const usedNumbers = new Set(existingSeats.map(s => s.seatNumber));
        const availableNumbers = [];

        for (let i = 1; i <= pool.config.totalSeats; i++) {
            if (!usedNumbers.has(i)) {
                availableNumbers.push(i);
            }
            if (availableNumbers.length === count) break;
        }

        if (availableNumbers.length < count) {
            throw new Error(`Only ${availableNumbers.length} seats available.`);
        }

        for (const num of availableNumbers) {
            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: num,
                userId: userId,
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

        const organizer = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!organizer || organizer._id !== pool.organizerId) throw new Error("Only the Organizer can assign seats");

        if (organizer.verificationStatus !== "VERIFIED") {
            throw new Error("You must be a Verified User to invite members.");
        }

        // Find Seat (might not exist in On-Demand)
        const seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber))
            .unique();

        if (seat) {
            if (seat.status !== "OPEN") throw new Error("Seat already filled");
        }

        // Find or Create User
        let userId;
        const existingUser = await ctx.db.query("users").withIndex("by_phone", q => q.eq("phone", args.phone)).unique();
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
            // Update existing OPEN seat
            await ctx.db.patch(seat._id, {
                userId,
                status: "FILLED",
                isGuest
            });
        } else {
            // Create new seat
            if (args.seatNumber > pool.config.totalSeats) throw new Error("Seat number exceeds total seats");

            await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: args.seatNumber,
                userId,
                status: "FILLED",
                isGuest
            });
        }
    }
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

        const organizer = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!organizer || organizer._id !== pool.organizerId) throw new Error("Only the Organizer can delete seats");

        const seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber))
            .unique();

        if (!seat) throw new Error("Seat not found");

        await ctx.db.delete(seat._id);
    }
});

export const runDraw = mutation({
    args: {
        poolId: v.id("pools"),
        customWinnerSeatNumber: v.optional(v.number()), // Manual override
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");
        if (pool.status !== "ACTIVE") throw new Error("Pool is not active");

        const organizer = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!organizer || organizer._id !== pool.organizerId) throw new Error("Only the Organizer can run the Draw");

        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId))
            .collect();

        // Eligible: Filled, Has User OR is a co-seat, No Round Won yet
        const eligibleSeats = seats.filter(s => s.status === "FILLED" && (s.userId || s.isCoSeat) && !s.roundWon);

        if (eligibleSeats.length === 0) throw new Error("No eligible seats left");

        let winningSeat;

        if (args.customWinnerSeatNumber) {
            winningSeat = eligibleSeats.find(s => s.seatNumber === args.customWinnerSeatNumber);
            if (!winningSeat) throw new Error("Selected seat is not eligible");
        } else {
            // Random
            const randIndex = Math.floor(Math.random() * eligibleSeats.length);
            winningSeat = eligibleSeats[randIndex];
        }

        // Apply Win
        await ctx.db.patch(winningSeat._id, {
            roundWon: pool.currentRound
        });

        return winningSeat.seatNumber;
    },
});

export const activate = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");
        if (pool.status !== "DRAFT") throw new Error("Pool already active");

        // Verify Organizer is verified
        const organizer = await ctx.db.get(pool.organizerId);
        if (!organizer || organizer.verificationStatus !== "VERIFIED") {
            throw new Error("You must be a Verified User to activate a pool.");
        }

        // Verify all seats filled
        const seats = await ctx.db.query("seats").withIndex("by_pool", q => q.eq("poolId", args.poolId)).collect();
        const emptySeats = seats.filter(s => s.status === "OPEN");
        if (emptySeats.length > 0) throw new Error(`Cannot activate: ${emptySeats.length} seats are still OPEN.`);

        await ctx.db.patch(args.poolId, {
            status: "ACTIVE",
            currentRound: 1,
        });
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

        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!user || user._id !== pool.organizerId) throw new Error("Unauthorized");

        // Validate winner exists for current round
        const winner = await ctx.db
            .query("seats")
            .withIndex("by_pool", q => q.eq("poolId", args.poolId))
            .filter(q => q.eq(q.field("roundWon"), pool.currentRound))
            .first();

        if (!winner) throw new Error("No winner selected for current round");

        const isLast = pool.currentRound >= pool.config.duration;

        await ctx.db.patch(args.poolId, {
            currentRound: pool.currentRound + 1,
            nextDrawDate: args.nextDrawDate,
            status: isLast ? "COMPLETED" : "ACTIVE"
        });
    }
});

// Update Pool (Edit Draft)
export const updatePool = mutation({
    args: {
        poolId: v.id("pools"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
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
            // Restriction: Check if any real (non-guest) member has joined
            const joinedMembers = await ctx.db
                .query("seats")
                .withIndex("by_pool", (q) => q.eq("poolId", pool._id))
                .filter((q) => q.and(
                    q.neq(q.field("status"), "OPEN"),
                    q.eq(q.field("isGuest"), false)
                ))
                .collect();

            const isConfigLocked = joinedMembers.length > 0;

            const configUpdates: any = {};
            if (!isConfigLocked) {
                if (args.totalValue) configUpdates.totalValue = args.totalValue;
                if (args.totalSeats) {
                    if (args.totalSeats < 1 || args.totalSeats > 50) {
                        throw new Error("Number of seats must be between 1 and 50.");
                    }
                    configUpdates.totalSeats = args.totalSeats;
                }
                if (args.contribution) configUpdates.contribution = args.contribution;
                if (args.currency) configUpdates.currency = args.currency;
                if (args.frequency && ["monthly", "weekly", "biweekly", "quarterly", "occasional"].includes(args.frequency)) {
                    configUpdates.frequency = args.frequency;
                }
                if (args.duration) configUpdates.duration = args.duration;
                if (args.gracePeriodDays !== undefined) configUpdates.gracePeriodDays = args.gracePeriodDays;
            }

            if (args.commission !== undefined) configUpdates.commission = args.commission;

            await ctx.db.patch(args.poolId, {
                title: args.title ?? pool.title,
                description: args.description ?? pool.description,
                bankDetails: args.bankDetails ?? pool.bankDetails,
                drawStrategy: args.drawStrategy ?? pool.drawStrategy,
                startDate: args.startDate ?? pool.startDate,
                config: { ...pool.config, ...configUpdates },
            });
        } else {
            // Active/Closed: Partial update only
            await ctx.db.patch(args.poolId, {
                title: args.title ?? pool.title,
                description: args.description ?? pool.description,
                bankDetails: args.bankDetails ?? pool.bankDetails,
                drawStrategy: args.drawStrategy ?? pool.drawStrategy,
            });
        }
    }
});

// Assign Co-Seat (Partial Ownership)
export const assignCoSeat = mutation({
    args: {
        poolId: v.id("pools"),
        seatNumber: v.number(),
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        sharePercentage: v.number(), // e.g. 50
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        // Verify Organizer
        const organizer = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
        if (!organizer || organizer._id !== pool.organizerId) throw new Error("Only the Organizer can assign seats");

        if (organizer.verificationStatus !== "VERIFIED") {
            throw new Error("You must be a Verified User to invite members.");
        }

        if (args.sharePercentage <= 0 || args.sharePercentage > 100) throw new Error("Invalid share percentage");

        // Find or Create User
        let user = await ctx.db.query("users").withIndex("by_phone", q => q.eq("phone", args.phone)).unique();

        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: args.name,
                phone: args.phone,
                email: args.email,
                verificationStatus: "UNVERIFIED"
            });
            user = await ctx.db.get(userId);
        }
        if (!user) throw new Error("Failed to resolve user");

        // Find or Create Seat
        let seat = await ctx.db
            .query("seats")
            .withIndex("by_pool_seatNumber", q => q.eq("poolId", args.poolId).eq("seatNumber", args.seatNumber))
            .unique();

        if (!seat) {
            const seatId = await ctx.db.insert("seats", {
                poolId: args.poolId,
                seatNumber: args.seatNumber,
                status: "RESERVED",
                isGuest: false,
                isCoSeat: true
            });
            seat = await ctx.db.get(seatId);
        }
        if (!seat) throw new Error("Failed to resolve seat");

        // Guard: Cannot split a seat that is already assigned to a single user
        if (seat.status !== "OPEN" && !seat.isCoSeat) {
            throw new Error("Seat is already completely assigned to a member. Remove them first.");
        }

        // Check Existing Shares
        const existingShares = await ctx.db
            .query("seat_shares")
            .withIndex("by_seat", q => q.eq("seatId", seat!._id))
            .collect();

        const currentTotal = existingShares.filter(s => s.status === "ACTIVE").reduce((sum, s) => sum + s.sharePercentage, 0);

        if (currentTotal + args.sharePercentage > 100) {
            throw new Error(`Cannot assign ${args.sharePercentage}% share. Only ${100 - currentTotal}% remaining.`);
        }

        const newTotal = currentTotal + args.sharePercentage;
        const activeExistingShares = existingShares.filter(s => s.status === "ACTIVE");
        const isOnlyOwner = activeExistingShares.every(s => s.userId === user._id);

        if (newTotal === 100 && isOnlyOwner) {
            // 100% by single user → convert to normal full seat
            await ctx.db.patch(seat._id, {
                status: "FILLED",
                userId: user._id,
                isCoSeat: false,
                isGuest: !user.clerkId
            });

            for (const s of activeExistingShares) {
                await ctx.db.delete(s._id);
            }
            return;
        }

        const existingShare = activeExistingShares.find(s => s.userId === user._id);

        if (existingShare) {
            await ctx.db.patch(existingShare._id, {
                sharePercentage: existingShare.sharePercentage + args.sharePercentage
            });
        } else {
            await ctx.db.insert("seat_shares", {
                seatId: seat._id,
                userId: user._id,
                sharePercentage: args.sharePercentage,
                status: "ACTIVE"
            });
        }

        // Update Seat Status
        if (newTotal === 100) {
            await ctx.db.patch(seat._id, {
                status: "FILLED",
                isCoSeat: true
            });
        } else {
            await ctx.db.patch(seat._id, {
                status: "RESERVED",
                isCoSeat: true
            });
        }
    }
});

// ── Archive Pool ───────────────────────────────────────────────────────────────
export const archivePool = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId) throw new Error("Only the Organizer can archive this pool");

        await ctx.db.patch(args.poolId, { status: "ARCHIVED" });
    },
});

// ── Delete Pool (cascade) ──────────────────────────────────────────────────────
export const deletePool = mutation({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();
        if (!user || user._id !== pool.organizerId) throw new Error("Only the Organizer can delete this pool");

        // 1. Delete seat_shares rows for every seat in this pool
        const seats = await ctx.db
            .query("seats")
            .withIndex("by_pool", q => q.eq("poolId", args.poolId))
            .collect();

        for (const seat of seats) {
            const shares = await ctx.db
                .query("seat_shares")
                .withIndex("by_seat", q => q.eq("seatId", seat._id))
                .collect();
            for (const share of shares) {
                await ctx.db.delete(share._id);
            }
        }

        // 2. Delete all transactions for this pool
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_pool_round", q => q.eq("poolId", args.poolId))
            .collect();
        for (const tx of transactions) {
            await ctx.db.delete(tx._id);
        }

        // 3. Delete all seats
        for (const seat of seats) {
            await ctx.db.delete(seat._id);
        }

        // 4. Delete the pool itself
        await ctx.db.delete(args.poolId);
    },
});
