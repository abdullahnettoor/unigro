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
        if (slot.userId !== user._id) throw new Error("You do not own this slot");
        if (slot.potId !== args.potId) throw new Error("Slot does not belong to this pot");

        // Check if transaction exists
        const existingTx = await ctx.db
            .query("transactions")
            .withIndex("by_pot_month", (q) => q.eq("potId", args.potId).eq("monthIndex", args.monthIndex))
            .filter((q) => q.eq(q.field("slotId"), args.slotId))
            .unique();

        let proofUrl = undefined;
        if (args.storageId) {
            proofUrl = await ctx.storage.getUrl(args.storageId) || undefined;
        }

        const data = {
            status: "PENDING" as const,
            proofUrl,
            remarks: args.remarks,
            type: args.type,
        };

        if (existingTx) {
            await ctx.db.patch(existingTx._id, data);
        } else {
            await ctx.db.insert("transactions", {
                potId: args.potId,
                slotId: args.slotId,
                monthIndex: args.monthIndex,
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
        const existingTx = await ctx.db
            .query("transactions")
            .withIndex("by_pot_month", (q) => q.eq("potId", args.potId).eq("monthIndex", args.monthIndex))
            .filter((q) => q.eq(q.field("slotId"), args.slotId))
            .unique();

        if (existingTx) {
            await ctx.db.patch(existingTx._id, {
                status: "PAID",
                remarks: "Cash Payment Recorded by Foreman"
            });
        } else {
            await ctx.db.insert("transactions", {
                potId: args.potId,
                slotId: args.slotId,
                monthIndex: args.monthIndex,
                status: "PAID",
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

        await ctx.db.patch(args.transactionId, { status: "PAID" });
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
                if (slot && slot.userId) {
                    user = await ctx.db.get(slot.userId);
                }
            }
            return { ...tx, slot, user };
        }));

        return enriched;
    },
});
