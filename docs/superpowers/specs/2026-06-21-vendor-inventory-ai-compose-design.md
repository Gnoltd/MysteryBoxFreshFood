# MysteryBox — Vendor Inventory & AI Compose Design

**Date:** 2026-06-21
**Status:** Approved
**Spec covers:** Vendor inventory catalog, AI-suggested box count, manual adjustment widget, expiry alerts, dynamic pricing via Groq

---

## 1. Overview

This spec extends the vendor side of MysteryBox with four interconnected features:

1. **Persistent inventory catalog** — vendors enter product details once; items are reused across daily compose sessions.
2. **AI-suggested box count** — `composeMysteryBox` now calculates `numBoxes` as an output from total inventory value ÷ discount factor, removing the manual input step.
3. **Manual adjustment widget** — after the AI suggestion, vendors use large ±  buttons to tune box count before publishing.
4. **Expiry alerts** — dashboard banner fires when catalog items have `bestBefore` within 48 hours, with a one-click shortcut to the compose page with those items pre-selected.
5. **Dynamic pricing** — new `suggestPrice` Cloud Function queries order history and uses Groq (`llama-3.3-70b-versatile`) to recommend a price multiplier; falls back to time-of-day heuristics for new vendors.

The existing AI Box Composer modal on `ListingsPage` is retired. The "AI Box Composer" button becomes a `<Link>` to the new full-page `/vendor/compose`.

---

## 2. Architecture

### New Routes

| Route | Page | Purpose |
|---|---|---|
| `/vendor/inventory` | `VendorInventoryPage` | Catalog CRUD — add / edit / delete products |
| `/vendor/compose` | `VendorComposePage` | Full-page AI box composer |

Both routes are added to `VendorLayout` sidebar nav.

### New Firestore Collection

```
inventory/{vendorId}/items/{itemId}
  name          string            required
  category      ListingCategory   one of the 10 existing categories
  unitPrice     number            VND, required
  unit          string            "piece" | "kg" | "box" | etc.
  defaultQty    number            pre-fills qty stepper in compose flow
  bestBefore    Timestamp | null  optional expiry date for current batch
  createdAt     Timestamp
```

Firestore security rules: `request.auth.uid == vendorId` for all reads and writes. No cross-vendor access.

### New / Updated Files

| File | Change |
|---|---|
| `src/services/inventory.ts` | New — CRUD + real-time subscription |
| `src/services/ai.ts` | Add `suggestPrice()` call |
| `src/pages/vendor/VendorInventoryPage.tsx` | New page |
| `src/pages/vendor/VendorComposePage.tsx` | New page (replaces modal) |
| `src/pages/vendor/VendorDashboardPage.tsx` | Add expiry alert banner |
| `src/pages/vendor/ListingsPage.tsx` | Replace modal + open button with `<Link>` |
| `functions/src/composeMysteryBox.ts` | `numBoxes` becomes output; migrate from Gemini to Groq |
| `functions/src/suggestPrice.ts` | New callable Cloud Function |
| `functions/src/index.ts` | Export `suggestPrice` |
| `functions/package.json` | Remove `@google/generative-ai`; Groq SDK already present |
| `src/locales/en/translation.json` | New i18n keys |
| `src/locales/vi/translation.json` | Vietnamese translations |
| `src/App.tsx` (or router file) | Add new routes |
| `firestore.rules` | Add inventory subcollection rules |

---

## 3. Inventory Catalog Page (`/vendor/inventory`)

### Layout

Single scrollable page. Header: **"My Inventory"** title + **"+ Add Item"** button.

**Item list** — each row:
```
[category icon]  Name · unit · unitPrice đ  [bestBefore badge]  [Edit] [Delete]
```

Sort order: expiring-soon items (bestBefore ≤ 48h) float to top, then alphabetical by name.

**bestBefore badges:**
- ≤ 48h → amber chip "Expires soon"
- ≤ 24h → red chip "Expires today"
- Past → grey chip "Expired"

### Add / Edit Form

Inline form (not a modal) that appears above the list on "+ Add Item", or replaces the row on "Edit".

| Field | Input | Constraint |
|---|---|---|
| Name | text input | required |
| Category | `<Select>` | 10-category set |
| Unit price (VND) | number input | required, min 1000 |
| Unit | text input | e.g. "piece", "kg" |
| Default qty | number input | min 1, default 1 |
| Best before | date input | optional |

Save writes to Firestore. Cancel dismisses. Delete shows confirm dialog before removing.

### Empty State

Centered message: "Your catalog is empty — add your first product to start composing mystery boxes faster." + prominent "+ Add Item" button.

### Service: `src/services/inventory.ts`

```ts
subscribeToInventory(vendorId: string, cb: (items: InventoryItem[]) => void): Unsubscribe
addInventoryItem(vendorId: string, item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<void>
updateInventoryItem(vendorId: string, itemId: string, patch: Partial<InventoryItem>): Promise<void>
deleteInventoryItem(vendorId: string, itemId: string): Promise<void>
```

No Firebase SDK imports in pages — all access through this service.

---

## 4. Compose Page (`/vendor/compose`)

### Three-Zone Layout

```
┌─────────────────────────────────────────────────────┐
│  ZONE 1 — Catalog Browser                           │
│  Checkbox cards for inventory items + qty steppers  │
├─────────────────────────────────────────────────────┤
│  ZONE 2 — Controls + AI Suggestion Widget           │
│  Discount slider · [Suggest Price] · [Compose]      │
│  ┌──────────────────────────────────────────────┐   │
│  │  🤖 AI suggests  [−]   5 boxes   [+]         │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ZONE 3 — Editable Result Panel                     │
│  Category · Title · Description · Price · Publish   │
└─────────────────────────────────────────────────────┘
```

### Zone 1 — Catalog Browser

Loads via `subscribeToInventory`. Each item is a card:
- Large checkbox (full card is clickable)
- Item name + category chip
- Quantity stepper (− / value / +), pre-filled from `item.defaultQty`, disabled when unchecked
- Unit price hint

Items with `bestBefore` ≤ 24h receive an amber glow border and float to top.

**Pre-selection via URL param:** On mount, reads `?preselect=itemId1,itemId2` and checks those items automatically. Used by the dashboard expiry alert shortcut.

**Empty catalog state:** "No items in your catalog yet" + "Go to Inventory →" link.

**Selection summary bar** (sticky, visible once ≥1 item checked):
```
3 items selected · Total value: 450.000 đ
```

### Zone 2 — Controls + AI Suggestion Widget

**Discount slider** — range 20–90%, step 5, default 40%. Live label: _"Discount: 40% — boxes sell at 60% of original value."_

**"Suggest Price" button** (secondary, indigo) — calls `suggestPrice({ vendorId, targetDiscount })`. Result displays as a dismissable hint below the slider:
> _"AI recommends 55% discount for this time slot based on your 4pm–6pm sell-through rate (82%)."_

The hint shows a recommended discount percentage, not a specific price (since the per-box price is unknown until after compose). Vendor can tap the hint to auto-apply the recommended discount to the slider, or ignore it entirely.

**"Compose with AI" button** (primary, purple) — disabled until ≥1 item checked. On click: calls `composeMysteryBox` with selected items + discount. Shows spinner. On success: renders the AI Suggestion Widget and Zone 3.

**AI Suggestion Widget** (appears after successful compose):
```
┌──────────────────────────────────────────────────────┐
│  🤖 AI suggests                                      │
│                                                      │
│          [ − ]    5 boxes    [ + ]                   │
│                                                      │
│   Each box: 45.000 đ original → 27.000 đ sale       │
│   Total inventory value: 225.000 đ                   │
└──────────────────────────────────────────────────────┘
```

- ± buttons: 48×48px minimum tap target, clamp numBoxes to [1, 20]
- `originalPrice` and `salePrice` recalculate live on each ± press:
  - `originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000`
  - `salePrice = Math.round(originalPrice * (1 − discount/100) / 1000) * 1000`
- `editPrice` in Zone 3 stays in sync with `salePrice` automatically

### Zone 3 — Editable Result Panel

Appears after a successful compose call.

| Field | Pre-filled from |
|---|---|
| Category | `composerResult.category` |
| Title | `titleVi` or `titleEn` based on current lang |
| Description | `descriptionVi` or `descriptionEn` |
| Price (VND) | `salePrice` (live-synced with ± widget) |
| Pickup start / end | Today 17:00 / 21:00 defaults |

**"Publish Listing"** button — disabled if `editTitle` empty or `editPrice ≤ 0`. On click: calls `createListing(...)` then navigates to `/vendor/listings` on success.

Publish payload:
```ts
// currentOriginalPrice = Math.round(totalValue / numBoxes / 1000) * 1000
// (recalculated from live numBoxes, not cached from composerResult)
{
  vendorId: currentUser.uid,
  type: 'mystery_box',
  title: editTitle,
  description: editDescription,
  category: editCategory,
  price: parseInt(editPrice),
  originalPrice: currentOriginalPrice,
  quantityTotal: numBoxes,
  quantityRemaining: numBoxes,
  imageUrl: '',
  pickupStart: Timestamp.fromDate(new Date(pickupStart)),
  pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
  status: 'active',
}
```

### Page-Level State

```ts
// Zone 1
selectedItems: Map<string, { item: InventoryItem; qty: number }>

// Zone 2
discount: number                        // default 40
suggestPriceResult: { recommendedDiscount: number; reason: string; dataPoints: number } | null
composerResult: ComposeResult | null    // returned from composeMysteryBox
numBoxes: number                        // starts from composerResult.numBoxes, user-adjustable
composerLoading: boolean
composerError: string

// Zone 3
editTitle: string
editDescription: string
editCategory: ListingCategory
editPrice: string                       // synced with live salePrice
pickupStart: string
pickupEnd: string
publishLoading: boolean
```

### Error Handling

| Situation | UI response |
|---|---|
| No items selected | "Compose" button disabled |
| composeMysteryBox fails | Inline red error below Compose button |
| suggestPrice fails / no data | Hint silently omitted; no error shown |
| Publish fails | Inline red error above Publish button |
| editPrice ≤ 0 | Publish disabled + red hint "Price must be > 0" |

---

## 5. Dashboard Expiry Alert Banner (`VendorDashboardPage`)

Dashboard subscribes to `subscribeToInventory` on mount. If any items have `bestBefore` within 48 hours:

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  2 items expiring soon — create a clearance box now     │
│    · Croissant (expires today)                             │
│    · Iced Matcha (expires tomorrow)                        │
│                          [ Compose Clearance Box → ]       │
└────────────────────────────────────────────────────────────┘
```

- Amber border for "expires tomorrow", red border for "expires today or overdue"
- **"Compose Clearance Box →"** navigates to `/vendor/compose?preselect=itemId1,itemId2`
- Dismissable per session via `sessionStorage` key `dismissed_expiry_alert_{date}`
- Banner renders above the existing stat cards

---

## 6. Cloud Functions

### Updated `composeMysteryBox`

**Input (changed):**
```ts
{
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number   // 20–90%
  storeName: string
  // numBoxes REMOVED
}
```

**Server-side logic:**
1. Validate: `items.length >= 1`, `targetDiscount` in [20, 90].
2. `totalValue = sum(item.unitPrice × item.quantity)`
3. `optimalPricePerBox = totalValue × (1 − targetDiscount / 100)`
4. `numBoxes = Math.max(1, Math.min(20, Math.round(totalValue / optimalPricePerBox)))`
   — effectively clamps to [1, 20]
5. `originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000`
6. `suggestedPrice = Math.round(originalPrice * (1 − targetDiscount / 100) / 1000) * 1000`
7. Call Groq `llama-3.3-70b-versatile` with JSON-mode prompt. On parse failure return `{ error: 'compose_failed' }` with HTTP 400.

**Output (changed):**
```ts
{
  numBoxes: number          // ← new
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}
```

**Provider migration:** Replace `@google/generative-ai` with Groq SDK (already installed). Remove `gemini.api_key` config dependency.

### New `suggestPrice` (callable)

**Input:**
```ts
{
  vendorId: string
  targetDiscount: number
}
```

**Logic:**
1. Query `orders` where `vendorId == input.vendorId AND status in ['paid','picked_up'] AND createdAt >= now - 30 days`. Limit 200 docs.
2. Group by hour-of-day (0–23). For each bucket: `sellThroughRate = completed / total`.
3. Get `currentHour = new Date().getHours()`.
4. If current bucket has ≥ 5 data points → call Groq with sell-through data + prompt asking for a `recommendedDiscount` (integer 20–90) and `reason` string.
5. **Heuristic fallback** (< 5 data points or Groq error):

   | Time window | Recommended discount |
   |---|---|
   | Before 15:00 | `targetDiscount` (no adjustment) |
   | 15:00–18:00 | `targetDiscount + 5` |
   | 18:00–20:00 | `targetDiscount + 15` |
   | After 20:00 | `targetDiscount + 25` |

   Clamped to [20, 90] in all cases.

6. Return `{ recommendedDiscount: number, reason: string, dataPoints: number }`.

Client displays the hint as a dismissable chip: _"AI recommends {recommendedDiscount}% discount — {reason}."_ Tapping the chip applies `recommendedDiscount` to the slider. The final price is computed after the vendor clicks Compose.

---

## 7. i18n Keys

Added inside `"vendor"` object (EN → VI):

```
"inventory":            "My Inventory"            → "Kho hàng"
"add_item":             "Add Item"                → "Thêm sản phẩm"  (existing)
"edit_item":            "Edit Item"               → "Chỉnh sửa"
"best_before":          "Best before"             → "Hạn sử dụng"
"expires_today":        "Expires today"           → "Hết hạn hôm nay"
"expires_soon":         "Expires soon"            → "Sắp hết hạn"
"expired":              "Expired"                 → "Đã hết hạn"
"expiry_alert":         "{{n}} items expiring soon — create a clearance box now"
                                                  → "{{n}} sản phẩm sắp hết hạn — tạo hộp thanh lý ngay"
"compose_clearance":    "Compose Clearance Box →" → "Tạo hộp thanh lý →"
"suggest_price":        "Suggest Price"           → "Gợi ý giá"
"price_suggestion":     "AI recommends {{discount}}% discount — {{reason}}"
                                                  → "AI gợi ý giảm {{discount}}% — {{reason}}"
"unit":                 "Unit"                    → "Đơn vị"
"default_qty":          "Default qty"             → "Số lượng mặc định"
"total_value":          "Total value"             → "Tổng giá trị"
"ai_box_count":         "AI suggests {{n}} boxes" → "AI gợi ý {{n}} hộp"
"no_inventory":         "No items in your catalog yet"
                                                  → "Chưa có sản phẩm trong kho"
"go_to_inventory":      "Go to Inventory →"       → "Đến Kho hàng →"
"compose_page_title":   "Compose Mystery Box"     → "Tạo hộp bí ẩn"
```

---

## 8. Out of Scope

- Image upload for inventory catalog items (vendor-level product images)
- Inventory item quantity tracking across multiple days (catalog items are templates, not stock ledgers)
- Multiple mystery box variants in a single compose session
- Customer-facing reveal of box contents after pickup
- Push / email notifications for expiry alerts (in-app banner only)
- Groq prompt tuning based on category or cuisine type
