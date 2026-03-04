import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./auth";

// 1. Generate Upload URL for ID Document
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return await ctx.storage.generateUploadUrl();
    },
});

// 2. Submit Document for Verification
export const submit = mutation({
    args: {
        storageId: v.id("_storage"),
        idNumber: v.optional(v.string()),
        idType: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            verificationDocId: args.storageId,
            verificationStatus: "PENDING",
            idNumber: args.idNumber,
            idType: args.idType
        });
    },
});

// 3. Admin: Get Pending Verifications
export const getPending = query({
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const users = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("verificationStatus"), "PENDING"))
            .collect();

        // Get Image URLs
        return await Promise.all(
            users.map(async (u) => ({
                ...u,
                docUrl: u.verificationDocId ? await ctx.storage.getUrl(u.verificationDocId) : null,
            }))
        );
    },
});

// 4. Admin: Review Verification
export const review = mutation({
    args: {
        userId: v.id("users"),
        status: v.union(v.literal("VERIFIED"), v.literal("REJECTED")),
        notes: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        await ctx.db.patch(args.userId, {
            verificationStatus: args.status,
            adminNotes: args.notes
        });
    },
});
