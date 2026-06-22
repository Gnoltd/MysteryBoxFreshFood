# VendorComposePage — Workbench Redesign

**Date:** 2026-06-22  
**Reference design:** `Design/inventory_intelligence_dashboard/code.html`  
**Target file:** `src/pages/vendor/VendorComposePage.tsx`

---

## Goal

Replace the current single-column `max-w-2xl` layout with a full-height 3-column workbench that mirrors the reference design's zone-based approach, using the existing dark design tokens.

---

## Layout

The page fills `h-[calc(100vh-4rem)]` inside VendorLayout's `p-8` wrapper (4rem = 2 × p-8 = top + bottom padding). A `grid grid-cols-12 gap-4` divides the space into three equal zones of 4 columns each.

```
┌─────────────────┬─────────────────┬─────────────────┐
│   ZONE 1        │   ZONE 2        │   ZONE 3        │
│  col-span-4     │  col-span-4     │  col-span-4     │
│  Inventory      │  Controls +     │  Listing        │
│  Catalog        │  AI Result      │  Editor         │
│                 │                 │                 │
│  (internal      │  (scrolls       │  (internal      │
│   scroll)       │   vertically)   │   scroll,       │
│                 │                 │   pinned CTA)   │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Zone 1 — Inventory Catalog

**Container:** `col-span-4 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden`

**Header (pinned):** "Inventory" title + "ZONE 1" chip (`bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded`)

**Search input:** full-width, `border-outline-variant`, focus ring `focus:border-primary`

**Item list (scrollable):** `flex-1 overflow-y-auto p-4 space-y-2`

Each inventory item has three states:

| State | Visual |
|---|---|
| Normal | `border border-outline-variant bg-surface-container-high/40` hover `bg-surface-container-high` |
| Expiring today | `border-2 border-red-500/60 bg-surface-container-high/40` + red "Expires Today" badge |
| Expiring soon | `border-2 border-amber-500/60 bg-surface-container-high/40` + amber "Expires Soon" badge |
| Selected | `border-2 border-primary bg-primary/10` + checkmark badge overlay (top-right) + qty stepper |

Item card layout: `[checkbox] [emoji] [name + price/unit]` left side, `[expiry badge OR total value]` right side.

When selected, a compact qty stepper appears at the bottom-right of the card: `[−] [N] [+]` with `bg-surface-container` buttons.

**Bottom bar (pinned):** `p-4 border-t border-outline-variant bg-surface-container flex justify-between`  
Left: "N items selected" | Right: "Total Value: X đ" (bold)

---

## Zone 2 — Controls + AI Result

**Container:** `col-span-4 flex flex-col gap-4 overflow-y-auto` (full zone scrolls as a unit)

### Pricing Controls Card

`bg-surface-container border border-outline-variant rounded-xl p-5 relative overflow-hidden`

- **Gradient accent bar:** `absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary-token`
- **Discount slider:** range input `accent-primary`, label shows "X%" in `text-primary font-bold`
- **AI suggestion card** (shown when `suggestResult` is set): amber — `bg-amber-950/30 border border-amber-600/30 rounded-xl p-3` with 💡 icon and "Apply" button
- **Buttons row:**
  - "Suggest Price": `border border-primary text-primary rounded-xl hover:bg-primary/10`
  - "✨ Compose with AI": `bg-secondary-container text-on-secondary rounded-xl` (full flex-1)

### AI Result Card (shown after `composerResult` is set)

`bg-surface-container border-t-2 border-t-secondary-token border border-outline-variant rounded-xl p-5`

- **Header:** `🤖 AI Suggestion` in `text-secondary-token` + ZONE 2 chip
- **Qty stepper (large):** centered, `w-12 h-12` buttons, large number in `text-secondary-token text-3xl font-bold`
- **Price comparison:** `strikethrough originalPrice → text-green-400 salePrice`
- **Packing guide:** list rows, each with `[emoji name]` left + `×N` pill (`bg-primary/10 text-primary`) right; leftover shown in `text-amber-400`

---

## Zone 3 — Listing Editor

**Container:** `col-span-4 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden relative`

**Decorative corner:** `absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-secondary-token/10 to-transparent rounded-bl-full pointer-events-none`

**Header (pinned):** "Listing Editor" + edit icon (`text-secondary-token`) + ZONE 3 chip

Shown only when `composerResult` is set. Before compose, shows an empty-state placeholder: sparkle icon + "Run AI Compose to populate this form."

**Scrollable form body:** `flex-1 overflow-y-auto p-5 space-y-4`

| Field | Notes |
|---|---|
| Category | `Select` component, focus `border-secondary-token` |
| Title | Text input with `✨` prefix span inside a relative wrapper, border `border-secondary-token/30 focus:border-secondary-token` |
| Description | `Textarea`, 3 rows, same secondary border |
| Price (VND) | Number input with payments icon prefix |
| Pickup Window | `grid grid-cols-2 gap-2`, two `datetime-local` inputs |

**Publish button (pinned):** `p-5 border-t border-outline-variant bg-surface-container-high`  
`gradient-bg text-white w-full py-3 rounded-xl font-bold text-body-sm flex items-center justify-center gap-2`  
Disabled state: `opacity-50 cursor-not-allowed`

---

## Error / Empty States

- Zone 2 compose error: `text-red-400 text-sm` below the buttons
- Zone 3 empty (before compose): centered placeholder with `Wand2` icon, muted text, soft border
- Publish error: `text-red-400 text-sm` above Publish button

---

## i18n

No new translation keys required — all strings already exist or use existing patterns. Zone label chips are purely decorative ("ZONE 1", "ZONE 2", "ZONE 3") and intentionally not translated.

---

## Constraints

- No Firebase SDK in the component (already met — all via services)
- All `t('key')` for user-visible strings
- The VendorLayout is unchanged — the compose page handles its own height calculation
- Existing state management and service calls are unchanged — only the JSX/styling changes
