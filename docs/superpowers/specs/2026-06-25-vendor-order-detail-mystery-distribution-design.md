# Vendor Order Detail + Value-Balanced Mystery Box Distribution

**Date:** 2026-06-25  
**Status:** Approved

---

## Overview

Two connected features:
1. **Vendor Order Detail Page** — when a vendor clicks an order, show a preparation list with total quantities computed (e.g. `"sữa 200ml"` × 2 boxes → `"sữa 400ml"`).
2. **Value-Balanced Random Distribution** — replace the current equal-split packing guide in VendorComposePage with an algorithm that creates N unique but equal-value box configurations.

---

## Feature 1: Value-Balanced Distribution Algorithm

### Problem with current approach
`VendorComposePage` currently splits items equally: `Math.floor(totalQty / numBoxes)` per box. Every box is identical — no mystery between customers.

### Algorithm

**Input:** selected inventory items with `{name, totalQty, unitPrice, unit}` and `numBoxes`.

**Step 1 — Target value**
```
totalValue = sum(item.unitPrice × item.totalQty)
targetPerBox = totalValue / numBoxes
```

**Step 2 — Sort expensive first**
Sort items by `unitPrice` descending so high-value items are spread before cheap filler.

**Step 3 — Greedy random fill**
For each unit of each item (one unit at a time, expensive items first):
- Pick randomly from the **bottom 40%** of boxes by current value (boxes furthest below target).
- Add the item unit to the chosen box and update its running value.

The bottom-40% window introduces randomness while still biasing toward balance.

**Step 4 — Balance pass**
After all items are distributed:
- If any box's value deviates >20% from target:
  - Find richest box and poorest box.
  - Swap one item between them to close the gap.
  - Repeat until all boxes are within ±15% of target or no improving swap exists.

**Step 5 — Edge cases**
- If `totalQty` for an item is not divisible cleanly: fractional units are rounded; leftover units go to boxes still below target.
- If `numBoxes > totalUnits` for a high-value item: some boxes simply won't contain that item (acceptable — just means more variety).

### VendorComposePage UI changes

- Replace current packing guide table ("per box: X bread, Y milk") with a **box preview carousel/list** showing each of the N box configurations with estimated value.
- Vendor can click "Re-randomize" to run the algorithm again with a different seed.
- Publish button only enabled after vendor reviews the preview.

### Data model change — Listing

```ts
// Add to Listing interface in types.ts
boxPlans?: BoxItem[][]  // one BoxItem[] per box slot; length === quantityTotal
```

`boxContents` (the single per-box template) is kept for backward compatibility with existing listings that pre-date this feature.

---

## Feature 2: Order Assignment

When an order is created (any payment path: Stripe, VNPAY, COD, bank transfer), the Cloud Function that finalises the order must atomically assign box plans.

### Firestore transaction in each order-creation function

```
transaction:
  read Listing.boxPlans
  if boxPlans exists and length >= order.quantity:
    assigned = boxPlans.splice(0, order.quantity)
    write Listing.boxPlans = remaining plans
    merge assigned plans into a single BoxItem[] for the order:
      for each unique item name across all assigned plans, sum qty values
    write Order.boxContents = merged BoxItem[]
  else:
    // Listing has no plans (old listing) or ran out
    // Fall back to Listing.boxContents (the shared template) × order.quantity
    write Order.boxContents = Listing.boxContents ?? []
```

**Why merge assigned plans into one `BoxItem[]`?**
An order for quantity=2 means the vendor prepares both boxes. Showing one combined list ("prepare 4 bánh mì total") is more useful than two separate lists.

### Affected functions
- `createCheckoutSession.ts` — Stripe
- `stripeWebhook.ts` — sets order paid, already reads from order doc (no change needed here)
- `createVNPayOrder.ts` — VNPAY
- `vnpayIPN.ts` — sets order paid (no change needed here)
- `createLocalOrder.ts` — COD / bank transfer

All three order-creation functions get the same assignment transaction added.

---

## Feature 3: Vendor Order Detail Page

### New route
`/vendor/orders/:id` — added to `App.tsx` inside the vendor route group.

### New file
`src/pages/vendor/VendorOrderDetailPage.tsx`

### Layout

**Order header card**
- Listing title
- Date created (formatted Vietnamese locale)
- Status chip (reuse existing STATUS_BADGE/STATUS_LABEL from VendorOrdersPage)
- Payment method badge
- Quantity ordered · Total price

**"What to prepare" card** (main feature)
- Heading: "Cần chuẩn bị" / "What to prepare"
- For each item in `Order.boxContents`, compute and display total:

```ts
function formatPrepItem(item: BoxItem, orderQty: number): string {
  const totalCount = item.qty * orderQty

  // Detect embedded measurement: number + unit in item name
  // e.g. "sữa 200ml", "nước ép 500ml", "thịt 250g"
  const measureRe = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|mg|oz)/i
  const match = item.name.match(measureRe)

  if (match) {
    const amount = parseFloat(match[1].replace(',', '.'))
    const unit = match[2]
    const total = amount * totalCount
    // Replace the matched measurement in name with the computed total
    return item.name.replace(match[0], `${total}${unit}`)
  }

  if (totalCount === 1) return item.name
  return `${totalCount}× ${item.name}`
}
```

Examples:
- `{name: "sữa 200ml", qty: 1}` + orderQty 2 → `"sữa 400ml"`
- `{name: "bánh mì", qty: 2}` + orderQty 2 → `"4× bánh mì"`
- `{name: "sữa 200ml", qty: 2}` + orderQty 3 → `"sữa 1200ml"`

**Pickup info card**
- Pickup window end (`TimerBadge`)
- Order status note: if `status === 'paid'` → "Customer has QR ready for pickup"

**Action**
- "Scan QR" button → navigate to `/vendor/scan`
- Back link → `/vendor/orders`

### VendorOrdersPage change
Each order card becomes a `<Link to={/vendor/orders/${o.id}}>` wrapper (currently plain `<div>`).

---

## Types changes

```ts
// types.ts

// Extend Listing
boxPlans?: BoxItem[][]

// BoxItem — no change needed (name + qty is sufficient)
```

---

## Files affected

| File | Change |
|---|---|
| `src/types.ts` | Add `boxPlans?: BoxItem[][]` to `Listing` |
| `src/pages/vendor/VendorComposePage.tsx` | Replace packing guide with distribution algorithm + box preview |
| `src/pages/vendor/VendorOrdersPage.tsx` | Wrap order cards in `<Link>` |
| `src/pages/vendor/VendorOrderDetailPage.tsx` | **New file** |
| `src/App.tsx` | Add `/vendor/orders/:id` route |
| `functions/src/createCheckoutSession.ts` | Add box plan assignment transaction |
| `functions/src/createVNPayOrder.ts` | Add box plan assignment transaction |
| `functions/src/createLocalOrder.ts` | Add box plan assignment transaction |
| `src/locales/en/translation.json` | New keys: `vendor.prepareTitle`, `vendor.qrReady`, `vendor.scanQR` |
| `src/locales/vi/translation.json` | Vietnamese equivalents |

---

## Out of scope

- Per-box QR codes (one order = one QR regardless of quantity)
- Customer-facing view of their specific box contents (stays hidden — mystery)
- Retroactive migration of existing listings to `boxPlans`
