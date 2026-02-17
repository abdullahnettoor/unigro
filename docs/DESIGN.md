# Design System Guidelines: GrowPot

This document is the source of truth for visual design, theming, and UI decisions in GrowPot. Use it when generating new UI so styles remain consistent across light and dark modes.

## 1. Visual Theme & Atmosphere
Calm, trustworthy, premium. The visual language is quiet and confident: soft surfaces, muted backgrounds, and gentle contrast. Accent colors are used sparingly for key actions and status signaling. The overall feel should read “responsible financial product” rather than “consumer social app.”

## 2. Color Palette & Roles
All colors are expressed through CSS variables. Do not hardcode hex colors in components.

### Light Theme (default)
- **App Background**: `--bg-app` (#F6F5F2) — warm parchment background
- **Elevated Surface**: `--surface-elevated` (#FFFFFF) — cards, panels, sheets
- **Card Surface**: `--surface-card` (#F0F4F1) — inputs, inner surfaces
- **Deep Surface**: `--surface-deep` (#E7ECE9) — muted fill, badges, subtle contrasts
- **Primary Accent**: `--accent-vivid` (#2F7A5F) — main CTA, active states
- **Accent Soft**: `--accent-soft` (#D7F0E3) — subtle highlights and tags
- **Secondary Accent**: `--accent-secondary` (#C8925A) — secondary emphasis, warm highlights
- **Primary Text**: `--text-primary` (#1D2622) — body and headings
- **Muted Text**: `--text-muted` (#5B6A63) — labels, captions, meta
- **Text on Accent**: `--text-on-accent` (#F6F5F2) — text on primary buttons
- **Borders**: `--border-subtle` (#D9E2DD) — dividers, outlines
- **Status**:
  - **Success**: `--success` (#2F7A5F)
  - **Warning**: `--warning` (#C9853B)
  - **Danger**: `--danger` (#C8463A)
  - **Gold**: `--gold` (#C9A227) — winner highlights

### Dark Theme
- **App Background**: `--bg-app` (#0F1F1A)
- **Elevated Surface**: `--surface-elevated` (#182923)
- **Card Surface**: `--surface-card` (#1A2E27)
- **Deep Surface**: `--surface-deep` (#12231D)
- **Primary Accent**: `--accent-vivid` (#A6E6B0)
- **Accent Soft**: `--accent-soft` (#1E3B30)
- **Secondary Accent**: `--accent-secondary` (#E3A96A)
- **Primary Text**: `--text-primary` (#E8F0EC)
- **Muted Text**: `--text-muted` (#A9B8B2)
- **Text on Accent**: `--text-on-accent` (#0F1F1A)
- **Borders**: `--border-subtle` (#2C3F38)
- **Status**:
  - **Success**: `--success` (#A6E6B0)
  - **Warning**: `--warning` (#E3A96A)
  - **Danger**: `--danger` (#E1675A)
  - **Gold**: `--gold` (#E5C36C)

### Usage Rules
- For backgrounds, prefer `--bg-app`, `--surface-elevated`, `--surface-card`, `--surface-deep`.
- For CTA buttons, use `bg-[var(--accent-vivid)]` and `text-[var(--text-on-accent)]`.
- For borders, always use `border-[var(--border-subtle)]` unless indicating status.
- For status alerts, use `--success`, `--warning`, `--danger`.

## 3. Typography Rules
- **Headings**: `Sora` (`--font-display`)
  - H1: 32–40px mobile, 40–56px desktop
  - H2: 24–32px
  - H3: 18–22px
  - Use `font-bold` for hierarchy
- **Body**: `IBM Plex Sans` (`--font-body`)
  - Base: 16px, line-height 1.5
  - Small text: 12–14px
- **Mono**: `JetBrains Mono` (`--font-mono`)
  - Use for currency and IDs only

## 4. Component Styling
### Buttons
- **Primary**: `bg-[var(--accent-vivid)] text-[var(--text-on-accent)] rounded-full`
- **Secondary**: `bg-[var(--surface-deep)] text-[var(--text-primary)] border-[var(--border-subtle)]`
- **Danger**: `bg-[var(--danger)] text-[var(--text-on-accent)]`
- Hover: `opacity-90` or `bg-[var(--surface-deep)]/90`
- Minimum height: 44px (touch target)

### Cards / Containers
- Use `rounded-2xl` for premium softness
- Background: `bg-[var(--surface-elevated)]` or `bg-[var(--surface-card)]`
- Border: `border-[var(--border-subtle)]`

### Inputs / Forms
- Background: `bg-[var(--surface-card)]`
- Border: `border-[var(--border-subtle)]`
- Focus: `focus:border-[var(--accent-vivid)]`

### Badges & Pills
- Use `bg-[var(--surface-deep)]/80` + `text-[var(--text-muted)]`
- Status badges use `--success`, `--warning`, `--danger`

## 5. Layout Principles
- Mobile-first: single column, avoid dense grids
- Use generous vertical spacing: `py-6` mobile, `py-8` desktop
- Keep `max-w-4xl` for content-heavy screens
- Avoid horizontal overflow on tabs; use pill tabs with `overflow-x-auto`

## 6. Motion
- Subtle only; use transitions for hover and theme changes
- Respect `prefers-reduced-motion`
- Theme change animation handled by `.theme-transition`

## 7. Theming
- Theme preference stored in `localStorage` (`system`, `dark`, `light`)
- Applied by `src/lib/theme.ts` and controlled via Profile page
- Do not hardcode hex colors in components

## 8. Accessibility
- Minimum contrast 4.5:1 for body text
- Focus-visible ring should be always visible
- Avoid icon-only buttons without labels

## 9. PWA UI
- Use bottom sheet prompts on mobile
- Install/update prompt uses brand accent

---
If you add a new component, define its colors using existing CSS variables before introducing new tokens.
