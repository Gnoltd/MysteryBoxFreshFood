# MysteryBox Design Conventions

## Theme

Dark & Modern. All designs use:
- Background: `bg-slate-950` (page) / `bg-slate-900` (cards, panels)
- Accent: `indigo-500` / `purple-500` gradient
- Text: `text-white` (headings) / `text-slate-400` (muted)
- Borders: `border-slate-800`

Never use white/light backgrounds — this app is always dark.

## Currency

Always display prices in Vietnamese Dong (VND) formatted as: `35.000 đ` (period as thousands separator, đ suffix, no decimal places).

## Component groups

- **general/** — base UI primitives (Button, Card, Input, Label, Select, Textarea and their shadcn sub-parts)
- **shared/** — app-specific components (GradientButton, GhostButton, GlassNav, ListingCard, MysteryCard, StarRating, StatusChip, StockBadge, StockProgressBar, TimerBadge)

## Key compositions

### Listing card (browse page)
Use `MysteryCard` — it includes image, title, vendor name, price, star rating, stock badge, and timer. Do not build these from primitives.

### Vendor listing card (vendor dashboard)
Use `ListingCard` — same shape but with vendor-specific action buttons.

### Navigation
Use `GlassNav` for all page headers. It accepts `storeName`, `backHref`/`backLabel` (for detail pages), and `actions` (slot for icons/buttons).

### Status indicators
- Order/listing status → `StatusChip` with variant: `emerald` (active/paid), `rose` (sold out/cancelled), `amber` (pending), `slate` (expired), `primary` (new/picked up)
- Remaining stock → `StockBadge` (quantity count) + `StockProgressBar` (visual bar)
- Time remaining → `TimerBadge` (takes a Firestore Timestamp)

### Forms
All form fields use `Label` + `Input`/`Textarea`/`Select`. Always pair them — never render an input without a label.

## i18n

All user-visible string props in components accept plain strings — the calling page is responsible for translating via `t('key')` before passing them. Do not hardcode Vietnamese or English text in component designs.

## Stripe / payment flows

- Browse → `MysteryCard` → detail page → `GradientButton` "Mua ngay" → Stripe Checkout
- Success page uses `StatusChip variant="emerald"` + QR code display
- Cancel page uses `StatusChip variant="rose"` + `GhostButton` back to browse
