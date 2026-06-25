# Mystery Box Selection, Distribution & Reveal

**Date:** 2026-06-25
**Status:** Approved
**Supersedes:** `2026-06-25-vendor-order-detail-mystery-distribution-design.md`

---

## Overview

Three connected features:

1. **Value-balanced random distribution** — when a vendor composes a listing, items are distributed across N unique box plans using a greedy algorithm. Each box has different contents but roughly equal value.
2. **Customer box selection** — customers pick a numbered box (Box 1, Box 2 ...) on the listing detail page before paying. Contents are revealed only after Stripe or VNPAY payment succeeds. COD and bank transfer get no selection or reveal.
3. **Compensation for poor boxes** — if a customer collects a box whose value is noticeably below average (>15% under), they receive a push notification and a 10% discount on their next purchase after pickup.

---

## Data Model

### `BoxItem` — extend with unit

```ts
interface BoxItem {
  name: string
  qty: number
  unit?: string   // e.g. "bottle", "loaf", "piece", "bag"
}
```

### `BoxPlan` — new type

```ts
interface BoxPlan {
  boxNumber: number          // 1, 2, 3 ... (no letter limit)
  items: BoxItem[]           // unique contents for this box
  value: number              // estimated value in VND
  belowAverage: boolean      // true if value < 85% of average across all boxes
  takenByOrderId?: string    // set atomically when purchased
}
```

### `Listing` — add boxPlans

```ts
boxPlans?: BoxPlan[]   // one plan per box slot; new listings use this
boxContents?: BoxItem[] // kept for backward compat (old listings without per-box plans)
```

### `Order` — add box fields

```ts
boxNumber?: number          // which box the customer received
boxContents?: BoxItem[]     // contents of their specific box (written after Stripe/VNPAY payment only)
boxReassigned?: boolean     // true if original choice was already taken
originalBoxNumber?: number  // what they picked before reassignment
requestedBoxNumber?: number // stored at session creation, used by webhook
```

### `Discount` — new type

```ts
// Firestore path: discounts/{customerId}/codes/{id}
interface Discount {
  customerId: string
  percent: number        // 10
  reason: 'low_value_box'
  expiresAt: Timestamp   // 30 days from issue
  usedAt?: Timestamp
  createdAt: Timestamp
}
```

---

## Feature 1: Distribution Algorithm

Runs client-side in `VendorComposePage` when vendor clicks "Generate Boxes". Result stored as `boxPlans` on the listing at publish time.

### Algorithm

**Step 1 — Target value**
```
totalValue = sum(item.unitPrice × item.qty for all selected items)
targetPerBox = totalValue / numBoxes
```

**Step 2 — Sort expensive first**
Sort selected items by `unitPrice` descending so high-value items spread before cheap filler.

**Step 3 — Greedy random fill**
For each unit of each item (one unit at a time, expensive first):
- Pick randomly from the **bottom 40% of boxes** by current value (furthest below target).
- Add the item unit to that box, update its running value.
- Carry `unit` from the inventory item into `BoxItem`.

The bottom-40% window introduces randomness while biasing toward balance. Natural variance of 5–15% is expected and intentional — customers getting higher-value boxes feel like they won.

**Step 4 — Balance pass**
After all items distributed:
- If any box value deviates >20% from target:
  - Swap one item between richest and poorest box to close the gap.
  - Repeat until all boxes are within ±20% or no improving swap exists.

**Step 5 — Flag below-average boxes**
```
average = totalValue / numBoxes
box.belowAverage = box.value < average × 0.85
```

**Step 6 — Edge cases**
- Leftover units (qty not divisible cleanly) go to boxes still furthest below target.
- If `numBoxes > totalUnits` for a high-value item: some boxes simply won't contain that item — acceptable, increases variety.

### VendorComposePage UI changes

Replace the current flat "packing guide" table with a **box preview list**:

- Each box shown as a card: `"Box 1 — ~42.000 đ"` with its item list (smart format, see Feature 3)
- If `belowAverage: true`, show a subtle warning badge on that box card: `"Below average value — customer gets 10% discount after pickup"`
- **"Re-randomize"** button reruns the algorithm with a new random seed
- Publish button only enabled after box preview is generated and vendor has reviewed it

---

## Feature 2: Customer Box Selection & Reveal

### ListingDetailPage — box selector

A box selector appears **inline with the category chip** in a `flex-wrap` row:
- On desktop: buttons sit side by side with the category chip
- On mobile: wraps naturally to the next line — no separate panel

Only boxes where `takenByOrderId` is unset are shown. Sold boxes are hidden entirely.

Each button label: `"Box 1"`, `"Box 2"`, `"Box 3"` etc.

On tap: button highlights (selected state). The checkout button (Stripe / VNPAY) remains disabled until a box is selected.

**COD and bank transfer:** Box selector is hidden entirely. A note explains: *"Box selection available for card and VNPAY payments only."* These orders get no box assignment and no reveal.

### Checkout flow

`createCheckoutSession` and `createVNPayOrder` accept a new param `boxNumber?: number`. The pending order document stores `requestedBoxNumber: boxNumber`.

### Payment webhooks — box assignment transaction

`stripeWebhook` and `vnpayIPN`, when payment is confirmed:

```
transaction:
  read Listing.boxPlans
  find plan where boxNumber === order.requestedBoxNumber AND !takenByOrderId
    → found: mark plan.takenByOrderId = orderId
             write Order.boxNumber = plan.boxNumber
             write Order.boxContents = plan.items
    → taken: find next available plan (lowest boxNumber without takenByOrderId)
             mark it taken
             write Order.boxNumber, Order.boxContents
             write Order.boxReassigned = true
             write Order.originalBoxNumber = requestedBoxNumber
  write Listing.boxPlans (updated)
```

### Reveal UI — CheckoutSuccessPage and OrderDetailPage

If `order.boxContents` exists AND `order.paymentMethod` is `stripe` or `vnpay`:

- Show a reveal card: **"🎁 Your Box {boxNumber} contained:"** followed by the item list (smart format)
- If `order.boxReassigned === true`: show banner above card: *"Box {originalBoxNumber} was just taken — you got Box {boxNumber} instead"*

COD and bank transfer orders: no reveal card, no box number shown anywhere on customer side.

---

## Feature 3: Item Display Format

Used in vendor views (ComposePage box preview, VendorOrderDetailPage) and customer reveal card.

### Rule

```
if item.name contains a measurement (regex: /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|mg|oz)/i)
  AND item.unit is set:
    totalMeasurement = amount × qty
    display: "{totalMeasurement}{unit_of_measure} {itemName} (×{qty} {item.unit})"

else:
    display: "×{qty} {itemName}"
```

### Examples

| name | qty | unit | Display |
|---|---|---|---|
| `sữa tươi 300ml` | 2 | `bottle` | `600ml sữa tươi (×2 bottles)` |
| `nước ép 500ml` | 1 | `can` | `500ml nước ép (×1 can)` |
| `bánh mì` | 3 | `loaf` | `×3 bánh mì` |
| `thịt 250g` | 2 | `pack` | `500g thịt (×2 packs)` |

---

## Feature 4: Post-Pickup Discount for Poor Boxes

Triggered in the QR scan Cloud Function (`scanQR.ts`) when order status is set to `picked_up`:

```
if order.boxContents exists:
  find BoxPlan in Listing.boxPlans where boxNumber === order.boxNumber
  if plan.belowAverage:
    create discounts/{customerId}/codes/{newId} {
      percent: 10,
      reason: 'low_value_box',
      expiresAt: now + 30 days
    }
    send push notification to customer:
      "Sorry your box wasn't the best today — enjoy 10% off your next order!"
```

### Discount application at checkout

`createCheckoutSession` and `createVNPayOrder` check for an active discount:
```
query discounts/{customerId}/codes where usedAt == null AND expiresAt > now LIMIT 1
if found: apply percent discount to session price, mark discount usedAt = now
```

---

## VendorOrderDetailPage (new)

**Route:** `/vendor/orders/:id`

**Layout:**

- **Order header card:** listing title, date, status chip, payment method badge, quantity, total price
- **"What to prepare" card:** per-box breakdown
  - Heading: *"Cần chuẩn bị / What to prepare"*
  - For each box in the order (if `order.quantity > 1`, multiple boxes):
    - Sub-heading: `"Box {boxNumber}"`
    - Item list using smart format (Feature 3)
  - If `order.boxContents` only (old listing fallback): single combined list without box sub-headings
- **Pickup info card:** pickup window end (TimerBadge), status note
- **Actions:** "Scan QR" button → `/vendor/scan`, back link → `/vendor/orders`

**VendorOrdersPage change:** each order card becomes `<Link to="/vendor/orders/{o.id}">`.

---

## Files Affected

| File | Change |
|---|---|
| `src/types.ts` | Add `unit?` to `BoxItem`; add `BoxPlan`, `Discount` types; extend `Listing` and `Order` |
| `src/pages/vendor/VendorComposePage.tsx` | Replace packing guide with per-box preview + Re-randomize button |
| `src/pages/vendor/VendorOrdersPage.tsx` | Wrap order cards in `<Link>` |
| `src/pages/vendor/VendorOrderDetailPage.tsx` | **New file** — per-box breakdown using smart format |
| `src/pages/customer/ListingDetailPage.tsx` | Inline box selector next to category chip |
| `src/pages/customer/CheckoutSuccessPage.tsx` | Reveal card + reassignment banner |
| `src/pages/customer/OrderDetailPage.tsx` | Reveal card + reassignment banner |
| `src/App.tsx` | Add `/vendor/orders/:id` route |
| `src/services/listings.ts` | Accept `boxPlans` in `createListing` |
| `src/services/discounts.ts` | **New** — `getActiveDiscount`, `markDiscountUsed` |
| `src/utils/boxDistribution.ts` | **New** — pure distribution algorithm + `formatBoxItem` |
| `functions/src/createCheckoutSession.ts` | Accept `boxNumber`, store `requestedBoxNumber` |
| `functions/src/createVNPayOrder.ts` | Same |
| `functions/src/createLocalOrder.ts` | No box assignment (COD/bank transfer excluded) |
| `functions/src/stripeWebhook.ts` | Box assignment transaction |
| `functions/src/vnpayIPN.ts` | Box assignment transaction |
| `functions/src/scanQR.ts` | Trigger discount if `belowAverage` box after pickup |
| `src/locales/en/translation.json` | New keys: box selection, reveal, reassignment, discount notification |
| `src/locales/vi/translation.json` | Vietnamese equivalents |

---

## Out of Scope

- Per-box QR codes (one order = one QR regardless of quantity)
- Customer seeing other customers' boxes
- Manual vendor override of which specific box goes to which order
- Retroactive migration of existing listings to `boxPlans`
- Discount codes entered manually (auto-applied only)
