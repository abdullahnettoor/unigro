import { ConvexError,v } from "convex/values";

import { mutation, query } from "./_generated/server";

// 1. Generate Upload URL for Proof Screenshot
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// 2. Submit Payment (Member)
export const submitPayment = mutation({
    args: {
        poolId: v.id("pools"),
        seatId: v.id("seats"),
        roundIndex: v.number(),
        storageId: v.optional(v.id("_storage")),
        remarks: v.optional(v.string()),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"), v.literal("upi"))),
        paymentApp: v.optional(v.string()),
        initiatedAt: v.optional(v.number()),
        upiDeepLinkUsed: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Verify ownership of seat
        const seat = await ctx.db.get(args.seatId);
        if (!seat) throw new Error("Seat not found");
        let isOwner = seat.userId === user._id;
        if (!isOwner && seat.isCoSeat) {
            const ownership = await ctx.db
                .query("seat_shares")
                .withIndex("by_seat", (q) => q.eq("seatId", seat._id))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .first();
            if (ownership) isOwner = true;
        }

        if (!isOwner) throw new ConvexError("You do not own this seat");
        if (seat.poolId !== args.poolId) throw new ConvexError("Seat does not belong to this pool");

        // Check if transaction exists (Unique per user for co-seats)
        let existingTxQuery = ctx.db
            .query("transactions")
            .withIndex("by_pool_round", (q) => q.eq("poolId", args.poolId).eq("roundIndex", args.roundIndex))
            .filter((q) => q.eq(q.field("seatId"), args.seatId));

        existingTxQuery = existingTxQuery.filter((q) => q.eq(q.field("userId"), user._id));

        const existingTx = await existingTxQuery.unique();

        let proofUrl = undefined;
        if (args.storageId) {
            proofUrl = await ctx.storage.getUrl(args.storageId) || undefined;
        }

        const data = {
            status: "PENDING" as const,
            type: args.type || ("online" as const),
            paidAt: Date.now(),
            proofUrl: proofUrl ?? existingTx?.proofUrl,
            remarks: args.remarks ?? existingTx?.remarks,
            initiatedAt: args.initiatedAt ?? existingTx?.initiatedAt,
            paymentApp: args.paymentApp ?? existingTx?.paymentApp,
            upiDeepLinkUsed: args.upiDeepLinkUsed ?? existingTx?.upiDeepLinkUsed,
        };

        if (existingTx) {
            await ctx.db.patch(existingTx._id, data);
        } else {
            await ctx.db.insert("transactions", {
                poolId: args.poolId,
                seatId: args.seatId,
                roundIndex: args.roundIndex,
                userId: user._id,
                ...data,
            });
        }
    },
});

// 2.5 Record Cash Payment (Organizer Only)
export const recordCashPayment = mutation({
    args: {
        poolId: v.id("pools"),
        seatId: v.id("seats"),
        roundIndex: v.number(),
        userId: v.optional(v.id("users")), // Optional: Specify which user if co-seat
        paidAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Verify Organizer
        const pool = await ctx.db.get(args.poolId);
        if (!pool) throw new Error("Pool not found");

        const organizer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!organizer || organizer._id !== pool.organizerId) throw new ConvexError("Only the Organizer can record cash payments");

        // Check if transaction exists
        let existingTxQuery = ctx.db
            .query("transactions")
            .withIndex("by_pool_round", (q) => q.eq("poolId", args.poolId).eq("roundIndex", args.roundIndex))
            .filter((q) => q.eq(q.field("seatId"), args.seatId));

        if (args.userId) {
            existingTxQuery = existingTxQuery.filter((q) => q.eq(q.field("userId"), args.userId));
        }

        const existingTx = await existingTxQuery.first();

        const paymentDate = args.paidAt || Date.now();

        if (existingTx) {
            await ctx.db.patch(existingTx._id, {
                status: "PAID",
                type: "cash",
                paidAt: paymentDate,
                remarks: "Cash Payment Recorded by Organizer"
            });
        } else {
            let payerId = args.userId;
            if (!payerId) {
                const seat = await ctx.db.get(args.seatId);
                if (seat && seat.userId) payerId = seat.userId;
            }

            await ctx.db.insert("transactions", {
                poolId: args.poolId,
                seatId: args.seatId,
                roundIndex: args.roundIndex,
                userId: payerId,
                status: "PAID",
                type: "cash",
                paidAt: paymentDate,
                remarks: "Cash Payment Recorded by Organizer",
            });
        }
    },
});

// 3. Approve Payment (Organizer)
export const approvePayment = mutation({
    args: { transactionId: v.id("transactions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const tx = await ctx.db.get(args.transactionId);
        if (!tx) throw new Error("Transaction not found");

        const pool = await ctx.db.get(tx.poolId);
        if (!pool) throw new Error("Pool not found");

        // Verify Organizer
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pool.organizerId) throw new ConvexError("Only the Organizer can approve");

        await ctx.db.patch(args.transactionId, {
            status: "PAID",
            paidAt: tx.paidAt || Date.now()
        });
    },
});

// 3b. Reject Payment (Organizer)
export const rejectPayment = mutation({
    args: {
        transactionId: v.id("transactions"),
        notes: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const tx = await ctx.db.get(args.transactionId);
        if (!tx) throw new Error("Transaction not found");

        const pool = await ctx.db.get(tx.poolId);
        if (!pool) throw new Error("Pool not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pool.organizerId) throw new ConvexError("Only the Organizer can reject");

        await ctx.db.patch(args.transactionId, {
            status: "UNPAID",
            remarks: args.notes ? `Rejected: ${args.notes}` : "Rejected by Organizer",
        });
    },
});

// 4. Record Payout (Organizer -> Winner)
export const recordPayout = mutation({
    args: {
        poolId: v.id("pools"),
        seatId: v.id("seats"), // The winner seat
        roundIndex: v.number(),
        amount: v.number(),
        notes: v.optional(v.string())
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

        if (!user || user._id !== pool.organizerId) throw new ConvexError("Only the Organizer can record payouts");

        await ctx.db.insert("transactions", {
            poolId: args.poolId,
            seatId: args.seatId,
            roundIndex: args.roundIndex,
            status: "PAID",
            type: "payout",
            remarks: args.notes || "Winner Payout",
        });
    }
});

// 5. List Transactions for a Pool
export const list = query({
    args: { poolId: v.id("pools") },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_pool_round", (q) => q.eq("poolId", args.poolId))
            .collect();

        // Enrich with Seat and User details
        const enriched = await Promise.all(transactions.map(async (tx) => {
            let seat = null;
            let user = null;
            if (tx.seatId) {
                seat = await ctx.db.get(tx.seatId);
                if (tx.userId) {
                    user = await ctx.db.get(tx.userId);
                } else if (seat && seat.userId) {
                    user = await ctx.db.get(seat.userId);
                }
            }
            return { ...tx, seat, user };
        }));

        return enriched;
    },
});
