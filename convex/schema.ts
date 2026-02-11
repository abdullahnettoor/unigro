import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        phone: v.string(), // Primary Key for Ghost linking
        email: v.optional(v.string()),
        clerkId: v.optional(v.string()), // Null for Ghosts
        pictureUrl: v.optional(v.string()),
        isVerified: v.boolean(),
        verificationDocId: v.optional(v.string()), // ID of the uploaded doc
    })
        .index("by_phone", ["phone"])
        .index("by_clerkId", ["clerkId"]),

    pots: defineTable({
        title: v.string(),
        foremanId: v.id("users"),
        config: v.object({
            totalValue: v.number(),
            contribution: v.number(),
            frequency: v.string(), // "monthly"
            duration: v.number(), // months
        }),
        status: v.union(v.literal("DRAFT"), v.literal("ACTIVE"), v.literal("CLOSED")),
        currentMonth: v.number(),
    }),

    members: defineTable({
        potId: v.id("pots"),
        userId: v.id("users"),
        drawOrder: v.optional(v.number()),
        isGhost: v.boolean(),
        status: v.optional(v.union(v.literal("ACTIVE"), v.literal("REQUESTED"), v.literal("REJECTED"))), // Default ACTIVE if undefined (legacy)
    })
        .index("by_pot", ["potId"])
        .index("by_user_pot", ["userId", "potId"]),

    transactions: defineTable({
        potId: v.id("pots"),
        userId: v.id("users"),
        monthIndex: v.number(),
        status: v.union(v.literal("UNPAID"), v.literal("PENDING"), v.literal("PAID")),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"))),
        proofUrl: v.optional(v.string()),
        remarks: v.optional(v.string()),
    }).index("by_pot_month", ["potId", "monthIndex"]),
});
