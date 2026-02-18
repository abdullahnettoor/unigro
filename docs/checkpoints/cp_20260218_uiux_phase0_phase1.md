# GrowPot UI/UX Rollout Checkpoint (Phase 0 + Phase 1)

Date: 2026-02-18  
Source of truth: `/Users/abdullahnettoor/Projects/GrowPot/docs/DESIGN_V2.md`, `/Users/abdullahnettoor/Projects/GrowPot/docs/USERFLOW.md`

## 1) File-Level Task Map by Flow

### Foundation and shell
- `src/index.css`
- `src/App.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`

### Dashboard flow
- `src/pages/Dashboard.tsx`
- `src/components/PotCard.tsx`

### Pot lifecycle flow (next phase target)
- `src/pages/PotDetail.tsx`
- `src/components/JoinPotModal.tsx`
- `src/components/AddMemberModal.tsx`
- `src/components/SplitSlotModal.tsx`
- `src/components/PaymentComponents.tsx`
- `src/components/PotHistory.tsx`
- `src/components/PotVisualizer.tsx`

### Trust, profile, admin, PWA flow (next phase target)
- `src/pages/Profile.tsx`
- `src/components/VerificationModal.tsx`
- `src/components/UserMenu.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/PWAPrompt.tsx`

## 2) Migration Checklist

### Design-token discipline
- Replace non-canonical tokens with semantic token set from DESIGN_V2.
- Avoid raw hex values in component classes.
- Verify light/dark/system behavior for each touched surface.

### Copy and terminology
- User-facing role name: `Organizer`.
- Avoid mixed pronouns (`my` and `you`) on same surface.
- Keep sentence case for helper and status copy.

### Mobile-first interaction
- Keep 44x44 minimum touch targets.
- Keep bottom nav visual parity across all items.
- Use mobile-sheet behavior for major action modals.

## 3) Regression QA Checklist

### Breakpoints
- Mobile: 375px width
- Tablet: 768px width
- Desktop: >=1280px width

### Theme coverage
- Light
- Dark
- System

### Core user tasks
- Sign in and land on dashboard
- Open profile menu from bottom nav and desktop header
- Create pot entry action from dashboard
- Open existing pot from both dashboard sections
- Trigger verification banner interactions (unverified/rejected states)

### Accessibility
- Focus-visible ring appears on keyboard nav
- Touch target minimum respected on nav and primary actions
- Status messages remain readable with color contrast
- Reduced-motion mode disables heavy transitions

## 4) Acceptance Gates per Phase

- `npm run lint`
- `npm run build`
- Manual visual QA across the checklist above

