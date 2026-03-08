import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        phone: v.string(), // Primary Key for Guest linking
        email: v.optional(v.string()),
        clerkId: v.optional(v.string()), // Null for Guests
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

    pools: defineTable({
        title: v.string(),
        organizerId: v.id("users"),
        terms: v.optional(v.string()),
        paymentDetails: v.optional(v.object({
            upiId: v.optional(v.string()),
            accountName: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifsc: v.optional(v.string()),
            note: v.optional(v.string()),
        })),
        drawStrategy: v.optional(v.union(v.literal("RANDOM"), v.literal("MANUAL"))),
        startDate: v.optional(v.number()),
        nextDrawDate: v.optional(v.number()),
        config: v.object({
            totalValue: v.number(),
            totalSeats: v.number(),
            contribution: v.number(),
            currency: v.optional(v.string()),
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
        currentRound: v.number(),
    }),

    seats: defineTable({
        poolId: v.id("pools"),
        seatNumber: v.number(), // 1 to N
        userId: v.optional(v.id("users")), // Null = Open Seat. Primary owner if not co-seat.
        status: v.union(v.literal("OPEN"), v.literal("RESERVED"), v.literal("FILLED")),
        isGuest: v.boolean(),
        isCoSeat: v.optional(v.boolean()), // True if multiple owners
        // Billing & Winnings
        roundWon: v.optional(v.number()), // Round-specific winner
    })
        .index("by_pool", ["poolId"])
        .index("by_user", ["userId"])
        .index("by_user_pool", ["userId", "poolId"])
        .index("by_pool_seatNumber", ["poolId", "seatNumber"]),

    seat_shares: defineTable({
        seatId: v.id("seats"),
        userId: v.id("users"),
        sharePercentage: v.number(), // e.g., 50 (for 50%)
        status: v.union(v.literal("ACTIVE"), v.literal("REMOVED")),
    })
        .index("by_seat", ["seatId"])
        .index("by_user", ["userId"]),

    transactions: defineTable({
        poolId: v.id("pools"),
        seatId: v.id("seats"),
        userId: v.optional(v.id("users")), // Track who made the payment (crucial for co-seats)
        roundIndex: v.number(),
        status: v.union(v.literal("UNPAID"), v.literal("PENDING"), v.literal("PAID")),
        type: v.optional(v.union(v.literal("cash"), v.literal("online"), v.literal("payout"))),
        paidAt: v.optional(v.number()), // Actual payment date
        proofUrl: v.optional(v.string()),
        remarks: v.optional(v.string()),
    }).index("by_pool_round", ["poolId", "roundIndex"]),
});
