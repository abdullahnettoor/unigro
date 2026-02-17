# **GrowPot Technical Blueprint: Implementation Guide**

This document serves as the implementation standard for developers building GrowPot. It combines high-integrity backend patterns with a high-fidelity, non-generic frontend aesthetic.

## **1\. Frontend Implementation (Aesthetics & UX)**

To avoid "AI Slop," the frontend must lean into a **"Communal FinTech"** aesthetic. Think organic shapes, deep Earth-tones contrasted with sharp digital accents, and intentional motion.

### **1.1 Visual Identity**

* **Typography:** \* *Headings:* **"Syne"** or **"Clash Display"** for a bold, distinctive geometric feel.  
  * *Body:* **"Plus Jakarta Sans"** for high readability with a modern edge.  
* **Color Palette:** Avoid the "Blue/Purple SaaS" look.  
  * **Primary:** Deep Forest (\#1B3022) or Midnight Clay (\#232931).  
  * **Accents:** Electric Moss (\#C1FF72) for CTAs and Terracotta (\#E07A5F) for alerts/draws. 
* **The "Pot View" Component:**  
  * **Implementation:** Use a custom SVG-based radial layout.  
  * **Aesthetic:** Clean, minimalist donut/radial chart. Segments represent members. Status indicated by color fill (e.g., Filled = Paid, Stroke = Pending).  
  * **Motion:** smooth, elegant transitions for the monthly draw. Simple rotation or highlighting of the winning segment.

### **1.2 PWA Architecture (Vite)**

* **Service Worker:** Use InjectManifest strategy via vite-plugin-pwa for fine-grained control over offline payment proof queueing.  
* **Offline State:** Implement a "Local First, Cloud Second" pattern. Use optimisticUpdate hooks in Convex to ensure the UI never lags, even on 2G connections.

## **2\. Backend Implementation (Convex & Clerk)**

The backend must act as a strict state machine to prevent financial discrepancies.

### **2.1 Schema Definition (convex/schema.ts)**

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
  }).index("by\_phone", \["phone"\]).index("by\_clerkId", \["clerkId"\]),

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
  }).index("by\_pot", \["potId"\]).index("by\_user\_pot", \["userId", "potId"\]),

  transactions: defineTable({  
    potId: v.id("pots"),  
    userId: v.id("users"),  
    monthIndex: v.number(),  
    status: v.union(v.literal("UNPAID"), v.literal("PENDING"), v.literal("PAID")),  
    proofUrl: v.optional(v.string()),  
  }).index("by\_pot\_month", \["potId", "monthIndex"\]),  
});

### **2.2 The "Ghost Claim" Logic**

When a user signs up via Clerk, the post-signup mutation must:

1. Check users table for a record with the matching phone.  
2. If it exists: Update isGhost: false, link the clerkId, and update profile details.  
3. If it doesn't: Create a new user record.  
4. **Transactionality:** This must happen in a single Convex mutation to ensure no one "steals" a ghost profile during the split-second of registration.

## **3\. Core Logic & Safety Guards**

### **3.1 The "Rule Lock" Guard**

Before any mutation that edits pots configuration, the backend MUST verify:  
const pot \= await db.get(args.potId);  
if (pot.status \!== "DRAFT") {  
  throw new Error("Cannot modify financial rules once a Pot is Active.");  
}

### **3.2 Automated Draw (Fairness Engine)**

The monthly draw should be implemented as a **Convex Action** if using a random seed, or a **Mutation** for the initial sequence.

* **Entropy:** Use crypto.getRandomValues to ensure true randomness for the monthly "spin."  
* **Verification:** Log the "timestamp" and "seed" used for the draw to provide an audit trail for members if they question the fairness.

### **3.3 Image Handling**

* Use storage.generateUploadUrl() for payment screenshots.  
* Implement an expiration logic: If a pot is closed for \>1 year, images can be purged to save storage costs while keeping the text-based ledger intact.

## **4\. Development Milestones (The "Dev Sprint")**

1. **Sprint 1:** Auth & Ghost Sync (Clerk \+ Convex).  
2. **Sprint 2:** Pot State Machine (Draft/Active/Lock).  
3. **Sprint 3:** Radial "Pot View" UI & Physics-based Draw Animation.  
4. **Sprint 4:** Offline PWA Support & Payment Queueing.  
5. **Sprint 5:** Foreman ID Verification Dashboard.