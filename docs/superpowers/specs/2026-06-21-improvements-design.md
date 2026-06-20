# MysteryBox — Market Improvements Design Spec
**Date:** 2026-06-21  
**Status:** Approved  
**Extends:** `docs/superpowers/specs/2026-06-19-extensions-design.md`

---

## Overview

Three improvements targeting the Vietnamese F&B market, addressing friction points not present in the European context where Too Good To Go operates.

| ID | Feature | Core insight |
|---|---|---|
| E1 | Share QR / Proxy Pickup | Motorbike culture → group trips; one person collects for friends |
| E2 | One-Touch Box Creation | Exhausted closing-shift staff → remove manual data entry friction |
| E3 | Food Safety Countdown + Auto-Refund | Low food trust → transparency on freshness + money-back guarantee |

All three build on the existing stack with no new frontend libraries. E3 adds one new Cloud Function and one new Stripe API call.

---

## E1 — Share QR / Proxy Pickup

### What changes

`OrderDetailPage` gets a **"Share QR"** button rendered below the existing `<QRCodeSVG>` component.

### Implementation

The existing QR code is a UUID stored as `order.qrCode`. The vendor scanner validates it against `vendorId` and `status: "paid"` — it has no knowledge of who *presents* the code, so proxy pickup already works technically. This feature makes it official and visible.

**Button behavior:**

1. Render the QR as a canvas using `<QRCodeCanvas ref={canvasRef} />` (the canvas variant of `qrcode.react`, already installed)
2. Call `canvasRef.current.toBlob()` to get a PNG blob
3. If `navigator.share` is available (mobile browsers, PWA): call `navigator.share({ files: [pngFile], title: 'MysteryBox QR' })`
4. Fallback (desktop): create a hidden `<a href={blobUrl} download="mysterybox-qr.png">` and programmatically click it

**UI addition below QR code:**
```
[ Share QR for pick-up ]       ← primary button
You can share this QR with a friend to pick up on your behalf.
```

### No Firestore changes

The QR UUID is already on the order. No new fields required.

### New i18n keys
```
order.share_qr       "Share QR for pick-up"
order.download_qr    "Download QR"
order.share_qr_note  "You can share this QR with a friend to pick up on your behalf."
```

---

## E2 — One-Touch Box Creation

### What changes

`ListingsPage` gets a **"Quick Create"** button (top-right, beside the existing "New Listing" button). It opens a compact modal that pre-fills a listing from historical analytics.

### Modal flow

```
Step 1: Select category     [bakery] [rice] [noodles] [drinks] [snacks] [other]
Step 2: Select volume       [  Low  ] [  Medium  ] [  High  ]
         Suggested: 8 boxes  (computed, ± adjustable)
Step 3: Price               [35,000 đ]  ← pre-filled from last listing in this category
Step 4: Pickup window       [17:00] → [21:00]  (today, editable)
         [ Create Now ]
```

### Quantity estimation (client-side, `src/utils/quickCreate.ts`)

```ts
const MULTIPLIERS = { low: 0.5, medium: 1.0, high: 1.5 }

function suggestQuantity(
  orders: Order[],        // vendor's paid/picked_up orders, last 14 days
  volume: 'low' | 'medium' | 'high'
): number {
  const paid = orders.filter(o => ['paid', 'picked_up'].includes(o.status))
  const avgDailySold = paid.length / 14
  return Math.max(1, Math.ceil(avgDailySold * MULTIPLIERS[volume]))
}
```

Uses overall vendor order volume (not category-filtered) — orders have no `category` field, that lives on `listings`. The overall daily average is a reliable signal since most vendors sell 1–2 categories. Uses the same order query already made by the D1 analytics tab — no extra Firestore reads if the dashboard is already mounted. If not, a single `getVendorOrders(uid)` call suffices (same service function used by analytics).

### Auto-generated listing title

```
"{StoreName} Mystery Box — {Category}"   e.g. "Bánh Mì Hoa Mystery Box — Bakery"
```

Editable before submit. Vendor can override.

### Submission

Calls the existing `createListing(data)` service with the same shape as the full form. The modal is a thin UI layer over the existing service — no new backend logic.

### New i18n keys
```
vendor.quick_create           "Quick Create"
vendor.quick_create_modal     "Quick Listing"
vendor.volume_low             "Low"
vendor.volume_medium          "Medium"
vendor.volume_high            "High"
vendor.suggested_qty          "Suggested: {{count}} boxes"
vendor.auto_title             "{{store}} Mystery Box — {{category}}"
vendor.pickup_window          "Pickup window"
```

---

## E3 — Food Safety Countdown + Auto-Refund

### Data model additions

**`listings/{id}`** — one new optional field:
```
packedAt   Timestamp   when the food was packed; set by vendor at listing creation
```

**`orders/{id}`** — two new fields written by Cloud Functions (never by client):
```
stripePaymentIntentId   string      set by stripeWebhook when checkout.session.completed fires
                                    (session.payment_intent is available in the Stripe event)
pickupEnd               Timestamp   denormalized from listing at order creation time
                                    set by createCheckoutSession when writing the pending order
```

`pickupEnd` denormalization is necessary so the auto-refund Cloud Function can query `orders` directly without joining listings.

### Countdown UI

New hook: `src/hooks/useCountdown.ts`

```ts
function useCountdown(end: Date): { hoursLeft: number; minutesLeft: number; urgent: boolean }
```

Recalculates every 60 seconds via `setInterval`. Returns `urgent: true` when ≤ 30 minutes remain.

**`ListingCard`** — countdown badge (right side of card, below price):

| Time remaining | Badge |
|---|---|
| > 3 hours | hidden |
| 1h – 3h | indigo — "⏱ 2h 15m left" |
| ≤ 30 min | red — "⏱ 28m left — Hurry!" |
| expired | grey — "Expired" |

**`ListingDetailPage`** — same badge, plus:
- "Packed at 17:30" label (shown only if `packedAt` is set)
- Larger countdown display below pickup window

### Auto-Refund Cloud Function (`autoRefundExpiredOrders`)

**Schedule:** every 5 minutes via Cloud Scheduler (`pubsub.schedule('every 5 minutes')`)

**Logic:**
```ts
const expiredOrders = await db
  .collection('orders')
  .where('status', '==', 'paid')
  .where('pickupEnd', '<', admin.firestore.Timestamp.now())
  .get()

for (const doc of expiredOrders.docs) {
  const order = doc.data()
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(doc.ref)
    if (fresh.data()?.status !== 'paid') return  // already processed
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
    tx.update(doc.ref, { status: 'refunded' })
  })
}
```

The Firestore transaction re-checks status before calling Stripe to prevent double-refunds if the function retries (Cloud Functions guarantee at-least-once execution).

**Required Firestore index (composite):**
```
collection: orders
fields:     status ASC, pickupEnd ASC
```

### Order status in UI

`OrderDetailPage` handles new status `"refunded"`:
```
Status badge: grey "Refunded"
Note:         "This order expired — your payment has been refunded."
```

### Payment method scope

The Stripe Refunds API (`stripe.refunds.create`) works for **any payment method Stripe processed through the PaymentIntent** — cards (Visa/Mastercard), Stripe-integrated e-wallets (MoMo, ZaloPay via Stripe), and bank transfers via Stripe. It does **not** apply to payments made outside Stripe (e.g. direct bank transfer to vendor). For this prototype using Stripe test mode, all payments are card-based and refunds work fully.

### New i18n keys
```
listing.packed_at        "Packed at {{time}}"
listing.time_left        "{{hours}}h {{minutes}}m left"
listing.expiring_soon    "Expiring soon — Hurry!"
listing.expired          "Expired"
order.status_refunded    "Refunded"
order.refund_note        "This order expired — your payment has been refunded."
```

---

## Stripe Setup Guide (if you don't have an account yet)

### Step 1 — Create a Stripe account

1. Go to [stripe.com](https://stripe.com) → **Start now** → sign up with your email
2. You do not need to activate a live account for development — test mode works immediately with no identity verification
3. In the Stripe Dashboard, stay in **Test mode** (toggle top-left)

### Step 2 — Get your API keys

Dashboard → **Developers** → **API keys**:

| Key | Where to use |
|---|---|
| Publishable key (`pk_test_...`) | `VITE_STRIPE_PUBLISHABLE_KEY` in `.env.local` |
| Secret key (`sk_test_...`) | `functions/.runtimeconfig.json` → `stripe.secret` |

`functions/.runtimeconfig.json` format:
```json
{
  "stripe": {
    "secret": "sk_test_YOUR_KEY_HERE",
    "webhook_secret": "whsec_YOUR_WEBHOOK_SECRET_HERE"
  }
}
```

### Step 3 — Register the webhook

**For local development (Stripe CLI):**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:5001/{your-project-id}/us-central1/stripeWebhook
```
The CLI prints a webhook signing secret (`whsec_...`) — paste it into `runtimeconfig.json` as `stripe.webhook_secret`.

**For production:**
Dashboard → **Developers** → **Webhooks** → **Add endpoint**:
- URL: `https://us-central1-{your-project-id}.cloudfunctions.net/stripeWebhook`
- Events to listen for: `checkout.session.completed`
- Copy the signing secret into your deployed function config:
  ```bash
  firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..."
  ```

### Step 4 — Test a refund (test mode)

```bash
# Simulate a checkout completion
stripe trigger checkout.session.completed

# Check the refund was issued
stripe refunds list
```

To test the auto-refund Cloud Function locally:
1. Create an order with a `pickupEnd` in the past
2. Trigger the function manually: `firebase functions:shell` → `autoRefundExpiredOrders({})`
3. Confirm the order status changed to `"refunded"` in Firestore

### Step 5 — Go live

When ready for real payments:
1. Complete Stripe identity verification in the Dashboard
2. Replace `pk_test_` / `sk_test_` keys with `pk_live_` / `sk_live_` keys
3. Re-register the webhook endpoint in live mode with live keys
4. The refund function code is identical — Stripe handles test vs. live automatically based on which key is used

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/pages/customer/OrderDetailPage.tsx` | Add Share QR button + `"refunded"` status handling |
| `src/utils/quickCreate.ts` | New — quantity estimation logic |
| `src/hooks/useCountdown.ts` | New — countdown hook |
| `src/pages/vendor/ListingsPage.tsx` | Add Quick Create button + modal |
| `src/pages/customer/ListingCard.tsx` | Add countdown badge |
| `src/pages/customer/ListingDetailPage.tsx` | Add packed-at label + countdown |
| `src/pages/vendor/ListingFormPage.tsx` | Add optional `packedAt` field |
| `src/services/listings.ts` | Include `packedAt` in create/update |
| `src/services/orders.ts` | Handle `"refunded"` status |
| `src/locales/en/translation.json` | New keys (E1 + E2 + E3) |
| `src/locales/vi/translation.json` | New keys (E1 + E2 + E3) |
| `functions/src/createCheckoutSession.ts` | Write `pickupEnd` onto order |
| `functions/src/stripeWebhook.ts` | Write `stripePaymentIntentId` onto order |
| `functions/src/index.ts` | Register `autoRefundExpiredOrders` scheduled function |
| `functions/src/autoRefundExpiredOrders.ts` | New — scheduled auto-refund logic |
| `firestore.indexes.json` | Add composite index: orders(status, pickupEnd) |
