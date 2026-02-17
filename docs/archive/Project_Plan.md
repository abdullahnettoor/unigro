# GrowPot Project Plan & Task Breakdown

**Version:** 1.0
**Based on:** PRD v2.0 & Technical Blueprint
**Status:** Planning

## Executive Summary
This document outlines the detailed project tasks, phases, and dependencies for building GrowPot, a PWA for managing fixed-contribution community chit funds. The plan follows the "Dev Sprint" structure defined in the Technical Blueprint, breaking down each sprint into actionable engineering tasks.

---

## Phase 1: Foundation, User Identity & Ghost System (Sprint 1)
**Goal:** Establish the technical foundation, authentication, and the core "Ghost Member" identity system.

### Dependencies
*   **External:** Clerk Account, Convex Project Setup.
*   **Internal:** None.

### Tasks
#### 1.1 Infrastructure & Setup
- [ ] **Initialize Monorepo/Project:** Set up Vite + React (PWA template).
- [ ] **Install Core Dependencies:** `convex`, `clerk/clerk-react`, `framer-motion`, `lucide-react`.
- [ ] **Setup Styling Engine:** Configure Utility-first CSS (Tailwind or similar per preference, though Blueprint suggests custom aesthetic). *Note: Blueprint specifies "Vanilla CSS" or specific non-generic look. We will set up the CSS variable foundation for the "Deep Forest" palette.*
- [ ] **Convex Init:** Initialize `convex` directory and `convex.json`.

#### 1.2 Authentication & Schema (Backend)
- [ ] **Schema Definition (Users):** Create `users` table with `phone` (index), `clerkId` (index), `isVerified`, etc.
- [ ] **Clerk Integration:** Configure Clerk with Google/Social providers and **mandate Phone Number**.
- [ ] **Auth Mutation:** Implement `storeUser` mutation.
    -   *Logic:* Check for existing "Ghost" user by phone number.
    -   *Claim:* If exists, link `clerkId` to existing record (Ghost Claim).
    -   *New:* If not, create new Active User record.

#### 1.3 Frontend Foundation
- [ ] **Layout Shell:** Create high-fidelity App Shell (Mobile First).
- [ ] **Auth Screens:** Custom Login/Signup UI integration with Clerk.
- [ ] **User Profile:** View/Edit profile details (synced with Clerk).

---

## Phase 2: Pot Lifecycle & State Machine (Sprint 2)
**Goal:** Enable users (Foremen) to create pots, add members, and lock the configuration.

### Dependencies
*   **Phase 1:** User authentication and identity are required to associate Foremen and Members.

### Tasks
#### 2.1 Pot Schema & Logic (Backend)
- [ ] **Schema Definition (Pots):** Create `pots` table (`config`, `status`, `currentMonth`).
- [ ] **Schema Definition (Members):** Create `members` table linking `potId` and `userId` (supports Ghost users).
- [ ] **Mutation `createPot`:** Allow creation of DRAFT pots.
- [ ] **Mutation `addMember`:**
    -   *Existing User:* Link via `userId`.
    -   *Ghost User:* Create new `users` record (Ghost) with Name + Phone, then link.
- [ ] **Mutation `activatePot`:** Logic to transition status DRAFT -> ACTIVE.
    -   *Validation:* Ensure minimum members, valid config.
    -   *Rule Lock:* Ensure config is immutable after this step.

#### 2.2 Pot Management UI (Frontend)
- [ ] **Create Pot Wizard:** Multi-step form for Frequency, Amount, Duration.
- [ ] **Member Picker:**
    -   Implement **Web Contact Picker API**.
    -   Fallback manual entry form (Name + Phone).
- [ ] **Pot Dashboard:** List of active/draft pots.
- [ ] **Pot Detail View (Draft):** View members, invite status, "Start Pot" button.

---

## Phase 3: The "Pot View" & Draw Mechanics (Sprint 3)
**Goal:** Implement the core visual metaphor (Solar System) and the drawing logic.

### Dependencies
*   **Phase 2:** Active pots with members are needed to visualize.

### Tasks
#### 3.1 Visuals (Frontend)
- [ ] **Component `PotVisualizer` (Minimalist):**
    -   Clean, segmented Radial/Donut Chart using SVG.
    -   **Segments:** Equal segments representing members.
    -   **Center:** Clear typography for Month & Target Amount.
- [ ] **State Representation:** 
    -   Elegant color coding (e.g., Muted Grey = Pending, Accent Color = Paid).
    -   Subtle micro-interactions on hover/tap (no complex orbital physics).

#### 3.2 Draw Logic (Backend)
- [ ] **Schema Update:** Add `drawOrder` to `members` or a separate `draws` table.
- [ ] **Action `runMonthlyDraw`:**
    -   *Algorithm:* `crypto.getRandomValues` selection from eligible members.
    -   *Audit:* Log seed/timestamp.
- [ ] **Mutation `assignInitialSequence`:** If fixed order is chosen.

#### 3.3 Draw Animation (Frontend)
- [ ] **Animation Logic:** using `framer-motion`.
- [ ] **Physics:** Implement "Momentum Spin" with spring easing.
- [ ] **Winner Reveal:** High-impact modal/overlay for the month's winner.

---

## Phase 4: Ledger, Financials & PWA Offline (Sprint 4)
**Goal:** Handle money tracking, proof of payment, and ensure offline reliability.

### Dependencies
*   **Phase 2:** Pots must exist.
*   **Phase 3:** Visuals provided context (Planets change color).

### Tasks
#### 4.1 Financial Backend
- [ ] **Schema Definition (Transactions):** `transactions` table (`potId`, `monthIndex`, `status`, `proofUrl`).
- [ ] **File Storage:** Configure Convex Storage for screenshot uploads.
- [ ] **Mutation `recordPayment`:** Member uploads proof -> creates PENDING transaction.
- [ ] **Mutation `verifyPayment`:** Foreman sets PENDING -> PAID.

#### 4.2 Ledger UI
- [ ] **Payment Action:** "Pay Now" button -> Image Upload -> Optimistic UI update.
- [ ] **Foreman Queue:** "Needs Verification" list.
- [ ] **Ledger View:** Table/List history of all payments for transparency.

#### 4.3 PWA & Offline
- [ ] **Service Worker:** Configure `vite-plugin-pwa` (InjectManifest).
- [ ] **Caching Strategy:** Cache "Pot View" and static assets.
- [ ] **Optimistic Updates:** Ensure `recordPayment` updates UI immediately, syncs when online.

---

## Phase 5: Verification & Verification Dashboard (Sprint 5)
**Goal:** Trust safety and Foreman validation.

### Dependencies
*   **Phase 1:** User model.

### Tasks
#### 5.1 Identity Verification
- [ ] **Schema Update:** `verificationDocId` on `users`.
- [ ] **UI `VerificationFlow`:** Upload Govt ID (Aadhaar/PAN).
- [ ] **Foreman Dashboard:** Specialized view for checking status of their pots and their own verification status.
- [ ] **Admin View (Optional/MVP):** Simple way for SuperAdmin to toggle `isVerified = true`.

#### 5.2 Polish & Launch
- [ ] **Audit:** Check "Ghost Claim" integrity.
- [ ] **Performance:** Test "Pot View" rendering with max members.
- [ ] **Final Polish:** Typography, Colors, Micro-interactions.

