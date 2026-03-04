# UniGro Design System v2

Status: Canonical  
Last updated: 2026-02-18  
Supersedes: `/Users/abdullahnettoor/Projects/UniGro/docs/DESIGN.md` (kept as legacy reference)

This document is the source of truth for visual, interaction, and content design in UniGro. All new UI work should follow this spec.

## 1. Design Intent

UniGro is a community-finance product for ROSCA/chit workflows, not a generic consumer app. The experience must communicate:

- Trust and accountability
- Financial clarity and auditability
- Collective progress over personal hype

Emotional target:

- Calm
- Secure
- Premium
- Human

Positioning statement:

- Trusted Community Finance for real-world groups.

## 2. Brand Principles

1. Trust by default
2. Financial clarity over decoration
3. Actions are obvious, consequences are explicit
4. Consistency beats novelty
5. Mobile-first always

Design decisions should prioritize comprehension and confidence before visual flair.

## 3. Visual Language

Signature motif: Ledger + Circle

- Ledger: structured rows, aligned numeric values, clear state labels, explicit history.
- Circle: pot/community ownership, slot participation, winner progression.

Use cases:

- Pot cards and overview widgets should feel like concise ledger snapshots.
- Pot timeline/history should preserve row alignment and state visibility.
- Slot views should emphasize collective occupancy and ownership distribution.
- Status badges should be restrained, compact, and semantically consistent.

Anti-patterns (The "AI Slop" Rule):

- Generic "fintech slop" aesthetics (e.g., typical purple gradients on white, empty vectors)
- Overused font families (Inter, Roboto, system fonts) without intentionality
- Heavy, high-gloss neon glassmorphism that reduces readability
- Unintentional, timid, perfectly-safe color palettes with no attitude
- Predictable layout structures without point-of-view

### 3.1 Creative Execution

We commit to a **distinctive, production-grade** aesthetic. Every UI endeavor must pick a tone and execute it aggressively—whether it's brutally minimal, organically styled, or luxuriously refined. The goal is to be unforgettable.

Implementation requirements:
- **Spatial Composition:** Don't default to center-aligned flex-boxes. Embrace unexpected layouts, controlled overlaps, asymmetrical balances, or highly rigorous mathematical density.
- **Layers & Depth:** Do not default to flat `#FFF` boxes on `#F9F9F9`. Utilize CSS properties (masks, layers, subtle noise, gradients, blurring) to create actual atmosphere matching the intention.

Moderate premium glass is approved for surfaces, navigation, and sheets when readability and contrast pass accessibility thresholds.

## 4. Color System (Semantic Tokens)

Rule: never hardcode raw hex values in components. Use semantic tokens only.

### 4.1 Token Groups

- `bg`: application and large background layers
- `surface`: cards, panels, inputs, inner containers
- `text`: primary, secondary, inverse, and subdued text
- `border`: low/high emphasis outlines and dividers
- `accent`: primary interactive brand accents
- `status`: success, warning, danger, neutral, highlight

### 4.2 Current Canonical Token Set

These values match the active implementation and are the baseline for v2.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg-app` | `#F6F5F2` | `#0F1F1A` | App background |
| `--surface-elevated` | `#FFFFFF` | `#182923` | Cards, nav, overlays |
| `--surface-card` | `#F0F4F1` | `#1A2E27` | Inputs, nested containers |
| `--surface-deep` | `#E7ECE9` | `#12231D` | Chips, muted panels |
| `--text-primary` | `#1D2622` | `#E8F0EC` | Headings and body |
| `--text-muted` | `#5B6A63` | `#A9B8B2` | Meta and helper text |
| `--text-on-accent` | `#F6F5F2` | `#0F1F1A` | Text over accent fills |
| `--border-subtle` | `#D9E2DD` | `#2C3F38` | Default borders/dividers |
| `--accent-vivid` | `#2F7A5F` | `#A6E6B0` | Primary CTA and active state |
| `--accent-soft` | `#D7F0E3` | `#1E3B30` | Soft accent backgrounds |
| `--accent-secondary` | `#C8925A` | `#E3A96A` | Secondary emphasis |
| `--success` | `#2F7A5F` | `#A6E6B0` | Success status |
| `--warning` | `#C9853B` | `#E3A96A` | Warning status |
| `--danger` | `#C8463A` | `#E1675A` | Error/danger status |
| `--gold` | `#C9A227` | `#E5C36C` | Winner/value highlight |

### 4.3 Premium Highlight Rule

- `--gold` and `--accent-secondary` are limited to high-value moments:
- winner callouts
- payout emphasis
- value totals in summary views

Do not use premium highlights for generic labels, navigation, or body text.

### 4.4 Token Governance

- Add new tokens only in root theme files (`:root`, `[data-theme="dark"]`).
- New token names must be semantic, not visual (avoid `--green-500` style names).
- Every new token must include light and dark values.

## 5. Typography System

Font stack:

- Heading: `Sora` (`--font-display`)
- Body/UI: `IBM Plex Sans` (`--font-body`)
- Numeric/technical: `JetBrains Mono` (`--font-mono`) for tightly formatted numbers and IDs only

### 5.1 Type Roles

| Role | Font | Weight | Line-height | Usage |
|---|---|---|---|---|
| `display` | Sora | 700 | 1.15 | Hero titles, empty-state titles |
| `heading` | Sora | 700 | 1.2 | Page H1/H2 |
| `title` | Sora | 600 | 1.25 | Section titles, card titles |
| `body` | IBM Plex Sans | 400 | 1.5 | Primary body copy |
| `meta` | IBM Plex Sans | 500 | 1.4 | Labels, helper text |
| `label` | IBM Plex Sans | 600 | 1.3 | Buttons, chips, compact badges |
| `numeric` | JetBrains Mono | 600 | 1.3 | Currency and numeric tables |

### 5.2 Size Baseline

- Body base size: 16px on mobile and desktop.
- Small text: 12-14px for metadata only.
- Page headings should preserve hierarchy, not exceed readability on mobile.

### 5.3 Numeric Formatting Rules

- Currency values should use tabular visual rhythm and consistent separators.
- In financial comparison rows, use the numeric role for both value columns.
- Do not mix playful typography with monetary figures.

## 6. Layout and Spacing

### 6.1 Spacing Scale

Use an 8pt-based rhythm:

- `4, 8, 12, 16, 20, 24, 32, 40, 48`

Guidelines:

- Default section spacing on mobile: 24px vertical.
- Dense data rows: 12-16px.
- Card inner padding: 16-24px based on information density.

### 6.2 Radius Scale

- `rounded-lg` for compact controls
- `rounded-xl` for inputs/small cards
- `rounded-2xl` for major cards, sheets, banners
- Full radius (`rounded-full`) for pill/chip tokens and primary rounded CTAs

### 6.3 Breakpoints and Grid

- Mobile-first by default (single column baseline).
- **Desktop (lg >= 1024px)**: Transition to a 2-column grid (e.g., `grid-cols-[1fr_340px]`) for complex detail views (like Pot Detail). Main content lives in the left fluid column, while contextual stats and primary actions live in a sticky right sidebar.
- **Tablet (sm/md)**: Maintain a single-column layout but allow content to comfortably breathe. Use expandable content areas to manage vertical height.
- Any horizontal tab/segment bar must support `overflow-x-auto` and hide scrollbars visually.
- Responsive elements should dynamically hide/show (e.g., hiding mobile sticky bars on desktop and showing desktop sidebars).

### 6.4 Safe Area Rules & PWA Support

- Bottom navigation and mobile sheets must account for safe-area insets.
- Do not place destructive or primary CTA content below reachable safe padding.
- Always use the `safe-bottom` utility class and `100dvh` (not `100vh`) on primary wrappers to ensure stable PWA viewport rendering across standard browsers and installed apps.

## 7. Component Contracts

This section defines behavior and hierarchy, not only styling.

### 7.1 Layout Shells (AppShell & PageShell)

- **`AppShell`**: Used as the root layout wrapper for PWA feel. It manages the global sticky header, bottom navigation bar, and primary safe-area spacing. Supports `floating` vs `sticky` header modes.
- **`PageShell`**: Standardizes the layout rhythm per page. Use this to handle standard `title`, `subtitle`, `actions`, and fluid width constraints (`maxWidth` variations like `md|lg|xl`). Eliminates ad-hoc `max-w-* px-*` scattered styling.

### 7.2 Top App Bar

- Mobile: centered brand/title, no clutter.
- Desktop: left brand and right account controls.
- Surface: elevated with subtle border and backdrop. Managed inside `AppShell`.

### 7.10 Surface Component Contract

Use three standardized surface tiers explicitly via the `<Surface>` component:

- `tier={1}` (Legacy glass-1):
  - Use for chips, segmented controls, and compact badges.
  - Low blur, high readability, tight borders.

- `tier={2}` (Legacy glass-2):
  - Use for default cards, quick activity rails, and standard lists.
  - Medium blur, balanced depth and inset shadows.

- `tier={3}` (Legacy glass-3):
  - Use for major overlays, sticky nav bars, sticky action bars, and sheet headers.
  - Strongest allowed blur, distinct floating separation.

Rules:

- Do not define ad-hoc blur + opacity recipes in raw classes.
- Always use the `<Surface>` wrapper instead of raw `glass-*` classes.
- Child content must pass contrast checks against the chosen tier depth in all themes.

### 7.2 Bottom Navigation (3 Items)

- Items: Dashboard, New Pot, Profile.
- Icon container, icon size, and label size must be visually consistent across all items.
- Active state uses accent token and subtle filled background.
- Minimum touch target: 44x44px.

### 7.3 Pot Card

Required hierarchy:

1. Lifecycle status chip
2. Pot title
3. Organizer line
4. Value pair (pool value, per-cycle/round contribution)

Do not reorder this hierarchy across pages.

### 7.4 Section Header + Count Chip

- Title on left, optional action on right.
- Count chip uses subdued surface and muted text.
- Count style remains consistent between dashboard sections.

### 7.5 Verification Banners

States:

- Unverified
- Pending
- Rejected
- Verified (only when action context requires)

Each state needs:

- clear title
- one-line explanation
- explicit next action when applicable

### 7.6 Tabs

- Must support horizontal scroll on mobile.
- Active tab state should be unambiguous.
- Tab labels should be sentence case, except approved entity names (for example: Join Pot).

### 7.7 Modal/Sheet Pattern

- Mobile default: bottom sheet style.
- Desktop default: centered modal.
- Sticky action row for primary and secondary actions.
- Clear close affordance and dismiss behavior.

### 7.9 Buttons

Variants:

- `primary`
- `secondary`
- `ghost`
- `destructive`

Properties:
- Standard buttons should maintain a minimum height of `44px` for accessibility.
- Add `density="compact"` prop when using chips/segmented controls in tight spaces, allowing height to drop below the 44px standard without breaking the semantic component tree.

Contracts:

- Primary is reserved for dominant action in each view.
- Avoid multiple primary buttons in the same viewport section.
- Disabled state must remain legible and clearly inactive.

### 7.9 Toasts and Confirmations

- Toasts for low-friction feedback.
- Confirmation dialogs for destructive or irreversible actions.
- Copy must state what will happen after confirmation.

### 7.11 Sticky Bars (Mobile & Tablet)

- **Top Sticky Navigation**: Use on detail pages to provide quick back access and contextual status (e.g., Pot Title & Status) to avoid consuming scrolling space. Must be hidden on large screens in favor of standard text-based back links. Wrap in `<Surface tier={3}>` with a high z-index.
- **Bottom Action Bar**: Used on mobile/tablet to anchor the primary CTA (e.g., Join, Pay, Invite) so users don't have to scroll to take action. Wrap in `<Surface tier={3}>`. Disappears on desktop where the sticky sidebar serves this purpose.

### 7.12 Expandable Mobile Cards

- For dense secondary information (e.g., Financial Summaries, Dates), use a unified expandable card on smaller screens to preserve vertical space.
- A single full-width button acts as the header, toggling the content area inside the same container.
- Animation must be smooth, using CSS Grid transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) along with opacity fades.

### 7.13 Progress & Visualizer Components

- **Progress Bars**: Must clearly label the metric (e.g., "Collection status" vs "Filling status"). Use right-aligned textual fractions (e.g., "5 / 8 paid") above the bar. Bars should use a horizontal gradient fill (`--accent-vivid` to `--accent-secondary`) and a subtle glow.
- **Visualizers**: Must be fluid and responsive. Use flex or grid layouts that adapt to container width, scaling gracefully from 320px mobile properties up to large desktop heroic headers.

### 7.14 Information Banners

- Used for contextual warnings or instructions (e.g., "Pot is full", "Overdue Payment").
- Wrap in `<Surface tier={3}>` with a left border accent (e.g., `border-l-[var(--warning)]`) and matching background tint.
- Layout: Icon on the left, Title & Description in the center, and an optional textual action button (e.g., "Contact") on the far right.

## 8. Content and Terminology Contract

### 8.1 Role Names

- Use `Organizer` in UI copy.
- Do not use `Foreman` in user-facing text.

### 8.2 Pronoun Policy

- Use second-person possessive consistently: `Your`.
- Avoid mixing `My` and `You` on the same page.

Preferred examples:

- `Pots you organize`
- `Pots you joined`
- `Organized by {Name}`

### 8.3 Case Rules

- Sentence case for labels, helper text, banner descriptions, and status explanations.
- Title case allowed for the primary domain entity phrase: `Join Pot`.

### 8.4 Status Copy Templates

Use stable templates for:

- Verification (`Unverified`, `Pending`, `Rejected`, `Verified`)
- Payment (`Unpaid`, `Pending approval`, `Paid`)
- Draw (`Upcoming`, `In progress`, `Completed`)
- Payout (`Not recorded`, `Recorded`)

Templates should always include:

- Current state
- Meaning
- Next action (if any)

## 9. Motion System

Motion should communicate state change and confidence, not delight for its own sake.

### 9.1 Duration Tokens

- `fast`: 160ms
- `normal`: 220ms
- `slow`: 320ms

### 9.2 Easing

- Standard entrance: ease-out
- Exit and reduction: ease-in
- Emphasis transitions: ease-in-out

### 9.3 Approved Patterns

- Page transitions: subtle fade + minimal lift
- High-impact moments: prioritize one well-orchestrated page load with staggered reveals (animation-delay) over scattered micro-interactions.
- Tab transitions: opacity + slight translate
- Modal/sheet transitions: vertical slide + fade
- Toast transitions: short slide + fade
- CSS-only priority: Use CSS transitions/animations for all standard effects. Use framer-motion only for complex orchestrated mounts and dragging.

### 9.4 Reduced Motion

- Respect `prefers-reduced-motion` globally.
- Replace animated transitions with minimal/no-motion alternatives.

## 10. Accessibility Standards

1. Contrast: minimum 4.5:1 for normal text.
2. Touch targets: minimum 44x44px.
3. Focus states: always visible, keyboard discoverable.
4. Keyboard navigation: logical order and no traps in modals.
5. Screen reader support: icon-only controls require accessible names.
6. Motion: do not rely on animation alone to communicate status.

## 11. PWA Experience Rules

### 11.1 Install Prompt Strategy

- Do not block first-use experience with immediate install prompts.
- Trigger install prompt after demonstrated intent (repeat visits or key action completion).
- Allow dismissal without repeated aggressive prompting.

### 11.2 Offline State

- Show clear offline status without panic language.
- Preserve read-only access where possible.
- Avoid false-success states when network calls fail offline.

### 11.3 Update Prompt

- Explain that a new version is available.
- Provide a single clear action (Update now).
- Keep prompt compact and non-blocking.

### 11.4 Network Recovery Messaging

- On reconnection, confirm restoration.
- For failed submissions, provide retry path and state clarity.

## 12. Implementation Governance

### 12.1 Token Usage Rules

- Use CSS variables and semantic Tailwind variable references.
- No component-level raw color literals.
- Theme support (`system`, `light`, `dark`) is mandatory for all new surfaces.

### 12.2 UI PR Review Checklist

1. Semantic tokens only
2. Light/dark/system parity
3. Mobile-first layout verified
4. Bottom nav consistency preserved
5. Terminology and pronoun contract respected
6. Status copy templates used
7. Accessibility checks completed
8. Reduced motion behavior verified

### 12.3 Definition of Done (UI)

A UI change is done only when:

- It conforms to this document
- It passes visual checks in light and dark themes
- It does not introduce terminology drift
- It includes responsive behavior for mobile baseline

### 12.4 Migration from DESIGN.md

Migration policy:

1. New work must reference this file first.
2. Existing screens can be incrementally aligned.
3. During migration conflicts, `DESIGN_V2.md` wins.
4. After major screen alignment is complete, archive or mark legacy sections in `DESIGN.md`.

---

## Appendix A: Frontend Contract Impact

No backend API or schema changes are required by this design system.

Expected frontend contract standardization:

- Token naming and usage discipline
- Shared component states/variants
- Terminology/copy consistency keys
- Theme preference behavior parity (`system`, `light`, `dark`)

## Appendix B: Validation Scenarios

1. Major pages render correctly in light/dark/system with semantic tokens only.
2. Bottom nav labels, icon sizes, and weights are visually consistent.
3. Pot cards and section headings use unified hierarchy and copy.
4. Verification states follow approved status copy and color semantics.
5. Currency values follow numeric typography and alignment standards.
6. Mobile modals follow sheet behavior with sticky actions.
7. PWA install/update/offline prompts follow the defined behavior.
8. Accessibility checks pass for contrast, focus, and touch targets.
9. No forbidden term (`Foreman`) or mixed pronouns (`My/You`) remain.
10. Motion remains subtle and reduced-motion safe.
