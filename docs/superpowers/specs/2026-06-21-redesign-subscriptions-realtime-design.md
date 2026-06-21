# MysteryBoxFreshFood — Full Redesign + Subscriptions + Real-Time Features

**Date:** 2026-06-21  
**Status:** Approved  
**Scope:** Full UI redesign from Design/ assets, new Subscriptions feature, real-time dynamic functions

---

## Overview

A full-application redesign applying the design system from `Design/mysterybox_marketplace/DESIGN.md` and `Design/intelligent_vendor_core/DESIGN.md` to all existing pages, plus two new feature areas:

1. **Subscriptions** — follow vendors (free) + optional weekly/monthly recurring Stripe plan
2. **Real-time dynamic features** — live stock counters, push notifications (FCM), live order status tracker

The app name remains **MysteryBoxFreshFood** throughout (not "SAVOR").  
**Theme:** Unified dark — all pages (customer + vendor) use the marketplace dark palette.

---

## Section 1 — Design System

### Color Tokens (`tailwind.config.js`)

Replace existing slate palette with:

```js
colors: {
  'background':                '#0c1324',
  'surface':                   '#0c1324',
  'surface-dim':               '#0c1324',
  'surface-bright':            '#33394c',
  'surface-container-lowest':  '#070d1f',
  'surface-container-low':     '#151b2d',
  'surface-container':         '#191f31',
  'surface-container-high':    '#23293c',
  'surface-container-highest': '#2e3447',
  'on-surface':                '#dce1fb',
  'on-surface-variant':        '#c7c4d7',
  'inverse-surface':           '#dce1fb',
  'inverse-on-surface':        '#2a3043',
  'outline':                   '#908fa0',
  'outline-variant':           '#464554',
  'surface-tint':              '#c0c1ff',
  'primary':                   '#c0c1ff',
  'on-primary':                '#1000a9',
  'primary-container':         '#8083ff',
  'on-primary-container':      '#0d0096',
  'inverse-primary':           '#494bd6',
  'secondary':                 '#ddb7ff',
  'on-secondary':              '#490080',
  'secondary-container':       '#6f00be',
  'on-secondary-container':    '#d6a9ff',
  'tertiary':                  '#ffb95f',
  'on-tertiary':               '#472a00',
  'tertiary-container':        '#ca8100',
  'on-tertiary-container':     '#3e2400',
  'error':                     '#ffb4ab',
  'on-error':                  '#690005',
  'error-container':           '#93000a',
  'on-error-container':        '#ffdad6',
  'surface-variant':           '#2e3447',
}
```

### Typography (`tailwind.config.js`)

```js
fontSize: {
  'headline-lg':        ['32px', { lineHeight: '40px',  letterSpacing: '-0.02em', fontWeight: '700' }],
  'headline-lg-mobile': ['24px', { lineHeight: '32px',  letterSpacing: '-0.01em', fontWeight: '700' }],
  'headline-md':        ['20px', { lineHeight: '28px',  fontWeight: '600' }],
  'body-lg':            ['16px', { lineHeight: '24px',  fontWeight: '400' }],
  'body-sm':            ['14px', { lineHeight: '20px',  fontWeight: '400' }],
  'label-caps':         ['12px', { lineHeight: '16px',  letterSpacing: '0.05em', fontWeight: '700' }],
  'mono-stat':          ['18px', { lineHeight: '24px',  letterSpacing: '-0.01em', fontWeight: '600' }],
}
fontFamily: { sans: ['Inter', 'sans-serif'] }
```

### Border Radius

```js
borderRadius: {
  DEFAULT: '0.25rem',
  lg:      '0.5rem',
  xl:      '0.75rem',
  full:    '9999px',
}
```

### Global CSS Utilities (`src/index.css`)

```css
.gradient-bg {
  background-image: linear-gradient(to right, #494bd6, #6f00be);
}
.gradient-text {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(to right, #c0c1ff, #ddb7ff);
}
.mystery-border {
  border-top: 4px solid transparent;
  border-image: linear-gradient(to right, #494bd6, #6f00be) 1;
}
.glass-panel {
  background-color: rgba(12, 19, 36, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.gradient-border {
  border: 1px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px #8083ff;
}
```

### Shared Component Library (`src/components/shared/`)

| Component | Description |
|---|---|
| `GradientButton.tsx` | Primary CTA — gradient-bg, white text, rounded-xl, hover opacity-90 |
| `GhostButton.tsx` | Secondary — outline-variant border, on-surface text, rounded-xl |
| `MysteryCard.tsx` | Listing card — surface-container bg, outline-variant border, mystery-border top, image + badges + info |
| `StatusChip.tsx` | Small badge — variants: amber (tertiary), emerald (success), rose (error), slate (neutral) |
| `TimerBadge.tsx` | Countdown chip — uses `useCountdown` hook, amber color, fire icon |
| `StockBadge.tsx` | "X left" badge — subscribes to listing via onSnapshot prop, turns rose at ≤ 2 |
| `GlassNav.tsx` | Fixed top nav — glass-panel bg, brand gradient logo text, right-side icons |
| `NotificationPanel.tsx` | Slide-out panel — lists notifications from `notifications/{uid}/items`, mark-read actions |
| `StockProgressBar.tsx` | Horizontal bar — gradient fill, surface-container-high track, amber when stock ≤ 2 |

---

## Section 2 — Customer Pages Redesign

### LoginPage (`/login`)
- Full-screen `background` canvas
- Centered `surface-container` card, `outline-variant` border, `rounded-xl`, max-w-md
- Gradient text logo at top: "MysteryBox**FreshFood**"
- Email + password inputs: `surface-container-lowest` fill, `outline-variant` border, `primary` glow on focus, `rounded-xl`
- `<GradientButton>` "Sign In" full-width
- Ghost link to `/register`
- Error displayed as `error` color text below button

### RegisterPage (`/register`)
- Same card layout as login
- Fields: Display name, Email, Password, Role toggle (customer / vendor chips), vendor-only: Store Name field (revealed when vendor selected)
- `<GradientButton>` "Create Account"

### BrowsePage (`/browse`)
- `<GlassNav>` sticky: logo (gradient text) + search icon + notifications bell (unread dot badge) + language toggle + profile avatar
- Hero greeting: "Good evening, {name} 👋" in `headline-lg-mobile`, sub-line "What's fresh tonight?" in `on-surface-variant`
- Category chips row: horizontal scroll on mobile, `surface-container` bg chips, active chip gets `gradient-bg`
- Listing grid: 3-col desktop / 2-col tablet / 1-col mobile, gap-lg
- Each `<MysteryCard>`:
  - Food image (aspect-video, object-cover, rounded-lg)
  - Discount badge overlay: `tertiary-container/20` backdrop, fire icon, `label-caps` text
  - `mystery-border` top (4px gradient)
  - Vendor name + category `<StatusChip>`
  - Title (`headline-md`), truncated 1 line
  - Price (`primary` color) + strikethrough original (`outline` color line-through)
  - Bottom row: `<TimerBadge>` + `<StockBadge>` (live via `onSnapshot`)
- Empty state: illustrated empty box SVG + "No boxes right now — check back later"
- Loading skeleton: 6 card-shaped `animate-pulse` blocks

### ListingDetailPage (`/listing/:id`)
- `<GlassNav>` sub-page: back arrow + "Browse" label on left, share + favorite icons on right
- 2-column layout on desktop (md:grid-cols-2), stacked on mobile
- **Left:** food image full height, discount badge overlay top-left
- **Right column:**
  - Title (`headline-lg-mobile` / `headline-lg`) + description (`on-surface-variant`)
  - Price line: `primary` large + `outline` strikethrough
  - Timer status banner: `primary/10` bg, `outline-variant` border, timer icon + countdown left + packed-at time right
  - 2×2 info grid (`surface-container` cards): Stock (live `<StockBadge>`), Pickup Window, Category, Vendor
  - Vendor mini-card: avatar + store name → links to `/store/:vendorId`
  - Reviews section (existing `StarRating` + review list)
- Sticky bottom bar (mobile): `<GradientButton>` "Claim Box — {price}đ"
- Sold-out state: button disabled, rose "Sold Out" chip

### CheckoutSuccessPage (`/checkout/success`)
- Centered, emerald checkmark icon in gradient circle
- "Order Confirmed!" headline
- Order summary card: box name + vendor + price
- `<QRCode>` component (large, centered)
- **Live order status tracker:** 3-step progress bar driven by `onSnapshot` on `orders/{id}`
  - Steps: Paid ✓ → Ready for Pickup → Picked Up
  - Active step pulses with `primary` glow
- "View All Orders" ghost button

### CheckoutCancelPage (`/checkout/cancel`)
- Rose X icon, "Payment Cancelled" headline
- "Your box is still available — go back and try again?" message
- `<GradientButton>` "Browse Again" → `/browse`

### OrdersPage (`/orders`)
- List of order cards: box thumbnail + box name + vendor + price + date + `<StatusChip>` (paid / picked_up / refunded)
- Sorted by `createdAt DESC`
- Empty state: "No orders yet — start browsing!"
- Tap card → `OrderDetailPage`

### OrderDetailPage (`/orders/:id`)
- Large `<QRCode>` display (centered)
- Order info grid: Order ID, Vendor, Box, Price, Pickup Deadline, Status
- **Live 3-step status tracker** (same as success page) driven by `onSnapshot`
- Share QR button (existing Web Share API)

### SubscriptionsPage (`/subscriptions`) *(new)*

**Section A — Follow Vendors**
- Heading "Vendors You Follow"
- Grid of vendor cards: avatar + store name + location + notification bell toggle
- Bell toggle updates `notificationsEnabled` on `follows/{id}` doc
- "Discover vendors" CTA linking to `/browse`
- Empty state: "Follow vendors to get notified when they list new boxes"

**Section B — Weekly Plan**
- Hero: VIP ACCESS badge chip + "Elevate Your Experience" headline (gradient text) + subtitle
- 3 plan cards (grid-cols-1 md:grid-cols-3):
  - **Free** — follow vendors, basic notifications — `ghost-button` "Current" or "Select"
  - **Weekly 49.000đ** — priority pickup, early access, weekly box guaranteed — gradient border when active
  - **Monthly 179.000đ** — all weekly perks + monthly discount voucher — gradient border when active
- Active plan card has gradient border + "Active" emerald chip + "Cancel Plan" ghost button + next billing date
- Subscribing calls `createStripeSubscription` callable → Stripe payment element modal
- Cancelling calls `cancelSubscription` callable → confirms, updates UI

---

## Section 3 — Vendor Pages Redesign

All vendor pages use the same dark design tokens. The "analytical" feel is expressed through data tables, `mono-stat` typography, and `<StockProgressBar>` — not a light theme.

### VendorDashboardPage (`/vendor`)
- `<GlassNav>` with store name (gradient text) + scan icon + settings
- 4 stat cards row (`surface-container`, `outline-variant` border):
  - Total Revenue (`mono-stat`, emerald)
  - Active Listings (`mono-stat`, primary)
  - Pending Pickups (`mono-stat`, amber)
  - Avg Rating (`mono-stat` + star icon, primary)
- Revenue sparkline (Recharts, existing) restyled: `primary` line, `surface-container` bg, no grid lines
- Two-column lower section:
  - Recent orders table (compact rows, `outline-variant` dividers, `<StatusChip>`)
  - Quick-action panel: AI Box Composer (purple gradient button), New Listing, Scan QR

### ListingsPage (`/vendor/listings`)
- Top toolbar: search input + category filter dropdown + "AI Box Composer" button (secondary gradient + sparkle icon)
- Table view (replaces card grid):
  - Columns: Image (40px thumb) / Name / Category / Stock / Price / Status / Actions
  - Inline `<StockProgressBar>` per row, turns amber when ≤ 2
  - Draft rows: 60% opacity
  - Status toggle (active / draft) inline
  - Row actions: Edit | Delete
- **Real-time:** collection subscribed via `onSnapshot` — stock changes from purchases appear live
- Empty state: gradient-text "No listings yet" + "Create your first box" gradient button

### ListingFormPage (`/vendor/listings/new` + `/vendor/listings/:id/edit`)
- `surface-container` card, single-column form:
  - Image upload with live preview (existing)
  - Title + description (existing)
  - Category select (10 categories, existing)
  - Price input (VND)
  - Quantity stepper (− / number / + buttons, `outline-variant` borders, `primary` on focus)
  - Packed-at datetime (existing)
  - Pickup window start/end (existing)
  - Publish toggle
- `<GradientButton>` "Save Listing"
- AI Compose shortcut button → `VendorComposePage`

### VendorComposePage (`/vendor/compose`)
- Existing AI Box Composer flow, restyled:
  - `surface-container-highest` bg modal
  - `secondary/30` border (purple tint — signals AI)
  - Sparkle icon prefix on ingredient input field
  - "Compose" button: secondary gradient (purple→indigo)
  - Generated result card: same purple-tinted border, result fields editable

### VendorOrdersPage (`/vendor/orders`)
- Orders table: Customer / Box / Amount / Status / Pickup Deadline / Actions
- `<TimerBadge>` in deadline column when < 1 hour
- **Real-time** via `onSnapshot`
- Expandable row: shows QR UUID + customer email

### QRScanPage (`/vendor/scan`)
- Full-screen camera view
- `<GlassNav>` overlay at top
- Scanning reticle: animated gradient border
- Success state: emerald overlay flash + order summary (customer name, box, time)
- Error state: rose overlay flash + error message

### VendorInventoryPage (`/vendor/inventory`)
- Restyled data table: Name / Category / Stock / Packed At / Status
- Amber warning rows when stock ≤ 2 (`tertiary-container/10` bg, `tertiary` left border)
- AI restock suggestion chips (purple, "Suggest: +5") next to low-stock items
- Inline quantity edit: click number → input field with `primary` border

---

## Section 4 — Real-Time & Dynamic Features

### Real-Time Stock Counter
- `<StockBadge>` accepts a `quantityRemaining: number` prop (passed from parent) — it does NOT subscribe internally to avoid N+1 Firestore subscriptions on BrowsePage
- `BrowsePage` subscribes to the vendor listing collection once via `onSnapshot` and passes `quantityRemaining` down to each card
- `ListingDetailPage` subscribes to a single listing doc via `onSnapshot` and passes `quantityRemaining` to `<StockBadge>`
- On the vendor `ListingsPage`, the entire vendor listing collection is subscribed via `onSnapshot`
- When `quantityRemaining` reaches 0: card shows "Sold Out" chip, Claim button disabled

### Push Notifications (FCM)
- On customer first login: `Notification.requestPermission()` → on grant, call `savePushToken` callable
- FCM token stored in `pushTokens/{uid}` (`fcmToken`, `updatedAt`)
- Cloud Function `onListingPublished`: triggers on `listings/{id}` `onUpdate` when `status` changes to `"active"`. Queries `follows` where `vendorId == listing.vendorId AND notificationsEnabled == true`, fetches their FCM tokens, sends FCM multicast
- Notification message: `"{storeName} listed a new box — {title} for {price}đ. Grab it before it's gone!"`
- `notifications/{uid}/items/{id}` subcollection written per recipient: `{ title, body, listingId, vendorId, read: false, createdAt }`
- `<GlassNav>` bell icon: `onSnapshot` on `notifications/{uid}/items` where `read == false` → unread count badge
- `<NotificationPanel>`: slide-out from right, lists items, tapping marks read + navigates to listing

### Live Order Status Tracker
- `OrderDetailPage` and `CheckoutSuccessPage` call `onSnapshot` on `orders/{orderId}`
- 3-step progress bar component: steps = `['paid', 'ready', 'picked_up']`
- Active step rendered with `primary` glow animation
- When vendor scans QR and order flips to `picked_up`, customer sees update within ~1 second

### Subscriptions — Follow Vendors
- `follows/{followId}`: `{ customerId, vendorId, notificationsEnabled: true, createdAt }`
- `src/services/follows.ts`: `followVendor(vendorId)`, `unfollowVendor(vendorId)`, `getFollows(customerId)`, `toggleNotifications(followId, enabled)`
- Follow button on `VendorStorePage`: checks if follow doc exists for current user → renders Follow/Following toggle
- `SubscriptionsPage` Section A reads follows via `getDocs` with `where('customerId', '==', uid)`

### Subscriptions — Recurring Plans
- `subscriptions/{id}`: `{ customerId, plan, stripeSubscriptionId, status, currentPeriodEnd, createdAt }`
- `plans`: `free` (no Stripe), `weekly` (49.000đ), `monthly` (179.000đ)
- `createStripeSubscription` callable: creates Stripe `Customer` (if not exists), creates `Subscription` with `price_data`, returns `clientSecret` → frontend shows Stripe Payment Element in modal
- `stripeSubscriptionWebhook` HTTP: handles:
  - `invoice.paid` → set `status: active`, update `currentPeriodEnd`
  - `invoice.payment_failed` → set `status: past_due`
  - `customer.subscription.deleted` → set `status: cancelled`
- `cancelSubscription` callable: calls `stripe.subscriptions.cancel(id)`, sets `status: cancelled`
- `src/services/subscriptions.ts`: `getSubscription(uid)`, `cancelSubscription(subscriptionId)`

---

## Section 5 — Data Layer

### New Firestore Collections

| Collection | Key Fields |
|---|---|
| `follows/{followId}` | `customerId`, `vendorId`, `notificationsEnabled`, `createdAt` |
| `subscriptions/{id}` | `customerId`, `vendorId?`, `plan`, `stripeSubscriptionId`, `status`, `currentPeriodEnd` |
| `pushTokens/{uid}` | `fcmToken`, `updatedAt` |
| `notifications/{uid}/items/{id}` | `title`, `body`, `listingId`, `vendorId`, `read`, `createdAt` |

### New Firestore Indexes

- `follows`: `customerId ASC + createdAt DESC`
- `follows`: `vendorId ASC + notificationsEnabled ASC`
- `subscriptions`: `customerId ASC + status ASC`
- `notifications/{uid}/items`: `read ASC + createdAt DESC`

### New Cloud Functions (`functions/src/`)

| File | Type | Purpose |
|---|---|---|
| `onListingPublished.ts` | Firestore trigger `onUpdate` | Sends FCM push to followers on listing activation |
| `createStripeSubscription.ts` | Callable | Creates Stripe Customer + Subscription |
| `stripeSubscriptionWebhook.ts` | HTTP | Handles Stripe subscription lifecycle events |
| `cancelSubscription.ts` | Callable | Cancels Stripe subscription |
| `savePushToken.ts` | Callable | Saves/refreshes FCM token |

### New Services (`src/services/`)

| File | Exports |
|---|---|
| `follows.ts` | `followVendor`, `unfollowVendor`, `getFollows`, `toggleNotifications` |
| `subscriptions.ts` | `getSubscription`, `cancelSubscription` |
| `pushNotifications.ts` | `requestPermission`, `savePushToken` |
| `notifications.ts` | `getNotifications`, `markRead`, `markAllRead` |

### Updated `src/types.ts`

New interfaces: `Follow`, `Subscription`, `PushToken`, `NotificationItem`  
New union types: `SubscriptionPlan = 'free' | 'weekly' | 'monthly'`  
`SubscriptionStatus = 'active' | 'cancelled' | 'past_due'`

### New Routes

| Path | Component | Role |
|---|---|---|
| `/subscriptions` | `SubscriptionsPage` | Customer |

### New i18n Keys

Both `en/translation.json` and `vi/translation.json` extended with keys for:
- Subscription plan names, prices, descriptions
- Follow/unfollow button labels
- Notification panel strings
- Live status tracker step labels
- "Sold Out" chip label

---

## Implementation Notes

- Firebase Cloud Messaging requires `firebase-messaging-sw.js` service worker in `/public`
- FCM VAPID key stored in `.env.local` as `VITE_FIREBASE_VAPID_KEY`
- Stripe subscription prices are created at runtime via `price_data` (no pre-created Price IDs needed)
- `onListingPublished` trigger must handle both `onCreate` and `onUpdate` (vendor may toggle active/draft multiple times)
- De-duplicate FCM sends: check `updatedAt` on listing to avoid re-sending on unrelated field updates
- `stripeSubscriptionWebhook` shares the same webhook secret flow as existing `stripeWebhook`
