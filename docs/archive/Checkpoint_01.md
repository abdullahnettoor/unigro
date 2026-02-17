# Checkpoint 01: GrowPot MVP Complete

**Date:** February 11, 2026
**Status:** MVP Feature Complete

## 1. Project Overview
GrowPot is a "Communal FinTech" application designed to digitize Rotating Savings and Credit Associations (ROSCAs). The MVP phase focused on establishing the core lifecycle, financial security, and a unique visual identity.

## 2. Completed Features

### 🏛️ Foundation
-   **Tech Stack:** React (Vite), Tailwind CSS, Convex (Backend), Clerk (Auth).
-   **Architecture:** Monorepo-style structure with strict backend validation.
-   **Security:** Row-Level Security ensures users only access relevant data.
-   **Ghost Accounts:** Implemented a system where Foremen can invite members by phone number. These "Ghost" accounts are automatically claimed when the real user signs up.

### 🪴 Pot Lifecycle
-   **Creation:** Configurable duration, contribution amount, and frequency.
-   **States:**
    1.  **DRAFT:** Adding members, verifying rules.
    2.  **ACTIVE:** Rules locked, payments enabled, monthly draws active.
    3.  **CLOSED:** (Planned) Pot lifecycle end.
-   **Membership:**
    -   Foreman-invite flow.
    -   Public link "Request to Join" flow.
    -   Foreman Approval Dashboard.

### 🪐 Visualizations
-   **Cosmic View:** The signature visualization.
    -   **Concept:** The Pot is the Sun; Members are Planets.
    -   **Dynamics:** Planets orbit the sun. The "Winner" of the current month receives a golden halo.
    -   **Tech:** Built with SVG and `framer-motion` for smooth, high-fidelity animations.

### 💸 Financials
-   **Payment Methods:**
    -   **Online:** Users upload a screenshot of their payment.
    -   **Cash:** Users signal a cash payment, which the Foreman manually verifies.
-   **Ledger:** Immutable transaction records stored in Convex.
-   **Fairness:** Random "Draw" function to select the monthly winner.

### 📱 PWA & Offline Support
-   **Vite PWA Plugin:** Configured for offline caching of the app shell.
-   **Manifest:** Full support for "Add to Home Screen" on iOS and Android.
-   **Auto-Update:** In-app prompt when a new version is deployed.

## 3. Tech Stack & Key Files
-   **Backend:** `convex/schema.ts`, `convex/pots.ts`, `convex/transactions.ts`
-   **Frontend:** `src/App.tsx`, `src/pages/PotDetail.tsx`
-   **Components:** `src/components/PotVisualizer.tsx`, `src/components/PaymentComponents.tsx`

## 4. Next Steps
-   **User Testing:** Deploy to Vercel and invite a small group of beta testers.
-   **Refinement:** Gather feedback on the "Cash" payment flow intricacies.
-   **Notifications:** Implement push notifications (via Courier or similar) for "Draw Started" or "Payment Due" events.
