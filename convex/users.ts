import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

declare const process: any;

/**
 * Stores a user in the database after Clerk authentication.
 * Implements the "Guest Claim" logic:
 * 1. Checks if a user with the same phone number exists (Guest).
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

        const identityAny = identity as any;
        const phoneNumber = identityAny.phoneNumber || identityAny.phone_number || identityAny.phone;

        // Check if user already exists by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user !== null) {
            if (user.name !== identity.name || user.pictureUrl !== identity.pictureUrl) {
                await ctx.db.patch(user._id, {
                    name: identity.name || "Anonymous",
                    pictureUrl: identity.pictureUrl,
                    email: identity.email,
                });
            }
            return user._id;
        }

        // If we have a phone number, check for a Guest record
        if (phoneNumber) {
            const guestUser = await ctx.db
                .query("users")
                .withIndex("by_phone", (q) => q.eq("phone", phoneNumber))
                .unique();

            if (guestUser) {
                // Claim the Guest Account!
                await ctx.db.patch(guestUser._id, {
                    clerkId: identity.subject,
                    name: identity.name || guestUser.name,
                    pictureUrl: identity.pictureUrl,
                    email: identity.email,
                    verificationStatus: guestUser.verificationStatus,
                });
                return guestUser._id;
            }
        }

        // Create new user
        const newUserId = await ctx.db.insert("users", {
            name: identity.name || "Anonymous",
            clerkId: identity.subject,
            pictureUrl: identity.pictureUrl,
            email: identity.email,
            phone: phoneNumber || "",
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

        // --- GUEST CLAIM LOGIC ---
        // Find any "Guest" users with this phone number (no clerkId)
        const guests = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .filter((q) => q.eq(q.field("clerkId"), undefined))
            .collect();

        for (const guest of guests) {
            if (guest._id === user._id) continue;

            // 1. Migrate Seats (Ownership)
            const userSeats = await ctx.db
                .query("seats")
                .withIndex("by_user_pool", (q) => q.eq("userId", guest._id))
                .collect();

            for (const seat of userSeats) {
                // Transfer ownership to current user
                await ctx.db.patch(seat._id, {
                    userId: user._id,
                    isGuest: false
                });
            }

            // 2. Migrate Transactions
            const allTransactions = await ctx.db.query("transactions").collect();
            for (const tx of allTransactions) {
                if (tx.userId === guest._id) {
                    await ctx.db.patch(tx._id, {
                        userId: user._id
                    });
                }
            }

            // 3. Migrate Seat Shares
            const seatShares = await ctx.db
                .query("seat_shares")
                .withIndex("by_user", (q) => q.eq("userId", guest._id))
                .collect();

            for (const share of seatShares) {
                await ctx.db.patch(share._id, {
                    userId: user._id
                });
            }

            // 4. Delete Guest User
            await ctx.db.delete(guest._id);
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

export const editGuest = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        phone: v.string()
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("Guest user not found");

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


