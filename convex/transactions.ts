import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Generate Upload URL for Proof Screenshot
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// 2. Submit Payment (Member)
export const submitPayment = mutation({
    args: {
        potId: v.id("pots"),
        slotId: v.id("slots"), // Changed from userId context
        monthIndex: v.number(),
        storageId: v.optional(v.id("_storage")),
        remarks: v.optional(v.string()),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Verify ownership of slot
        const slot = await ctx.db.get(args.slotId);
        if (!slot) throw new Error("Slot not found");
        let isOwner = slot.userId === user._id;
        if (!isOwner && slot.isSplit) {
            const ownership = await ctx.db
                .query("split_ownership")
                .withIndex("by_slot", (q) => q.eq("slotId", slot._id))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .first();
            if (ownership) isOwner = true;
        }

        if (!isOwner) throw new Error("You do not own this slot");
        if (slot.potId !== args.potId) throw new Error("Slot does not belong to this pot");

        // Check if transaction exists (Unique per user for split slots)
        let existingTxQuery = ctx.db
            .query("transactions")
            .withIndex("by_pot_month", (q) => q.eq("potId", args.potId).eq("monthIndex", args.monthIndex))
            .filter((q) => q.eq(q.field("slotId"), args.slotId));

        // If split slot (or to be safe), filter by userId as well
        // Note: For non-split slots, checks against slot owner's userId is implicitly handled by ownership check above + this insertion
        // but for backward compatibility and split support, we explicitly check userId if we are recording it.
        // Queries in Convex can't easily conditional filter, so we filter in memory or chain.
        // Actually best to just filter by userId since we are inserting it now.
        existingTxQuery = existingTxQuery.filter((q) => q.eq(q.field("userId"), user._id));

        const existingTx = await existingTxQuery.unique();

        let proofUrl = undefined;
        if (args.storageId) {
            proofUrl = await ctx.storage.getUrl(args.storageId) || undefined;
        }

        const data = {
            status: "PENDING" as const,
            type: "online" as const, // Capture as online payment
            paidAt: Date.now(), // Capture submission time
            proofUrl,
            remarks: args.remarks,
        };

        if (existingTx) {
            await ctx.db.patch(existingTx._id, data);
        } else {
            await ctx.db.insert("transactions", {
                potId: args.potId,
                slotId: args.slotId,
                monthIndex: args.monthIndex,
                userId: user._id, // Record Payer
                ...data,
            });
        }
    },
});

// 2.5 Record Cash Payment (Foreman Only)
export const recordCashPayment = mutation({
    args: {
        potId: v.id("pots"),
        slotId: v.id("slots"),
        monthIndex: v.number(),
        userId: v.optional(v.id("users")), // Optional: Specify which user if split slot
        paidAt: v.optional(v.number()), // NEW
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Verify Foreman
        const pot = await ctx.db.get(args.potId);
        if (!pot) throw new Error("Pot not found");

        const foreman = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!foreman || foreman._id !== pot.foremanId) throw new Error("Only Foreman can record cash payments");

        // Check if transaction exists
        let existingTxQuery = ctx.db
            .query("transactions")
            .withIndex("by_pot_month", (q) => q.eq("potId", args.potId).eq("monthIndex", args.monthIndex))
            .filter((q) => q.eq(q.field("slotId"), args.slotId));

        if (args.userId) {
            existingTxQuery = existingTxQuery.filter((q) => q.eq(q.field("userId"), args.userId));
        }
        // If no userId provided, it might match *any* transaction for that slot? 
        // Or if it's a legacy slot (no split), it might find the one without userId?
        // For safety, if it's a split slot, userId SHOULD be provided.
        // But for now, we follow the query.

        const existingTx = await existingTxQuery.first(); // unique() might fail if multiple exist and no userId provided

        // Use provided date or now
        const paymentDate = args.paidAt || Date.now();

        if (existingTx) {
            await ctx.db.patch(existingTx._id, {
                status: "PAID",
                type: "cash",
                paidAt: paymentDate, // Update date
                remarks: "Cash Payment Recorded by Foreman"
            });
        } else {
            // Need to know WHO paid if we are creating a new one.
            // If userId is not provided, we might default to slot owner?
            let payerId = args.userId;
            if (!payerId) {
                const slot = await ctx.db.get(args.slotId);
                if (slot && slot.userId) payerId = slot.userId;
            }

            await ctx.db.insert("transactions", {
                potId: args.potId,
                slotId: args.slotId,
                monthIndex: args.monthIndex,
                userId: payerId,
                status: "PAID",
                type: "cash",
                paidAt: paymentDate,
                remarks: "Cash Payment Recorded by Foreman",
            });
        }
    },
});

// 3. Approve Payment (Foreman)
export const approvePayment = mutation({
    args: { transactionId: v.id("transactions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const tx = await ctx.db.get(args.transactionId);
        if (!tx) throw new Error("Transaction not found");

        const pot = await ctx.db.get(tx.potId);
        if (!pot) throw new Error("Pot not found");

        // Verify Foreman
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can approve");

        await ctx.db.patch(args.transactionId, {
            status: "PAID",
            // Keep original paidAt (when user submitted) or update to approval time?
            // Let's keep original paidAt if exists, else set now.
            paidAt: tx.paidAt || Date.now()
        });
    },
});

// 3b. Reject Payment (Foreman)
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

        const pot = await ctx.db.get(tx.potId);
        if (!pot) throw new Error("Pot not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can reject");

        await ctx.db.patch(args.transactionId, {
            status: "UNPAID",
            remarks: args.notes ? `Rejected: ${args.notes}` : "Rejected by Foreman",
        });
    },
});

// 4. Record Payout (Foreman -> Winner)
export const recordPayout = mutation({
    args: {
        potId: v.id("pots"),
        slotId: v.id("slots"), // The winner slot
        monthIndex: v.number(),
        amount: v.number(),
        notes: v.optional(v.string())
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

        if (!user || user._id !== pot.foremanId) throw new Error("Only Foreman can record payouts");

        // Record as a transaction of type 'payout'
        await ctx.db.insert("transactions", {
            potId: args.potId,
            slotId: args.slotId,
            monthIndex: args.monthIndex,
            status: "PAID",
            type: "payout",
            remarks: args.notes || "Winner Payout",
        });
    }
});

// 4. List Transactions for a Pot (Grouped logic handled in frontend or flat list here)
export const list = query({
    args: { potId: v.id("pots") },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_pot_month", (q) => q.eq("potId", args.potId))
            .collect();

        // Enrich with Slot and User details
        const enriched = await Promise.all(transactions.map(async (tx) => {
            let slot = null;
            let user = null;
            if (tx.slotId) {
                slot = await ctx.db.get(tx.slotId);
                // IF transaction has a userId, use that. Otherwise fallback to slot owner.
                if (tx.userId) {
                    user = await ctx.db.get(tx.userId);
                } else if (slot && slot.userId) {
                    user = await ctx.db.get(slot.userId);
                }
            }
            return { ...tx, slot, user };
        }));

        return enriched;
    },
});
