import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        phone: v.string(), // Primary Key for Ghost linking
        email: v.optional(v.string()),
        clerkId: v.optional(v.string()), // Null for Ghosts
        pictureUrl: v.optional(v.string()),
        verificationStatus: v.union(
            v.literal("UNVERIFIED"),
            v.literal("PENDING"),
            v.literal("VERIFIED"),
            v.literal("REJECTED")
        ),
        verificationDocId: v.optional(v.string()), // ID of the uploaded doc
        idType: v.optional(v.string()), // e.g. "Aadhaar", "PAN"
        idNumber: v.optional(v.string()),
        adminNotes: v.optional(v.string()),
    })
        .index("by_phone", ["phone"])
        .index("by_clerkId", ["clerkId"]),

    pots: defineTable({
        title: v.string(),
        foremanId: v.id("users"),
        description: v.optional(v.string()), // New: Pot rules/welcome
        bankDetails: v.optional(v.string()), // New: UPI/Bank info
        drawStrategy: v.optional(
            v.union(v.literal("RANDOM"), v.literal("MANUAL"), v.literal("FIXED"))
        ), // Default RANDOM
        startDate: v.optional(v.number()), // Epoch timestamp
        nextDrawDate: v.optional(v.number()), // Explicit next draw date (for occasional)
        config: v.object({
            totalValue: v.number(),
            contribution: v.number(),
            frequency: v.union(
                v.literal("monthly"),
                v.literal("weekly"),
                v.literal("biweekly"),
                v.literal("quarterly"),
                v.literal("occasional")
            ),
            duration: v.number(), // periods (months/weeks)
            commission: v.optional(v.number()), // New: Percentage (0-100)
            gracePeriodDays: v.optional(v.number()), // New: Buffer between Due Date and Draw Date
        }),
        status: v.union(v.literal("DRAFT"), v.literal("ACTIVE"), v.literal("COMPLETED"), v.literal("ARCHIVED")),
        currentMonth: v.number(),
    }),

    members: defineTable({
        potId: v.id("pots"),
        userId: v.id("users"),
        drawOrder: v.optional(v.number()),
        isGhost: v.boolean(),
        status: v.optional(v.union(v.literal("ACTIVE"), v.literal("REQUESTED"), v.literal("REJECTED"))),
        share: v.optional(v.number()), // Future-proof: Default 1.0 (Full share)
        sequence: v.optional(v.number()), // For FIXED strategy
    })
        .index("by_pot", ["potId"])
        .index("by_user_pot", ["userId", "potId"]),

    transactions: defineTable({
        potId: v.id("pots"),
        userId: v.id("users"),
        monthIndex: v.number(),
        status: v.union(v.literal("UNPAID"), v.literal("PENDING"), v.literal("PAID")),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"), v.literal("payout"))),
        proofUrl: v.optional(v.string()),
        remarks: v.optional(v.string()),
    }).index("by_pot_month", ["potId", "monthIndex"]),
});
