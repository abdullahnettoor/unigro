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
        description: v.optional(v.string()),
        bankDetails: v.optional(v.string()),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))), // Restored
        startDate: v.optional(v.number()),
        nextDrawDate: v.optional(v.number()),
        config: v.object({
            totalValue: v.number(),
            totalSlots: v.number(), // New: Explicit Slot Count
            contribution: v.number(),
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
        }),
        status: v.union(v.literal("DRAFT"), v.literal("ACTIVE"), v.literal("COMPLETED"), v.literal("ARCHIVED")),
        currentMonth: v.number(),
    }),

    slots: defineTable({
        potId: v.id("pots"),
        slotNumber: v.number(), // 1 to N
        userId: v.optional(v.id("users")), // Null = Open Slot
        status: v.union(v.literal("OPEN"), v.literal("RESERVED"), v.literal("FILLED")),
        isGhost: v.boolean(),
        // Billing & Winnings
        drawOrder: v.optional(v.number()), // Cycle specific winner
    })
        .index("by_pot", ["potId"])
        .index("by_user", ["userId"]) // For listing pots by user
        .index("by_user_pot", ["userId", "potId"])
        .index("by_pot_slotNumber", ["potId", "slotNumber"]),

    transactions: defineTable({
        potId: v.id("pots"),
        slotId: v.id("slots"),
        monthIndex: v.number(),
        status: v.union(v.literal("UNPAID"), v.literal("PENDING"), v.literal("PAID")),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"), v.literal("payout"))),
        proofUrl: v.optional(v.string()),
        remarks: v.optional(v.string()),
    }).index("by_pot_month", ["potId", "monthIndex"]),
});
