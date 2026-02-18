# Google Stitch Prompts for GrowPot

This document contains the consolidated prompts to be used with Google Stitch to generate the UI for GrowPot. These prompts enforce the "Glassmorphism" design system, "Slot-First" architecture, and support both Light and Dark themes.

## 1. Global Context (Prepend to all prompts)

> **App Context:** GrowPot is a communal finance app (ROSCA) using a "Slot-First" architecture.
> **Design System (Glassmorphism & Theming):**
> - **Style:** Glassmorphism.
>     -   *Light Mode:* Background `#F6F5F2`, Cards `bg-white/60` with `backdrop-blur-xl`, Borders `border-black/5`.
>     -   *Dark Mode:* Background `#0F1F1A`, Cards `bg-black/20` with `backdrop-blur-xl`, Borders `border-white/10`.
> - **Colors:**
>     -   **Brand/Primary:** Purple `#7C3AED` (Violet-600) for energetic UI elements.
>     -   **Money/Action:** Premium Green `#2F7A5F` (Emerald-700) for "Pay", "Join", "Success".
>     -   **Gold:** `#C9A227` for Winners.
> - **Typography:** Headings: `Sora` (Bold). Body: `IBM Plex Sans` (Light/Regular).
> - **UI Rules:** NO emojis as icons (use Lucide React). Rounded corners (`rounded-2xl` or `rounded-3xl` for cards). `cursor-pointer` on all interactables. Mobile-first layout.
> - **Tech Stack:** React, Tailwind CSS, Shadcn/UI.

---

## 2. Updated Screen-Specific Prompts

### A. Landing Page (Onboarding)
> **Prompt:**
> Create a mobile-first **Landing Page** for user onboarding.
> 1.  **Hero Section:** "Communal Finance, Reimagined."
>     -   CTA Button: "Get Started" in **Violet-600** (Brand) with a soft glow.
>     -   Background: Subtle mesh gradient of Violet and Emerald.
> 2.  **Feature Carousel:**
>     -   Card 1: "Save Together" (Community focused).
>     -   Card 2: "Transparent Draws" (Fairness).
>     -   Card 3: "Instant Payouts" (Speed).
> 3.  **Trust Indicators:** "Verified Organizers" badge with checkmarks.
> *Ensure the design looks premium and trustworthy in both Light and Dark modes.*

### B. User Dashboard (Unified View)
> **Prompt:**
> Create a **Dashboard** that balances Participant and Organizer needs.
> 1.  **Header:** "Good Morning, [Name]". Right side: Notification Bell & Profile Avatar.
> 2.  **Quick Activity (Horizontal Scroll):**
>     -   "Next Payment: ₹5k due in 2 days" (Green accent).
>     -   "Pending Approval: 1 Request" (If Organizer).
>     -   "Total Savings: ₹45,000".
> 3.  **"My Pots" Section:**
>     -   Tabs/Toggle: "Participating" vs "Organizing".
>     -   **Pot Card:** Glass card showing:
>         -   Title (e.g., "Family Pot").
>         -   Progress Bar (Collection Status).
>         -   User's Slot Info: "Slot #3 • Paid".
>         -   Status Badge: `ACTIVE` (Green) or `DRAFT` (Yellow).
> 4.  **FAB:** Large "+" button (Violet) to Create Pot.

### C. Create Pot Wizard (Full Schema Support)
> **Prompt:**
> Design a **Comprehensive Wizard** for creating a Pot (`schema.ts` aligned).
> 1.  **Step 1: Financials**
>     -   "Pot Name" & "Description".
>     -   "Total Pool Amount" (e.g., ₹1,00,000).
>     -   "Frequency": Pills for `Weekly`, `Bi-Weekly`, `Monthly`, `Quarterly`, `Occasional`.
> 2.  **Step 2: Slot Configuration**
>     -   "Total Slots" (Slider/Input).
>     -   **Auto-Calc:** "Per Slot: ₹[Amount]". "Duration: [N] [Frequency]".
>     -   "Commission": Input % (optional).
> 3.  **Step 3: Rules**
>     -   "Draw Strategy": Radio for `Random System Draw` or `Manual Selection`.
>     -   "Bank Details": Textarea for payment instructions.
> 4.  **Review Bar:** Sticky bottom bar showing summary & "Create Draft".

### D. Active Pot Detail (Feature Rich)
> **Prompt:**
> Create a feature-rich **Active Pot View**.
> 1.  **Visualizer (Hero):** Radial "Solar System" view.
>     -   Central Orb: Total Pool Value.
>     -   Orbiting Slots: Avatars. *Split Slots* represented as half-filled or segmented circles.
>     -   Current Winner: Highlighted in Gold.
> 2.  **Smart Tabs:**
>     -   **Overview:** Collection Status (Progress Bar), Next Draw Date.
>     -   **Slots:** List of participants. *Foreman View:* Add "Assign Ghost" or "Split Slot" buttons here.
>     -   **Approvals (Foreman Only):** List of pending payment proofs with "Approve/Reject" actions.
>     -   **History:** Timeline of draws and payments.
> 3.  **Admin Actions (Floating/Sticky):**
>     -   If Foreman: "Run Draw", "Next Round", "Activate Pot" (if Draft).
>     -   If Member: "Pay Installment" (Green Button).

### E. Design System & Style Guide
> **Prompt:**
> Create a **Design System Reference Screen** that showcases all core UI components.
> 1.  **Typography:** Show H1, H2, H3 (Sora Bold) and Body text (IBM Plex Sans) in different weights.
> 2.  **Color Palette:** Swatches for:
>     -   Primary: Violet-600 (`#7C3AED`)
>     -   Secondary: Soft Purple (`#A78BFA`)
>     -   Action/Success: Emerald-700 (`#2F7A5F`)
>     -   Gold (`#C9A227`)
>     -   Backgrounds: Light (`#F6F5F2`) and Dark (`#0F1F1A`).
> 3.  **Components (Glassmorphism):**
>     -   **Buttons:** Primary (Violet Pill), Secondary (Glass), Ghost (Text).
>     -   **Cards:** A standard Glass Card with title and content.
>     -   **Inputs:** Text Field, Select Pill, Slider, Toggle Switch.
>     -   **Status Badges:** Active (Green), Pending (Yellow), Closed (Gray).
> 4.  **Icons:** Lucide React examples (Home, User, Wallet, Bell).
> *Layout this screen as a "Style Guide" documentation page.*
