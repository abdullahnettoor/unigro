# Project Checkpoint - Feb 12, 2026

## Overview
This checkpoint marks the completion of **Phase 2: Trust & Scale** (Sprints 6-10). The generic "Pot" mechanism has been refined into a robust financial tool with flexible scheduling, lifecycle management, and security features.

## Completed Features (Sprints 6-10)

### 1. Identity & Trust (Sprint 6)
-   **Verification System:** Users can upload ID documents (Aadhaar/PAN) to secure storage.
-   **Admin Dashboard:** Admins can review and approve/reject verification requests.
-   **Profile Badges:** Verified users get a "Verified" badge, increasing trust.

### 2. Financial Complexity (Sprint 7)
-   **Flexible Frequencies:** Weekly, Bi-weekly, Quarterly, and Monthly options.
-   **Foreman Commission:** Configurable commission percentage (e.g., 5%) deducted from the winning amount.
-   **Grace Periods:** "Next Due Date" and "Next Draw Date" are calculated with a configurable buffer.

### 3. Advanced Draw Logic (Sprint 8)
-   **Manual Draw:** Foremen can manually select a winner (e.g., for bidding/auction styles).
-   **Fixed Sequence:** Support for pre-determined draw orders (e.g., Slot 1 gets Cycle 1).
-   **Notification Infrastructure:** Foundation for push notifications on critical events.

### 4. Real-World Scheduling (Sprint 9)
-   **Occasional Pots:** "Event-based" pots (e.g., Marriage Fund) with on-demand rounds.
-   **Calendar Integration:** Real dates (e.g., "Oct 1, 2024") replace generic "Month 1" labels.
-   **Draft Editing:** Foremen can modify pot details while in Draft mode.

### 5. Lifecycle & Archival (Sprint 10)
-   **Automated Duration:** Occasional pots automatically set duration = number of members (1:1 ratio).
-   **Completion Logic:** Pots auto-complete when all cycles are finished.
-   **Archival:** Foremen can archive completed pots after ensuring all payouts are recorded.
-   **Payout Tracking:** Explicit "Record Payout" action for Foremen to track off-platform transfers.

## Current Architecture

### Schema (`convex/schema.ts`)
-   **Users:** `verificationStatus`, `idType`, `clerkId`.
-   **Pots:** `frequency` (includes 'occasional'), `startDate`, `nextDrawDate`, `status` (DRAFT, ACTIVE, COMPLETED, ARCHIVED).
-   **Transactions:** `type` ('cash', 'online', 'payout'), `proofUrl`.

### Key Components
-   `CreatePot.tsx`: Dynamic wizard handling all frequencies and edit modes.
-   `PotDetail.tsx`: Central hub for Member status, Foreman controls, and Draw logic.
-   `PaymentComponents.tsx`: Modular payment status and proof upload cards.

## Next Steps
-   **Phase 3:** Validating real-world usage simulations.
-   **Performance:** Stress testing with large groups.
-   **Mobile Polish:** Ensuring PWA constraints are met (Project Goal).

## Known Issues / Notes
-   *None critical.* Payout verification is currently trust-based (Foreman confirms). Future updates could add Member confirmation.
