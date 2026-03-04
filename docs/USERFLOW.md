# UniGro User Flow (v2)

Status: Canonical  
Last updated: 2026-02-18  
Depends on: `/Users/abdullahnettoor/Projects/UniGro/docs/DESIGN_V2.md`, `/Users/abdullahnettoor/Projects/UniGro/docs/PRD_v3.0.md`

This document defines the product user flow and content structure for UniGro using the Design v2 principles: trusted, calm, premium, mobile-first.

## 1. Intent and Scope

Goal:

- Provide a decision-complete flow model for current and near-future UX implementation.
- Standardize journey structure, screen purpose, and content hierarchy.
- Align every flow with semantic theming, terminology, and mobile/PWA behavior.

Coverage:

- `Now`: Current route and feature flow.
- `Next`: UX improvements already planned or partially present (notifications, richer onboarding guidance, mobile sheet normalization).
- `Later`: Adjacent extensions (advanced reminders, payment gateway onboarding).

## 2. Role Model and Terminology

Canonical user-facing terms:

- `Organizer` (never `Foreman` in UI copy)
- `Pot`
- `Cycle` for recurring frequencies
- `Round` for occasional pots

Pronoun rule:

- Use second-person consistently (`your`), not mixed `my`/`you`.

Primary roles:

- Organizer: creates and manages pot lifecycle.
- Member: joins pots, pays cycles, tracks progress.
- Admin: verifies identity submissions and trust state.

## 3. Information Architecture (Current Routes)

Public:

- `/` Landing + sign-in entry

Authenticated:

- `/` Dashboard
- `/create` Create/Edit pot
- `/pot/:potId` Pot detail hub
- `/profile` Profile and verification state
- `/admin` Admin dashboard (protected)

Global overlays:

- Profile menu (theme/account/sign out)
- Join Pot modal
- Verification modal
- Payment modal
- PWA install/update prompt

## 4. Global Navigation Flow

Mobile primary navigation:

1. Dashboard
2. New Pot
3. Profile

Rules:

- Keep visual weight, icon size, and label size equal across all 3 items.
- Active item uses accent + subtle fill.
- Bottom-safe-area must be respected.

## 5. End-to-End Journey Flows

## 5.1 Journey A: First Visit -> Sign In -> Product Entry

1. User lands on `/`.
2. Sees value proposition and clear primary action.
3. Starts sign-in flow.
4. On success, lands on dashboard.
5. Dashboard immediately surfaces two clear actions:
- create new pot
- join/continue existing pots

Success criteria:

- User can start meaningful action in <= 2 taps from dashboard.

## 5.2 Journey B: Verification Trust Flow

1. Unverified user sees banner with clear reason and CTA.
2. User opens verification and submits ID details + document.
3. Status transitions:
- `UNVERIFIED` -> `PENDING`
- `PENDING` -> `VERIFIED` or `REJECTED`
4. Rejected state shows concise reason + re-submit path.
5. Verified state removes blocking prompts and keeps subtle trust indication.

Success criteria:

- At each status, next action is obvious and single-step.

## 5.3 Journey C: Organizer Creates and Activates Pot

1. Organizer opens `/create`.
2. Enters rules:
- pot basics
- financial configuration
- draw and operations settings
3. Saves draft and reaches pot detail.
4. Fills/reserves required slots.
5. Activates pot when constraints are met.
6. Runs draw each cycle/round.
7. Records payout and completes lifecycle to archive.

Success criteria:

- No hidden lifecycle blockers.
- Activation and draw consequences are explicit before confirmation.

## 5.4 Journey D: Member Joins Pot and Pays

1. User opens pot detail from dashboard/share link.
2. Reviews rules and contribution amount.
3. Uses `Join Pot` modal:
- choose slot count
- accept rules
- submit
4. Returns to dashboard/pot detail as participant.
5. Pays current and overdue cycles.
6. Tracks status in history timeline and personal dashboard block.

Success criteria:

- Join decision is transparent (commitment and availability visible before confirm).

## 5.5 Journey E: Organizer Reviews Approvals and Cash Confirmation

1. Organizer opens approvals in pot detail.
2. Reviews pending proofs or records cash with backdate when needed.
3. Moves items to paid state.
4. Member-visible statuses update in history/dashboard immediately.

Success criteria:

- Approval and manual cash paths are distinct and auditable.

## 5.6 Journey F: PWA Install, Offline, and Update

1. User receives install prompt only after intent signals.
2. User can dismiss prompt without repeated interruption.
3. Offline-ready state uses calm informative copy.
4. Update prompt offers single clear action (`Update now`).
5. Network recovery confirms restored state.

Success criteria:

- PWA prompts remain helpful, never blocking primary task flow.

## 6. Pot Detail Hub Flow (Tab-Level Behavior)

Tab visibility contract:

- Public/Non-member: rules first, limited slot visibility, join CTA.
- Member/Organizer: dashboard, members, rules, slots, history.
- Organizer + active pot: approvals tab with pending count.

Default tab behavior:

- Member/Organizer defaults to `dashboard`.
- Non-member defaults to `rules`.

Flow priority inside pot detail:

1. Understand pot trust + status
2. Decide/join or continue cycle action
3. Track personal responsibility
4. Audit history and outcomes

## 7. Page Content Matrix (Implementation Contract)

| Surface | Primary Goal | Primary CTA | Required Content Blocks | Key Empty/Error State |
|---|---|---|---|---|
| Landing (`/`) | Explain trust value quickly | Sign in / Get started | Value proposition, proof tone, clear action | Auth failure retry |
| Dashboard (`/`) | Continue ongoing work | New Pot | Verification banner, pots you organize, pots you joined | No pots joined/organized |
| Create Pot (`/create`) | Define rules safely | Save/Create Pot | Basics, financial config, operations settings, contribution preview | Validation failures |
| Pot Detail (`/pot/:potId`) | Manage or participate in lifecycle | Contextual (Join Pot, Pay, Run Draw) | Trust/status header, tabs, timeline/history, slot visibility | Access-limited join prompt |
| Profile (`/profile`) | Manage trust + preferences | Submit verification | Identity status, upload flow, theme preference | Rejected with reason |
| Admin (`/admin`) | Verify trust submissions | Approve/Reject | Queue, document preview, decision notes | Empty queue state |

## 8. Copy Consistency Contract

Use:

- `Pots you organize`
- `Pots you joined`
- `Organized by {Name}`
- `Join Pot`

Do not use:

- `Foreman`
- mixed `My` and `You` in same surface
- unclear ownership wording such as `Your organized pots`

Status copy style:

- sentence case
- one-line meaning
- one clear next action when required

## 9. Mobile-First Behavior Rules

1. Primary actions must be reachable one-handed.
2. Critical modal flows should default to bottom-sheet behavior on mobile.
3. Horizontal scroll is allowed only for tabs/chips where necessary.
4. Dense financial tables should collapse into readable stacked rows.
5. All clickable areas meet minimum 44x44 touch target.

## 10. UX Opportunities (Prioritized)

P0:

- Normalize all lifecycle and status copy to contracts in this document.
- Ensure all modals in major flows follow mobile sheet conventions.
- Ensure bottom nav visual parity and active-state consistency.

P1:

- Add first-session guidance panel on dashboard (how UniGro works in 3 steps).
- Add standardized empty-state illustrations/messages for trust and clarity.
- Expand audit views in history with clearer payout and approval markers.

P2:

- Add notification center entry pattern once backend notifications ship.
- Add contextual education for split-slot participation.

## 11. Validation Scenarios

1. User reaches meaningful action in <= 2 taps after login.
2. Verification states always show clear next step.
3. Organizer can move draft -> active without ambiguity.
4. Member can join with clear slot and commitment understanding.
5. Approval and payment state changes are visible and auditable.
6. Pot history is readable on mobile without horizontal overflow traps.
7. Theme (`system`, `light`, `dark`) keeps all status contrasts legible.
8. PWA install/update/offline prompts follow non-blocking rules.
9. No forbidden terms or pronoun inconsistencies remain.
10. Motion remains subtle and reduced-motion compliant.

## 12. Implementation Notes for Agents

When implementing UI from this flow:

1. Use `/Users/abdullahnettoor/Projects/UniGro/docs/DESIGN_V2.md` as style and component contract.
2. Use this file for journey order, screen purpose, and content hierarchy.
3. If conflicts exist between old docs and this file, this file wins for flow decisions and `DESIGN_V2.md` wins for visual/interaction decisions.

