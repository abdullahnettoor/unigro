# GrowPot Stitch-Inspired UI Upgrade Plan (Mobile + Large Screens)

## Summary
This plan defines a phased UI migration inspired by the Stitch references while preserving GrowPot's semantic token system from `/Users/abdullahnettoor/Projects/GrowPot/docs/DESIGN_V2.md`.

Desktop direction is locked to `Top nav + 2-column content` with no sidebar shell migration.

## Scope Mapping
1. Pot wizard screens -> `/Users/abdullahnettoor/Projects/GrowPot/src/pages/CreatePot.tsx`
2. Unified dashboard -> `/Users/abdullahnettoor/Projects/GrowPot/src/pages/Dashboard.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/PotCard.tsx`
3. Active pot management -> `/Users/abdullahnettoor/Projects/GrowPot/src/pages/PotDetail.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/PotVisualizer.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/PotHistory.tsx`
4. Supporting trust/modals/profile/pwa -> `/Users/abdullahnettoor/Projects/GrowPot/src/components/JoinPotModal.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/PaymentComponents.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/VerificationModal.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/pages/Profile.tsx`

## Non-Negotiables
1. Keep semantic color tokens unchanged.
2. Apply Stitch hierarchy/structure, not Stitch purple palette.
3. Keep typography contract (`Sora` + `IBM Plex Sans`) and terminology contract (`Organizer`, sentence case).
4. No backend/schema/payload changes.
5. Desktop uses top nav with 2-column content regions.
6. Moderate premium glass is allowed and standardized via glass tiers (`glass-1`, `glass-2`, `glass-3`).
7. Forest Ledger token refinement applies only in theme root files; no raw hex in components.

## Phases

### Phase 1: Wizard architecture (Create Pot)
1. Convert Create Pot into 3-step wizard: financials, slot configuration, rules + review.
2. Add top stepper and progress indicator.
3. Add sticky bottom action bar on mobile.
4. Desktop: 2-column form + sticky summary.
5. Keep validation and submit payload unchanged.

### Phase 2: Dashboard upgrade
1. Add quick-activity rail in first viewport.
2. Keep section semantics: `Pots you organize`, `Pots you joined`.
3. Improve list controls with chip-style mode controls.
4. Desktop: 2-column arrangement with readable max width.

### Phase 3: Pot detail recomposition
1. Recompose hero + compact status cards + stable tab strip.
2. Keep one primary role/state action rail (organizer/member specific).
3. Desktop: 2-column main content + sticky action/summary rail.
4. Keep lifecycle and payment logic untouched.

### Phase 4: Modal and trust flow consistency
1. Make major flows sheet-first on mobile, centered modal on desktop.
2. Standardize sticky action footers.
3. Maintain accessibility and keyboard/focus behavior.
4. Align trust copy and status visuals to `DESIGN_V2.md` + `USERFLOW.md`.

## Large-Screen Specification
1. Breakpoints: mobile baseline, `md` tablet transition, `lg` desktop structured layout.
2. Keep top nav; no sidebar IA migration.
3. Use sticky right-column summary/actions on desktop in workflow-heavy pages.
4. Increase columns, not type compression; preserve 16px body size and spacing rhythm.

## QA and Validation
1. Validate Create Pot flow on mobile and desktop.
2. Validate Dashboard first-view action discovery.
3. Validate Pot Detail role/state action correctness.
4. Validate tabs at 375px, 768px, 1280px.
5. Validate modal parity (sheet vs centered modal).
6. Validate light/dark/system parity with semantic tokens.
7. Validate copy consistency (Organizer and pronouns).
8. Validate accessibility: focus-visible, keyboard traversal, touch targets, icon labels.
9. Run `npm run build` and targeted eslint for touched files.
10. Verify route chunks remain split and no monolithic regression.

## Rollout and Checkpoints
1. Implement and review after each phase.
2. Save per-phase checkpoint files in `/Users/abdullahnettoor/Projects/GrowPot/docs/checkpoints/`.
3. After Phase 4, publish consolidated checkpoint + release QA summary.
