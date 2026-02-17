# GrowPot Project Plan - Phase 3: Slot-First Architecture & UI Revamp

**Goal:** Transition the application to a robust "Slot-First" architecture to support complex chit fund models (multi-slot, fractional) and revamp the UI for better transparency and usability.

---

## 1. Sprint 11: Architecture V3 (Slot-First Migration) 🏗️
*Objective: Rebuild the core data model around "Slots" instead of just Users, enabling multi-slot ownership and simpler draw logic.*

### 🛠️ Breaking Changes
-   **Database Reset:** Clear `pots`, `members`, and `transactions` tables to implement the new schema cleanly.

### 📋 Schema Changes
-   **Pots Table:**
    -   Add `totalSlots` (number).
    -   Remove `drawStrategy` (simplified to Slot logic).
    -   Validation: `Validation: Duration * Payouts/Cycle = Total Slots`.
-   **Slots Table (New/Modified Members):**
    -   Rename `members` table to `slots` (or keep as `members` but treat as slots uniqueness).
    -   Fields: `potId`, `slotNumber` (1 to N), `userId` (Owner), `status` (OPEN/FILLED).
    -   **Foreman First:** Logic to auto-assign Slot 1 to Foreman if enabled.

### ⚙️ Backend Logic
-   **Create Pot:** accepts `totalSlots` and `foremanFirst` flag.
-   **Join Pot:** User claims a specific *Slot Number* (or next available).
-   **Draw Logic:** Selects a **Slot**, not a User.
-   **Payment Logic:** Tracks payments per *Slot*. One user with 2 slots makes 2 payments.

---

## 2. Sprint 12: Transparency & History 📜
*Objective: Enhance trust by allowing members to view and correct their financial history.*

### 💸 Missed Payments Recovery
-   **Logic:** Allow members to create `recordPayment` transactions for *past cycles* (`monthIndex < currentMonth`).
-   **UI:** "Pay Now" button available for any cycle with status `PENDING` or `UNPAID` in the history view.

### 📊 Pot History View
-   **Component:** `HistoryTable` or `CycleTimeline`.
-   **Data:** For each past cycle:
    -   Winner (Slot # & User).
    -   Winning Amount.
    -   My Payment Status (Paid/Pending).

---

## 3. Sprint 13: Dashboard & UX Polish ✨
*Objective: Improve navigation and segregation of duties.*

### 🏠 Dashboard Revamp
-   **Split View:**
    -   **"Managed by Me":** Pots where `foremanId === currentUser`.
    -   **"My Investments":** Pots where user holds a slot (but is not Foreman).
-   **Dynamic Headers:** Replace hardcoded "Managed by Foreman" with `Managed by [Foreman Name]`.

### 🧭 Navigation
-   **Logo Link:** Ensure Top-Left Logo links to `/dashboard` (or `/` if landing is different).
-   **Member View:** Harmonize "Foreman View" and "Member View" to be consistent, only hiding sensitive controls.

---

## 4. Migration Plan (Immediate)
1.  **Clear Data:** TRUNCATE `pots`, `members`, `transactions`.
2.  **Deploy Schema:** Push new schema code.
3.  **Verify:** Create a test "Foreman First" pot with 5 slots.
