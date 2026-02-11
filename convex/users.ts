import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
                    isVerified: ghostUser.isVerified, // Keep existing verification status if any
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
            isVerified: false,
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
            if (ghost._id === user._id) continue; // Should not happen, but safety check

            // 1. Migrate Memberships
            const memberships = await ctx.db
                .query("members")
                .withIndex("by_user_pot", (q) => q.eq("userId", ghost._id))
                .collect();

            for (const membership of memberships) {
                // Check if current user is already in this pot (edge case)
                const existingMembership = await ctx.db
                    .query("members")
                    .withIndex("by_user_pot", (q) => q.eq("userId", user._id).eq("potId", membership.potId))
                    .unique();

                if (!existingMembership) {
                    // Transfer membership to current user
                    await ctx.db.patch(membership._id, {
                        userId: user._id,
                        isGhost: false
                    });
                } else {
                    // Already a member? Just delete the ghost membership
                    await ctx.db.delete(membership._id);
                }
            }

            // 2. Migrate Transactions (if any recorded for ghost)
            const transactions = await ctx.db
                .query("transactions")
                .filter((q) => q.eq(q.field("userId"), ghost._id)) // No index on userId alone, scan is okay for small scale
                .collect();

            for (const tx of transactions) {
                await ctx.db.patch(tx._id, { userId: user._id });
            }

            // 3. Delete Ghost User
            await ctx.db.delete(ghost._id);
        }
    },
});
