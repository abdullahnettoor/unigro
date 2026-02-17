# **GrowPot Product Requirements Document (PRD) v3.0**

**Version:** 3.0
**Status:** Living Document (Updated Feb 17, 2026)
**Architecture:** Slot-First (V3)

## **1. Executive Summary**

**GrowPot** is a digital platform for managing community chit funds (ROSCAs). Unlike traditional tools that focus on "User Management," GrowPot uses a **Slot-First Architecture**. This allows flexible financial modeling where a pot consists of fixed *Slots* (financial positions), which can be held by single users, multiple users (split ownership), or even unsold (ghost slots).

The platform prioritizes **transparency, financial integrity, and trust**, bridging the gap between informal social savings and professional fund management.

## **2. Core Architecture: Slot-First**

The fundamental unit of the system is the **Slot**, not the User.

-   **Pot Definition:** A Pot is defined by `Total Slots` x `Contribution Amount`.
-   **One Slot = One Draw:** Each slot represents one chance to win the pot.
-   **Ownership:**
    -   **Standard:** 1 User owns 1 Slot.
    -   **Multi-Slot:** 1 User owns N Slots (e.g., wealthy member taking 3 positions).
    -   **Split/Fractional:** N Users share 1 Slot (e.g., 2 neighbors splitting a ₹10k installment).
-   **Duration:** Strictly equal to `Total Slots` (unless Double Draw logic is active).

## **3. User Roles & Identity**

### **3.1 Global Roles**
-   **Foreman:** The creator and administrator of a Pot. *Must be Identity Verified.*
-   **Member:** A participant holding at least one slot (or a share of a slot).
-   **Ghost Member:** An unregistered participant added by the Foreman (Name + Phone). Valid slots are reserved for them until they claim their account.

### **3.2 Authentication & Verification**
-   **Auth:** Clerk (Social / Phone).
-   **Ghost Claim:** Registration links to existing Ghost records via **Phone Number**.
-   **Identity Verification (Phase 5):**
    -   **Mandatory for Foremen.**
    -   **Process:** Upload Govt ID (Aadhaar/PAN) -> Admin Review -> Verified Badge.
    -   **Status:** `UNVERIFIED` -> `PENDING` -> `VERIFIED` (or `REJECTED`).

## **4. Functional Requirements**

### **4.1 Pot Configuration Matrix**

| Chit Type | Frequency | Duration Logic | Member / Share Rules | Draw Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Monthly** | Monthly | Fixed (e.g., 20) | 1 Slot : 1 User | Random / Manual | ✅ Ready |
| **Weekly / Bi-Weekly** | Weekly / Bi-Weekly | Fixed | 1 Slot : 1 User | Random / Manual | ✅ Ready |
| **Occasional (Event)** | Occasional | = Members | 1 Slot : 1 User | Manual Trigger | ✅ Ready |
| **Fixed Sequence** | Any | Fixed | 1 Slot : 1 User | Pre-defined | ✅ Ready |
| **Multi-Slot User** | Any | Fixed | N Slots : 1 User | Random | ✅ Ready |
| **Fractional Share** | Any | Fixed | 1 Slot : N Users | Random | ✅ Ready |

### **4.2 Lifecycle & State Machine**
1.  **DRAFT:** Foreman configures parameters (`Total Value`, `Frequency`, `Commission`).
    -   *Editable:* All fields.
    -   *Action:* Add Slots (Ghost or Invite).
2.  **LOCK:** Configuration finalized.
    -   *Constraint:* 100% of slots must be `FILLED` or `RESERVED`.
3.  **ACTIVE:** First cycle begins.
    -   *Immutable:* Financial rules (Amount, Frequency).
    -   *Action:* Run Draws, Record Payments.
4.  **COMPLETED:** All cycles finished.
5.  **ARCHIVED:** History preserved, no further actions.

### **4.3 Financial Logic**
-   **Contribution:** `Total Value / Total Slots`.
-   **Foreman Commission:** Optional % deducted from the **Winner's Payout** (not added to contributions).
-   **Split Ownership:**
    -   Users pay according to `sharePercentage`.
    -   Payouts are distributed according to `sharePercentage`.
    -   Voting/Decisions: Primary Slot Owner (usually majority holder) decides? *Currently: Slots are passive in draws.*

### **4.4 The Ledger & History**
-   **Transactions:** Linked to `SlotID` + `Cycle (MonthIndex)`.
-   **Collection Bar:** Progress calculated by summing `paid_amount / expected_amount` (handling split shares).
-   **Backdating:** Foremen can record cash payments with historical dates.
-   **Missed Payments:** "Pay Now" actions available for past unpaid cycles.

## **5. Technical Stack**

-   **Frontend:** React, Vite, Tailwind CSS, Shadcn/UI (Radix).
-   **Backend:** Convex (Real-time DB, Scheduling, Storage).
-   **Auth:** Clerk.
-   **PWA:** `vite-plugin-pwa` (Offline ready).

## **6. Component Map (Key Files)**

-   `src/components/PotVisualizer.tsx`: The radial "Solar System" view of the pot.
-   `src/components/PotHistory.tsx`: Timeline of past cycles and payment status.
-   `src/pages/PotDetail.tsx`: Main hub (Dashboard, Rules, Slots, History, Admin).
-   `convex/schema.ts`: Defines `pots`, `slots` (the core), `transactions`, `split_ownership`.
-   `convex/actions/draw.ts`: Fair random selection logic (future migration to Actions).

## **7. Roadmap & Status**

### **Completed (Sprints 1-13)**
-   [x] **Foundation:** Auth, Ghost System, Slot-First Schema.
-   [x] **Pot Management:** Create, Edit, Lifecycle (Draft->Active->Archive).
-   [x] **Core Mechanics:** Random Draws, Manual Overrides, Occasional Pots.
-   [x] **Financials:** Split Slots, Backdated Payments, Commission Logic.
-   [x] **Transparency:** Pot History, Collection Bars, Payment Receipts.
-   [x] **Identity:** ID Upload, Admin Verification Dashboard.
-   [x] **UX:** Dashboard Split (Managed vs Invested).

### **Upcoming (Sprint 14+)**
-   [ ] **Notifications:** Email/SMS Transactional alerts.
-   [ ] **Mobile Polish:** Complex table responsiveness.
-   [ ] **Payment Gateway:** Razorpay/Stripe integration (Future).
