---
name: example-format 
description: Example format for frontend skill to understand how the conversation works.
---

## Example Conversation

### User: 
Now we can start analyzing each page one by one and see the possibilities of making our UI consistent across the application. we can start with dashboard page. analyze and find how we can improve the ui and make it consistent. ask me anything if needed  

### Assistant: 
```
Using skill: `frontend-design` for a focused UI consistency review.

Here’s a dashboard-specific analysis with concrete consistency gaps and improvement options (no changes yet):

**Consistency Issues I see**
1. **Header layout is duplicated for mobile vs desktop**  
   Two separate blocks with similar content but different styles. This drifts over time and breaks consistency with PageShell’s intended header pattern.

2. **Mixed surface primitives**  
   Dashboard uses `GlassSurface` directly in sidebar and quick cards, while the rest of the app is shifting to `Surface`. This creates inconsistent depth/border/shadow behavior.

3. **Action sizing & density mismatch**  
   Header actions (Create button, notification icon) use custom classes instead of the shared `Button`/`SegmentedControl` density system. Some are 40px, others 44px+, which makes the UI feel uneven.

4. **Quick Activity cards are a different “language”**  
   The cards use mono values and uppercase labels (good), but spacing, border treatment, and background blending differs from Pot cards. This makes the section feel like a different module.

5. **Section headers are inconsistent**  
   Quick Activity uses small uppercase label, “Your pots” is large display heading. The hierarchy is ok, but styles aren’t standardized across sections.

6. **Sidebar height uses `100vh` math**  
   The sidebar still uses `h-[calc(100vh-1.5rem)]`; other screens moved to `dvh`. This can cause viewport jitter on mobile/standalone.

---

## Improvements to Make Dashboard Consistent
These align with the system we’re building:

**A) Introduce a single header component**
- One responsive header that adapts via CSS (not separate markup).
- Uses `PageShell` title/actions slots.
- Consistent button sizes via `Button` component.

**B) Replace all `GlassSurface` here with `Surface`**
- Quick Activity cards, sidebar, banners.
- Same tier, same rounded/border/shadow tokens.

**C) Standardize action density**
- `SegmentedControl` with `density="compact"` for tabs.
- Button sizes consistent: `Button size="md"` for Create, `icon` for notifications.

**D) Section header pattern**
- Standard small label + h2 + optional right actions.
- Use a shared “SectionHeader” pattern or just a consistent class set.

**E) Quick Activity layout**
- For mobile: horizontal scroll OK, but ensure consistent card width & padding (e.g., `min-w-[260px]`).
- For desktop: align to same card spacing as Pot grid.

---

## Questions to lock decisions
1. **Header**: Do you want the dashboard to use the `PageShell` header slot (title + actions) as the canonical pattern across pages?  
2. **Quick Activity**: Should it stay as horizontal scroll on mobile, or become a 2-column stack for consistency with other sections?  
3. **Sidebar**: Keep the current sidebar layout, or move to a unified “AppNav” component shared with other pages?

Once you confirm, I’ll implement the dashboard refactor first, then proceed page by page.
```

### User: 
1. Header: What will be the difference?
2. We can keep horizontal scroll in mobile.
3. What are your suggestions on it.

### Assistant: 
```
Below are clear answers and a recommended direction so you can decide quickly.

**1) Header: What will be the difference?**  
If we use the `PageShell` header slot as the canonical pattern:
- **One responsive header** instead of two separate blocks.
- **Consistent spacing** across pages (Dashboard, Pots, Settings, etc.).
- Actions (notifications + “Create”) use the **same button sizes/density** as the rest of the app.
- Title/subtitle layout becomes standardized, so future pages feel “same family.”

Net effect: less drift, fewer special cases, tighter visual rhythm.

**2) Mobile horizontal scroll**  
Got it. We’ll keep horizontal scroll on mobile for Quick Activity.

**3) Sidebar suggestion**  
I recommend **a shared App Sidebar component** (e.g., `AppSidebar`) that:
- Uses `Surface` consistently.
- Centralizes nav styles and active state behavior.
- Lets us update navigation in one place across Dashboard, Pots, Settings, Admin.

This keeps the look consistent and avoids repeating sidebar code.

**My recommendation**  
- Use PageShell header as canonical.  
- Keep Quick Activity horizontal on mobile.  
- Create shared `AppSidebar` and replace the inline version here.

If you agree, I’ll implement the Dashboard refactor first with those choices.
```

### User: 
Yes pls proceed with your recomendation. 
also I can see that the "Your pots" title having a quick filter and a "view all pots" button, it makes the UI very weired pls identify a better way for it to fix.