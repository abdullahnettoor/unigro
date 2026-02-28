---
name: ui-system-plan
description: Plan for UI System, which is already implemented in the codebase. This is just for reference. When creating new components, use this plan as a reference.
---

**Title**
Consistent Responsive UI System + PWA App-Shell Feel for GrowPot

**Summary**
Unify the UI into a consistent, responsive design system across core flows (Dashboard, Pots, Pot Detail, Create Pot), while adding a mobile-first PWA app-shell feel: standardized header, bottom nav, safe-area handling, and page-level layout rhythm. Preserve the current earthy glass aesthetic and add a parallel alternate theme for exploration.

**Public API/Interface Changes**
- `Button` adds standardized size tokens and optional `density` for compact controls. File: `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Button.tsx`.
- New `Surface` component consolidates `Card` + `GlassSurface` behavior. Existing components become wrappers or are migrated. Files: `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Card.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/GlassSurface.tsx`.
- New `PageShell` component standardizes layout width, padding, and header spacing. File: `/Users/abdullahnettoor/Projects/GrowPot/src/components/layout/PageShell.tsx`.
- New `AppShell` layout for PWA feel (header + nav + safe-area). File: `/Users/abdullahnettoor/Projects/GrowPot/src/components/layout/AppShell.tsx`.

**Implementation Plan**
1. **Semantic token layer in `index.css`.**
   - Add tokens for `--surface-1/2/3`, `--border-1`, `--shadow-1/2/3`, `--radius-1/2/3`, `--text-1/2/3`.
   - Add `@utility font-display` to normalize display typography across components.
   - Add `--safe-bottom` helper and `dvh`-based `min-height` utilities for PWA viewport stability.
   - Keep current earthy theme as default; add `data-theme="alt"` for the exploratory theme (palette + font pairing).
   - File: `/Users/abdullahnettoor/Projects/GrowPot/src/index.css`.

2. **Consolidate surfaces into `Surface`.**
   - Create `Surface` with `tier` (`1|2|3`), `interactive` (hover/focus), and `rounded` variants.
   - Update `Card` and `GlassSurface` to wrap `Surface` or replace direct usage.
   - Replace direct `glass-*` usage in core pages with `Surface` for consistency.
   - Files: `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Surface.tsx` (new), `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Card.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/GlassSurface.tsx`.

3. **Normalize control sizes and radii.**
   - Standardize control height and radius across `Input`, `Select`, `Textarea`, `Button`.
   - Add `density="compact"` to allow chips/segmented controls while keeping primary controls at >=44px.
   - Files: `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Input.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Select.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Textarea.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/SegmentedControl.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/components/ui/Button.tsx`.

4. **Introduce `PageShell` layout rhythm.**
   - `PageShell` props: `title`, `subtitle`, `actions`, `maxWidth` (`md|lg|xl`), optional `sidebar`.
   - Replace ad hoc `max-w-* px-*` usage in Dashboard and Pots to normalize spacing and headings.
   - Files: `/Users/abdullahnettoor/Projects/GrowPot/src/components/layout/PageShell.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/pages/Dashboard.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/pages/Pots.tsx`.

5. **PWA AppShell polish (mobile-first).**
   - Create `AppShell` with:
     - Sticky header height, consistent padding.
     - Bottom nav safe-area spacing.
     - Optional `floating` vs `sticky` header mode.
   - Update `MainLayout` to wrap app routes in `AppShell`.
   - Ensure standalone mode uses `dvh` and safe-area padding.
   - Files: `/Users/abdullahnettoor/Projects/GrowPot/src/components/layout/AppShell.tsx`, `/Users/abdullahnettoor/Projects/GrowPot/src/App.tsx`.

6. **Standardize responsive behavior and PWA-safe spacing.**
   - Replace `100vh` with `100dvh` on primary wrappers.
   - Add utility class for `safe-bottom` to avoid bottom-nav overlap on iOS.
   - File: `/Users/abdullahnettoor/Projects/GrowPot/src/index.css`.

7. **Alternate theme (parallel aesthetic).**
   - Add `data-theme="alt"` with different palette + display/body fonts.
   - Provide a dev-only toggle (query param) to preview without production impact.
   - Files: `/Users/abdullahnettoor/Projects/GrowPot/src/index.css`, `/Users/abdullahnettoor/Projects/GrowPot/src/App.tsx`.

**Test Cases and Scenarios**
1. Dashboard, Pots, Pot Detail, Create Pot at 375px, 768px, 1024px, 1440px with consistent container widths and spacing.
2. Mobile PWA standalone (simulated) with bottom nav: verify no overlap and safe-area padding.
3. Control sizing: primary buttons/inputs >=44px; compact chips remain visually smaller but non-primary.
4. Dark theme & alt theme contrast in glass surfaces.
5. Navigation transitions: header and bottom nav remain stable during route changes.

**Assumptions and Defaults**
- The earthy glass design remains default.
- PWA polish targets mobile-first “real app” feel (app shell + native nav).
- Alternate aesthetic is a token-based option, not a brand replacement.
- Offline-first UX and installability polish are deferred unless requested.

