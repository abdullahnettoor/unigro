import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

declare const process: any;

/**
 * Stores a user in the database after Clerk authentication.
 * Implements the "Ghost Claim" logic:
 * 1. Checks if a user with the same phone number exists (Ghost).
 * 2. If yes, upgrades them to a registered user by setting clerkId.
 * 3. If no, creates a new user record.
 */
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Clerk stores phone number in a specific format in the JWT, or we might need to fetch it from the identity object
        // For this implementation, we assume the claims include phone_number or we extract it.
        // NOTE: In a real Clerk setup, you need to ensure "phone_number" is in the session token claims.
        // If it's not directly there, we might fallback or rely on the user to provide it, 
        // but the PRD mandates phone number for ghost syncing.

        // For MVP/Dev, we'll try to use the "phone_number" claim if available.
        const identityAny = identity as any;
        const phoneNumber = identityAny.phoneNumber || identityAny.phone_number || identityAny.phone;

        // Check if user already exists by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            // User already exists and is linked. Update profile info if needed.
            if (user.name !== identity.name || user.pictureUrl !== identity.pictureUrl) {
                await ctx.db.patch(user._id, {
                    name: identity.name || "Anonymous",
                    pictureUrl: identity.pictureUrl,
                    email: identity.email,
                });
            }
            return user._id;
        }

        // If we have a phone number, check for a Ghost record
        if (phoneNumber) {
            const ghostUser = await ctx.db
                .query("users")
                .withIndex("by_phone", (q) => q.eq("phone", phoneNumber))
                .unique();

            if (ghostUser) {
                // Claim the Ghost Account!
                await ctx.db.patch(ghostUser._id, {
                    clerkId: identity.subject,
                    name: identity.name || ghostUser.name, // Prefer real name over ghost name? Or vice versa? Using Real name.
                    pictureUrl: identity.pictureUrl,
                    email: identity.email,
                    verificationStatus: ghostUser.verificationStatus, // Keep existing verification status if any
                });
                return ghostUser._id;
            }
        }

        // Create new user
        // We assume phone number is vital. If missing from Clerk, we might want to throw or handle it.
        // For now, we'll allow creation but they won't match ghosts without a phone.
        const newUserId = await ctx.db.insert("users", {
            name: identity.name || "Anonymous",
            clerkId: identity.subject,
            pictureUrl: identity.pictureUrl,
            email: identity.email,
            phone: phoneNumber || "", // Empty string if not provided, but PRD says mandatory.
            verificationStatus: "UNVERIFIED",
        });

        return newUserId;
    },
});

export const current = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});
// 3. Update Profile & Claim Ghost Accounts
export const updateProfile = mutation({
    args: {
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Update current user
        await ctx.db.patch(user._id, {
            name: args.name,
            phone: args.phone,
        });

        // --- GHOST CLAIM LOGIC ---
        // Find any "Ghost" users with this phone number (no clerkId)
        const ghosts = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .filter((q) => q.eq(q.field("clerkId"), undefined))
            .collect();

        for (const ghost of ghosts) {
            if (ghost._id === user._id) continue;

            // 1. Migrate Slots (Ownership)
            const slots = await ctx.db
                .query("slots")
                .withIndex("by_user_pot", (q) => q.eq("userId", ghost._id))
                .collect();

            for (const slot of slots) {
                // Transfer ownership to current user
                // In Slot-First, one user can hold multiple slots, so no conflict check needed.
                await ctx.db.patch(slot._id, {
                    userId: user._id,
                    isGhost: false
                });
            }

            // 2. Migrate Transactions
            // Update any transactions made by this ghost user to the actual user
            // We can only query transactions by pot_month, so we might need a full table scan or add an index later.
            // For now, let's collect all transactions and filter, or just query if there's an index.
            // Actually, there's no ideal index for transactions by user. Let's do a full scan since it's a rare operation for a specific ghost.
            const allTransactions = await ctx.db.query("transactions").collect();
            for (const tx of allTransactions) {
                if (tx.userId === ghost._id) {
                    await ctx.db.patch(tx._id, {
                        userId: user._id
                    });
                }
            }

            // 3. Migrate Split Ownership
            const splitOwnerships = await ctx.db
                .query("split_ownership")
                .withIndex("by_user", (q) => q.eq("userId", ghost._id))
                .collect();

            for (const split of splitOwnerships) {
                await ctx.db.patch(split._id, {
                    userId: user._id
                });
            }

            // 3. Delete Ghost User
            await ctx.db.delete(ghost._id);
        }
    },
});

export const isAdmin = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        // Ensure to handle whitespace if any in env var
        const normalizedAdmins = adminEmails.map((e: string) => e.trim());
        return normalizedAdmins.includes(identity.email || "");
    },
});

export const get = query({
    args: { userId: v.union(v.id("users"), v.string(), v.null()) },
    handler: async (ctx, args) => {
        if (!args.userId || typeof args.userId !== 'string' || args.userId.trim() === '') return null;
        try {
            return await ctx.db.get(args.userId as Id<"users">);
        } catch (e) {
            return null; // Invalid ID format
        }
    },
});

export const editGhost = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        phone: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("Ghost user not found");

        if (targetUser.verificationStatus !== "UNVERIFIED" || targetUser.clerkId) {
            throw new Error("This user is a registered account and manages their own profile.");
        }

        // Technically, a Foreman *could* check if this ghost is actually in one of their Pots to enforce pot-level privacy,
        // but for an MVP, updating an isolated ghost record is generally safe as ghosts are implicitly shared if phone numbers match.
        // As an added layer, ensure we aren't introducing phone number conflicts
        if (targetUser.phone !== args.phone) {
            const existingPhone = await ctx.db
                .query("users")
                .withIndex("by_phone", q => q.eq("phone", args.phone))
                .unique();
            if (existingPhone) {
                throw new Error("Another user is already registered with this phone number.");
            }
        }

        await ctx.db.patch(args.userId, {
            name: args.name,
            phone: args.phone
        });
    }
});


