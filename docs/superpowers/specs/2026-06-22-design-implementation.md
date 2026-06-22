# Design Implementation Spec
**Date:** 2026-06-22  
**Status:** Approved  
**Source designs:** `Design/` folder (HTML mockups + DESIGN.md tokens)

---

## Goal

Implement all pages to exactly match the HTML mockups in the `Design/` folder. The vendor dashboard (`VendorDashboardPage`) is kept as-is. All other pages adopt the MysteryBox Marketplace dark design system.

---

## 1. Design System — Tailwind Tokens

Update `tailwind.config.ts` with the **MysteryBox Marketplace** semantic color palette (from `Design/mysterybox_marketplace/DESIGN.md`). These replace current hardcoded slate/indigo values.

| Token | Hex | Role |
|---|---|---|
| `background` | `#0c1324` | Page canvas |
| `surface` | `#0c1324` | Same as background |
| `surface-dim` | `#0c1324` | Input fills |
| `surface-container-lowest` | `#070d1f` | Deep input bg |
| `surface-container-low` | `#151b2d` | Slightly elevated |
| `surface-container` | `#191f31` | Cards, panels |
| `surface-container-high` | `#23293c` | Hover states |
| `surface-container-highest` | `#2e3447` | Top elevated |
| `surface-bright` | `#33394c` | Bright surfaces |
| `surface-variant` | `#2e3447` | Chips, inactive tabs |
| `outline-variant` | `#464554` | Borders, dividers |
| `outline` | `#908fa0` | Placeholder, icons |
| `on-surface` | `#dce1fb` | Primary text |
| `on-surface-variant` | `#c7c4d7` | Secondary/muted text |
| `primary` | `#c0c1ff` | Links, active nav, prices |
| `primary-container` | `#8083ff` | Gradient stop 1 |
| `inverse-primary` | `#494bd6` | Gradient stop 1 (alt) |
| `secondary` | `#ddb7ff` | Secondary text accents |
| `secondary-container` | `#6f00be` | Gradient stop 2 / AI purple |
| `tertiary` | `#ffb95f` | Amber — stock warnings, timers |
| `tertiary-container` | `#ca8100` | Amber badge bg |
| `error` | `#ffb4ab` | Rose — discount %, critical alerts |
| `on-background` | `#dce1fb` | Default text on bg |

**Global CSS utilities** added to `src/index.css`:
```css
.gradient-bg { background: linear-gradient(to right, #494bd6, #6f00be); }
.gradient-text {
  background: linear-gradient(to right, #c0c1ff, #ddb7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.mystery-border {
  border-top: 4px solid transparent;
  border-image: linear-gradient(to right, #494bd6, #6f00be) 1;
}
.brand-gradient-border-top {
  border-top: 4px solid transparent;
  border-image: linear-gradient(to right, #6366f1, #a855f7) 1;
}
.ai-shadow { box-shadow: 0px 4px 12px rgba(113, 42, 226, 0.15); }
```

---

## 2. Auth Pages

### LoginPage (`/login`)
Source: `Design/mysterybox_login/code.html`

- Standalone page — no layout wrapper (self-contained full-screen)
- `body`: `bg-[#020617] min-h-screen flex items-center justify-center`
- Centered column `max-w-[448px]`
- **Header**: `MysteryBox Fresh Food` in `gradient-text` h1, subtitle `F&B Surplus Marketplace` in `on-surface-variant`
- **Card**: `bg-[#0f172a] border border-[#1e293b] rounded-lg brand-gradient-border-top` with ambient indigo glow blob (`absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl`)
- **Fields**: Email (mail icon), Password (lock icon + Forgot? link) — inputs: `bg-[#020617] border border-[#1e293b] rounded h-[48px] pl-[40px]`
- **CTA**: Full-width `gradient-bg` button "Sign in", `rounded-lg h-[48px]`
- **Divider**: "OR" with `border-[#1e293b]` lines
- **Google button**: Ghost `border-[#1e293b]` with real Google SVG logo, "Continue with Google"
- **Footer**: "No account? Register" link + copyright

### RegisterPage (`/register`)
Source: `Design/mysterybox_register/code.html`

- Standalone page — no layout wrapper
- `body`: `bg-background min-h-screen flex items-center justify-center` with two decorative blur blobs (indigo top-left, purple bottom-right)
- Card: `bg-surface-container/60 backdrop-blur-xl border border-outline-variant rounded-xl` with 1px top gradient accent line (`h-1 w-full gradient-bg`)
- **Header**: fastfood Material icon in `surface-variant` box + "Create an Account" + subtitle
- **Role toggle**: Customer | Vendor pill switcher — active = `bg-surface-variant text-on-surface border-outline`, inactive = `text-on-surface-variant`; selecting Vendor reveals Store Name field
- **Fields**: Display Name, Email, Password, Confirm Password — all with Material Symbol icons, `bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl`
- **CTA**: `gradient-bg` button "Create account →" with arrow_forward Material icon
- No Google login on Register
- Footer: copyright inside card bottom

---

## 3. Customer Layout + Navigation

### CustomerLayout (`AuthLayout` removed)
Source: `Design/mysterybox_browse/code.html` nav

- **Nav**: `fixed top-0 w-full z-50 h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant`
- Left: `MysteryBox Fresh Food` in `gradient-text font-bold`
- Center (desktop): Marketplace · Subscriptions · My Orders · How it Works — active = `text-primary font-bold border-b-2 border-primary`
- Right: Language toggle (globe icon + "Language") + user avatar circle (photo or initials)
- Page content: `pt-16 max-w-container-max mx-auto px-lg py-xl`

### Footer (Browse + Subscriptions pages only)
- `bg-surface-container-lowest border-t border-outline-variant py-xl px-lg`
- Left: brand gradient text · Center: Privacy · Terms · Vendor Portal · Contact · Right: © 2026 SAVOR Tech

---

## 4. Customer Pages

### BrowsePage (`/browse`)
Source: `Design/mysterybox_browse/code.html`

- **Header**: "Browse Listings" headline + horizontal scrollable category chips (`overflow-x-auto`)
  - Active chip: `gradient-bg text-on-background rounded-full px-md py-xs`
  - Inactive chip: `bg-surface-variant border border-outline-variant rounded-full hover:border-primary`
- **Layout**: `flex flex-col md:flex-row gap-lg`
- **Filter sidebar** (`w-64 shrink-0 sticky top-24`): `bg-surface-container border border-outline-variant rounded-lg p-lg`
  - Search input with search icon, Price Range (min/max), "Available now" checkbox, Sort By select
  - All inputs: `bg-surface-dim border border-outline-variant focus:border-primary focus:ring-primary`
- **Card grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md`
- **ListingCard**: `mystery-border bg-surface-container border border-outline-variant rounded-b-lg hover:border-primary group`
  - Image `h-48` with `group-hover:scale-105 transition-transform duration-500`
  - Discount badge: `absolute top-sm right-sm bg-error text-on-error rounded-full` (e.g. "-40%")
  - Pickup chip: `absolute bottom-sm left-sm bg-surface-dim/80 backdrop-blur border border-outline-variant rounded-full` with clock icon
  - Body: title (`font-headline-md`), vendor name (`on-surface-variant`), category emoji
  - Footer: price in `text-primary font-mono-stat` + strikethrough original + stock badge (amber "3 Left" or gray "5+ Left")

### ListingDetailPage (`/listing/:id`)
Source: `Design/mysterybox_listing_detail/code.html`

- Back arrow + top nav
- Hero image full-width
- Title, vendor name, category chips
- Three stat tiles (Items, Total, Saved) in a row: `bg-surface-container border border-outline-variant rounded-lg p-md`
- "Claim This Box" `gradient-bg` CTA button full-width
- Description section
- Pickup window display

### OrdersPage (`/orders`)
Source: `Design/mysterybox_my_orders/code.html`

- "My Orders" headline + subtitle "Manage your recent marketplace claims and subscriptions."
- Card grid (`grid grid-cols-1 md:grid-cols-3 gap-md`)
- Each order card: `bg-surface-container border border-outline-variant rounded-lg p-md`
  - Order name (bold), status chip (top-right), date below
  - Box count (📦 icon + "x2 Boxes") + total price
  - Status chips: PAID=emerald bg, COD=amber bg, BANK=indigo bg, PICKED UP=gray text strikethrough on name

### OrderDetailPage (`/orders/:id`)
Source: `Design/mysterybox_order_detail/code.html`

- Mobile-first single column; top: "← My Orders" left + centered brand + avatar right
- Status chip (PENDING PICKUP / PAID / PICKED UP) + order number (#SVR-XXXX)
- Title: listing name, subtitle: "Pick up today between HH:MM - HH:MM"
- Three stat tiles: Items, Total, Saved
- **QR section**: `bg-surface-container border border-outline-variant rounded-lg` centered
  - "Pickup QR Code" header + subtitle
  - QR code display (white bg card inside dark container)
  - UUID display in `text-primary font-mono`
  - Share button (ghost) + Save QR button (gradient)
- **Payment Details** section: method, account name, account no (masked), reference (amber), status chip
- **Rate Your Experience**: StarRating + textarea + Submit (disabled until picked_up status)
- Footer

### CheckoutSuccessPage (`/checkout/success`)
Source: `Design/mysterybox_success/code.html`

- Centered single card with `brand-gradient-border-top` (matches login card style)
- `bg-background min-h-screen flex items-center justify-center`
- Green checkbox icon in circle
- "Payment Successful!" headline
- "Your QR code is ready. Thank you" subtitle
- "View My Order" gradient button

### CheckoutCancelPage (`/checkout/cancel`)
Source: `Design/mysterybox_cancelled/code.html`

- Same centered card layout, `bg-background min-h-screen`
- Card has **rose/red** top gradient accent
- Rose X-circle icon in circle (`bg-error/20`)
- "Payment Cancelled" headline
- "Your transaction was not completed. No charges have been made to your account."
- Ghost button "← Go back to browse" (full-width, `border border-outline-variant`)
- "Contact Support" text link below

### SubscriptionsPage (`/subscriptions`)
Source: `Design/mysterybox_subscriptions/code.html`

- **Hero section**: "Elevate Your Experience" headline, subtitle, "Explore Plans →" gradient button, 3D subscription box illustration (right side)
- **Plan grid** (`grid grid-cols-1 md:grid-cols-3 gap-md`):
  - Basic (Free): feature list, "Current Plan" disabled button
  - Elite (300.000đ/day, "MOST POPULAR" badge): feature list, "Upgrade to Elite" gradient button
  - Pro (150.000đ/day): feature list, "Select Pro" ghost button
- **Why Subscribe?** 3-col info grid: Sustainability · Local Support · Freshness Guaranteed

---

## 5. Vendor Pages

### VendorDashboardPage
**No changes.** Kept exactly as currently implemented.

### VendorLayout
- Dark fixed top nav: `bg-background/80 backdrop-blur-md border-b border-outline-variant h-16`
- Left: `MysteryBox Fresh Food` gradient text
- Center: Dashboard · Listings · Orders · Scan · Inventory · AI Compose — active link highlighted
- Right: Language toggle + user avatar

### VendorComposePage (`/vendor/compose`)
Source: Layout from `Design/inventory_intelligence_dashboard/code.html`, **dark color tokens**

3-column full-screen grid (`grid grid-cols-12 gap-gutter h-full`), dark theme:

- **Zone 1 — Inventory Catalog** (4 cols): `bg-surface-container border border-outline-variant rounded-xl`
  - Header: "Inventory" + ZONE 1 badge
  - Search input with search icon
  - Item rows: checkbox + emoji icon + name/SKU/price
    - Expiring: amber border (`border-tertiary`) + amber "Expires Today" chip
    - Selected: `border-primary` + indigo checkmark badge top-right + quantity stepper
    - Standard: `border-outline-variant hover:border-outline`
  - Quantity stepper: `border border-outline-variant` with `-` / number / `+`
  - Bottom summary: "N items selected" + "Total Value: XXX.000 đ"

- **Zone 2 — Controls + AI** (4 cols): two stacked cards
  - Pricing Controls card: discount % slider (accent-primary), amber AI price suggestion banner (apply button), "Suggest Price" outline button + "✨ Compose with AI" purple gradient button (`bg-secondary-container`) with shimmer
  - AI Suggestion card: `border-t-4 border-secondary-container ai-shadow`, recommended quantity (large stepper with `border-secondary-container`), price strikethrough → discounted, Packing Guide list

- **Zone 3 — Listing Editor** (4 cols): `bg-surface-container border border-outline-variant rounded-xl`
  - Header: "Listing Editor" + pencil icon (purple)
  - `✨ AI Suggestion (editable)` tag (`bg-secondary-container/10 text-secondary border border-secondary-container/20`)
  - Form: Category select, Title (sparkle prefix icon, `border-secondary-container/30`), Description textarea, Final Price (VND), Pickup Window (start + end datetime-local)
  - AI inputs: `border-secondary-container/30 focus:ring-secondary-container shadow-[0_0_0_1px_rgba(111,0,190,0.1)]`
  - Bottom: "Publish Listing →" full-width `gradient-bg` button

### ListingsPage, ListingFormPage, VendorOrdersPage, QRScanPage, VendorInventoryPage
- Dark `surface-container` cards, `outline-variant` borders, `mystery-border` top on listing cards
- All buttons: primary actions = `gradient-bg`, secondary = ghost `border border-outline-variant`
- Status chips: pending=amber, paid=indigo, picked_up=emerald, refunded=gray
- Form inputs: `bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-primary`
- Image upload preview: dashed `border-outline-variant` container

---

## Page → File Mapping

| Design file | React file |
|---|---|
| `mysterybox_login/` | `src/pages/auth/LoginPage.tsx` |
| `mysterybox_register/` | `src/pages/auth/RegisterPage.tsx` |
| `mysterybox_browse/` | `src/pages/customer/BrowsePage.tsx` + `src/components/layouts/CustomerLayout.tsx` |
| `mysterybox_listing_detail/` | `src/pages/customer/ListingDetailPage.tsx` |
| `mysterybox_my_orders/` | `src/pages/customer/OrdersPage.tsx` |
| `mysterybox_order_detail/` | `src/pages/customer/OrderDetailPage.tsx` |
| `mysterybox_subscriptions/` | `src/pages/customer/SubscriptionsPage.tsx` |
| `mysterybox_success/` | `src/pages/customer/CheckoutSuccessPage.tsx` |
| `mysterybox_cancelled/` | `src/pages/customer/CheckoutCancelPage.tsx` |
| `inventory_intelligence_dashboard/` (dark) | `src/pages/vendor/VendorComposePage.tsx` |
| — | `src/pages/vendor/VendorDashboardPage.tsx` (NO CHANGE) |

---

## Constraints

1. All existing Firebase/Stripe/i18n logic is preserved — only visual layer changes
2. `t('key')` translation calls kept on all user-visible strings
3. Critical rules from CLAUDE.md unchanged (orders only written by Cloud Functions, etc.)
4. No new routes added — same routing structure
5. `AuthLayout.tsx` is removed; Login and Register render standalone
6. `VendorDashboardPage` is explicitly excluded from all changes
