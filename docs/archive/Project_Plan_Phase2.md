# GrowPot Phase 2: Trust & Scale

**Objective:** Transform the MVP (Monthly Lottery) into a robust, scalable ROSCA platform capable of handling strangers (via ID verification) and professional chit funds (via complex financial models).

## 1. Sprint 6: Identity & Trust (High Priority)
*Goal: Move from "Social Trust" to "Verified Trust" to allow semi-anonymous groups.*

### Features
-   **Government ID Upload:** new field in `users` schema for secure document storage.
-   **Admin Dashboard:** A special view for Super Admins (or trusted Foremen) to review and approve IDs.
-   **Verification Badge:** Visual indicator (Green Checkmark) on user profiles and in the Pot Visualizer.

### Technical Implementation
-   **Schema:** `users.verificationDocId` (Storage ID), `users.verificationStatus` (PENDING, VERIFIED, REJECTED).
-   **Storage:** Secure bucket in Convex for ID documents (restricted access).
-   **UI:** File upload in Profile settings; "Admin Mode" toggle for reviewers.

## 2. Sprint 7: Financial Complexity
*Goal: Support professional chit fund models involving commissions, multiple slots, and variable frequencies.*

### Features
-   **Flexible Frequency:** Support Weekly, Bi-Weekly, and Quarterly payment schedules (currently only Monthly).
-   **Foreman Commission:** Configurable % deducted from the winner's pot (e.g., 5%).
-   **Multi-Slot Users:** Allow one user to hold multiple "Planets" (slots) in the same Pot.
-   **Fractional Shares:** (Optional) Allow splitting a single slot between 2+ users.

### Technical Implementation
-   **Schema:** Update `pots.config` to include `commissionPercentage`.
-   **Logic:** Update `payout` calculation in `transactions.ts` to deduct commission.
-   **UI:** Update Pot Visualizer to handle multiple planets per user (color-coded or grouped).

## 3. Sprint 8: Advanced Draw Logic
*Goal: Support non-random, pre-determined rotation cycles.*

### Features
-   **Fixed Sequence:** Foreman sets the order of winners at Pot creation (e.g., Member A -> Member B -> Member C).
-   **Occasional Draw:** Support for ad-hoc draws at irregular intervals (e.g., for specific events like wedding funds) while maintaining fairness tracking.

### Technical Implementation
-   **Schema:** `pots.drawType` (RANDOM, FIXED).
-   **Logic:** Conditional draw logic in Convex `actions`.

## 4. Sprint 9: Native Features & Re-engagement
*Goal: Make the app feel like a native mobile experience.*

### Features
-   **Push Notifications:** "Draw Started", "You Won", "Payment Due".
-   **Contact Picker:** Use the Web Contact Picker API to invite members directly from the phone book.
-   **Share Intents:** Native sharing of Pot Invite Links.

### Technical Implementation
-   **Notifications:** Integration with a service like OneSignal or Courier.
-   **PWA:** Service Worker updates for background sync (if possible) or periodic polling.
