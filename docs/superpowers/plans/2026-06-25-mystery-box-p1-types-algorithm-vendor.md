# Mystery Box Selection & Distribution — Plan 1: Types + Algorithm + Vendor Side

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the BoxPlan data model, value-balanced distribution algorithm, per-box vendor compose preview, vendor order detail page, and supporting services.

**Architecture:** Pure distribution logic lives in `src/utils/boxDistribution.ts` (no Firebase, fully unit-testable). VendorComposePage replaces its flat packing guide with per-box preview cards driven by this algorithm. A new VendorOrderDetailPage shows the vendor what to pack per box. All Firebase access goes through services, never directly from components.

**Tech Stack:** React + TypeScript + Vite, Firebase Firestore, react-i18next, Tailwind CSS + shadcn/ui, Vitest

## Global Constraints

- No Firebase imports directly in components — use services only
- All user-visible strings use `t('key')` from react-i18next — no hardcoded text
- Currency displayed as VND: `n.toLocaleString('vi-VN') + ' đ'`
- Dark theme: `bg-surface-container`, `text-on-surface`, `border-outline-variant`, accent `text-primary`
- Run `npm run test` in project root (Vitest) — TypeScript must compile cleanly

---

### Task 1: Types — BoxItem unit, BoxPlan, Discount, extend Listing + Order

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `BoxItem`, `BoxPlan`, `Discount`, updated `Listing`, updated `Order` — all used by every subsequent task

- [ ] **Step 1: Add `unit` to BoxItem, add BoxPlan and Discount types**

Open `src/types.ts`. Replace the existing `BoxItem` interface and add the two new types immediately after it:

```ts
export interface BoxItem {
  name: string
  qty: number
  unit?: string   // e.g. "bottle", "loaf", "piece", "bag"
}

export interface BoxPlan {
  boxNumber: number          // 1, 2, 3 …
  items: BoxItem[]
  value: number              // estimated value in VND
  belowAverage: boolean      // true when value < 85% of listing average
  takenByOrderId?: string    // set atomically at payment
}

// Firestore: discounts/{customerId}/codes/{id}
export interface Discount {
  id: string
  customerId: string
  percent: number            // 10
  reason: 'low_value_box'
  used: boolean
  expiresAt: import('firebase/firestore').Timestamp
  createdAt: import('firebase/firestore').Timestamp
}
```

- [ ] **Step 2: Extend Listing with boxPlans**

In `src/types.ts`, inside the `Listing` interface, add after the existing `boxContents` line:

```ts
  boxPlans?: BoxPlan[]       // one plan per box slot; new listings use this
```

- [ ] **Step 3: Extend Order with box fields**

In `src/types.ts`, inside the `Order` interface, add after the existing `boxContents` line:

```ts
  boxNumber?: number
  boxReassigned?: boolean
  originalBoxNumber?: number
  requestedBoxNumber?: number
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build -- --noEmit
```

Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat: add BoxPlan, Discount types; extend BoxItem with unit, Listing+Order with box fields"
```

---

### Task 2: Distribution Algorithm + formatBoxItem utility

**Files:**
- Create: `src/utils/boxDistribution.ts`
- Create: `src/utils/boxDistribution.test.ts`

**Interfaces:**
- Consumes: `BoxItem`, `BoxPlan` from `src/types.ts`
- Produces:
  - `distributeBoxes(items: DistributionItem[], numBoxes: number): Omit<BoxPlan, 'takenByOrderId'>[]`
  - `formatBoxItem(item: BoxItem): string`

- [ ] **Step 1: Write failing tests first**

Create `src/utils/boxDistribution.test.ts`:

```ts
import { describe, test, expect } from 'vitest'
import { distributeBoxes, formatBoxItem } from './boxDistribution'
import type { DistributionItem } from './boxDistribution'

const bread: DistributionItem = { id: '1', name: 'bánh mì', unitPrice: 10000, qty: 6, unit: 'loaf' }
const milk: DistributionItem  = { id: '2', name: 'sữa tươi 300ml', unitPrice: 8000, qty: 6, unit: 'bottle' }
const juice: DistributionItem = { id: '3', name: 'nước ép 500ml', unitPrice: 15000, qty: 3, unit: 'can' }

describe('distributeBoxes', () => {
  test('produces exactly numBoxes plans', () => {
    expect(distributeBoxes([bread], 3)).toHaveLength(3)
  })

  test('box numbers are 1-based sequential', () => {
    const plans = distributeBoxes([bread], 3)
    expect(plans.map(p => p.boxNumber)).toEqual([1, 2, 3])
  })

  test('total qty for each item matches input', () => {
    const plans = distributeBoxes([bread, milk], 3)
    const totalBread = plans.reduce((s, p) => s + (p.items.find(i => i.name === 'bánh mì')?.qty ?? 0), 0)
    const totalMilk  = plans.reduce((s, p) => s + (p.items.find(i => i.name === 'sữa tươi 300ml')?.qty ?? 0), 0)
    expect(totalBread).toBe(6)
    expect(totalMilk).toBe(6)
  })

  test('each BoxItem carries the unit from input', () => {
    const plans = distributeBoxes([milk], 2)
    const milkItems = plans.flatMap(p => p.items.filter(i => i.name === 'sữa tươi 300ml'))
    milkItems.forEach(i => expect(i.unit).toBe('bottle'))
  })

  test('belowAverage is boolean on every plan', () => {
    const plans = distributeBoxes([bread, milk, juice], 3)
    plans.forEach(p => expect(typeof p.belowAverage).toBe('boolean'))
  })

  test('box values sum to total input value', () => {
    const plans = distributeBoxes([bread, milk], 3)
    const totalVal = bread.unitPrice * bread.qty + milk.unitPrice * milk.qty
    const boxSum   = plans.reduce((s, p) => s + p.value, 0)
    expect(boxSum).toBe(totalVal)
  })

  test('handles numBoxes=1 (single box gets everything)', () => {
    const plans = distributeBoxes([bread], 1)
    expect(plans).toHaveLength(1)
    expect(plans[0].items[0].qty).toBe(6)
  })
})

describe('formatBoxItem', () => {
  test('ml measurement: shows total volume and count', () => {
    expect(formatBoxItem({ name: 'sữa tươi 300ml', qty: 2, unit: 'bottle' }))
      .toBe('600ml sữa tươi (×2 bottles)')
  })

  test('ml measurement qty=1: shows single volume and count', () => {
    expect(formatBoxItem({ name: 'nước ép 500ml', qty: 1, unit: 'can' }))
      .toBe('500ml nước ép (×1 can)')
  })

  test('g measurement: shows total weight and count', () => {
    expect(formatBoxItem({ name: 'thịt 250g', qty: 2, unit: 'pack' }))
      .toBe('500g thịt (×2 packs)')
  })

  test('no measurement: shows count × name', () => {
    expect(formatBoxItem({ name: 'bánh mì', qty: 3, unit: 'loaf' }))
      .toBe('×3 bánh mì')
  })

  test('no unit field: shows count × name', () => {
    expect(formatBoxItem({ name: 'bánh mì', qty: 2 }))
      .toBe('×2 bánh mì')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm run test -- boxDistribution
```

Expected: `Cannot find module './boxDistribution'`

- [ ] **Step 3: Implement boxDistribution.ts**

Create `src/utils/boxDistribution.ts`:

```ts
import type { BoxItem, BoxPlan } from '../types'

export interface DistributionItem {
  id: string
  name: string
  unitPrice: number
  qty: number       // total units across all boxes
  unit: string
}

export function distributeBoxes(
  items: DistributionItem[],
  numBoxes: number,
): Omit<BoxPlan, 'takenByOrderId'>[] {
  if (numBoxes < 1 || items.length === 0) return []

  const totalValue = items.reduce((s, it) => s + it.unitPrice * it.qty, 0)
  const targetPerBox = totalValue / numBoxes

  // Sort expensive items first so they spread before cheap filler
  const sorted = [...items].sort((a, b) => b.unitPrice - a.unitPrice)

  const boxes: Array<{ value: number; items: BoxItem[] }> = Array.from(
    { length: numBoxes },
    () => ({ value: 0, items: [] }),
  )

  // Greedy random fill — one unit at a time
  for (const item of sorted) {
    for (let i = 0; i < item.qty; i++) {
      // Pick from the bottom 40% of boxes by current value
      const indexed = boxes
        .map((b, idx) => ({ idx, value: b.value }))
        .sort((a, b) => a.value - b.value)
      const poolSize = Math.max(1, Math.ceil(numBoxes * 0.4))
      const pool = indexed.slice(0, poolSize)
      const chosen = pool[Math.floor(Math.random() * pool.length)]

      const box = boxes[chosen.idx]
      const existing = box.items.find(bi => bi.name === item.name)
      if (existing) {
        existing.qty++
      } else {
        box.items.push({ name: item.name, qty: 1, unit: item.unit })
      }
      box.value += item.unitPrice
    }
  }

  // Balance pass — swap one unit between richest and poorest if it reduces total deviation
  let improved = true
  let passes = 0
  while (improved && passes < 30) {
    improved = false
    passes++

    const maxDev = boxes.reduce((mx, b) => Math.max(mx, Math.abs(b.value - targetPerBox)), 0)
    if (maxDev / targetPerBox <= 0.2) break

    const byValue = [...boxes.keys()].sort((a, b) => boxes[b].value - boxes[a].value)
    const richIdx = byValue[0]
    const poorIdx = byValue[byValue.length - 1]

    let bestReduction = 0
    let bestItemName = ''

    for (const bItem of boxes[richIdx].items) {
      const src = items.find(it => it.name === bItem.name)
      if (!src) continue
      const v = src.unitPrice
      const oldDev = Math.abs(boxes[richIdx].value - targetPerBox) + Math.abs(boxes[poorIdx].value - targetPerBox)
      const newDev = Math.abs(boxes[richIdx].value - v - targetPerBox) + Math.abs(boxes[poorIdx].value + v - targetPerBox)
      const reduction = oldDev - newDev
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestItemName = bItem.name
      }
    }

    if (bestItemName && bestReduction > 0) {
      const src = items.find(it => it.name === bestItemName)!
      const v = src.unitPrice

      // Remove one unit from richest
      const richItem = boxes[richIdx].items.find(bi => bi.name === bestItemName)!
      if (richItem.qty > 1) richItem.qty--
      else boxes[richIdx].items = boxes[richIdx].items.filter(bi => bi.name !== bestItemName)
      boxes[richIdx].value -= v

      // Add one unit to poorest
      const poorItem = boxes[poorIdx].items.find(bi => bi.name === bestItemName)
      if (poorItem) poorItem.qty++
      else boxes[poorIdx].items.push({ name: bestItemName, qty: 1, unit: src.unit })
      boxes[poorIdx].value += v

      improved = true
    }
  }

  const average = totalValue / numBoxes
  return boxes.map((box, i) => ({
    boxNumber: i + 1,
    items: box.items,
    value: Math.round(box.value),
    belowAverage: box.value < average * 0.85,
  }))
}

const MEASURE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|mg|oz)/i

export function formatBoxItem(item: BoxItem): string {
  if (!item.unit) return `×${item.qty} ${item.name}`
  const match = item.name.match(MEASURE_RE)
  if (match) {
    const amount = parseFloat(match[1].replace(',', '.'))
    const unitOfMeasure = match[2]
    const total = Math.round(amount * item.qty * 10) / 10
    const cleanName = item.name.replace(match[0], '').trim()
    return `${total}${unitOfMeasure} ${cleanName} (×${item.qty} ${item.unit})`
  }
  return `×${item.qty} ${item.name}`
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm run test -- boxDistribution
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/boxDistribution.ts src/utils/boxDistribution.test.ts
git commit -m "feat: add distributeBoxes algorithm and formatBoxItem utility with tests"
```

---

### Task 3: Services — discounts client service

**Files:**
- Create: `src/services/discounts.ts`

**Interfaces:**
- Consumes: `Discount` from `src/types.ts`, Firestore SDK from `../firebase`
- Produces:
  - `getActiveDiscount(customerId: string): Promise<Discount | null>`
  - `markDiscountUsed(customerId: string, discountId: string): Promise<void>`

- [ ] **Step 1: Create src/services/discounts.ts**

```ts
import {
  collection, query, where, orderBy, limit,
  getDocs, updateDoc, doc, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Discount } from '../types'

export async function getActiveDiscount(customerId: string): Promise<Discount | null> {
  const q = query(
    collection(db, 'discounts', customerId, 'codes'),
    where('used', '==', false),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'asc'),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Discount
}

export async function markDiscountUsed(customerId: string, discountId: string): Promise<void> {
  await updateDoc(doc(db, 'discounts', customerId, 'codes', discountId), { used: true })
}
```

- [ ] **Step 2: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/discounts.ts
git commit -m "feat: add discounts client service (getActiveDiscount, markDiscountUsed)"
```

---

### Task 4: VendorComposePage — replace packing guide with per-box preview

**Files:**
- Modify: `src/pages/vendor/VendorComposePage.tsx`

**Interfaces:**
- Consumes: `distributeBoxes`, `formatBoxItem` from `src/utils/boxDistribution`
- Consumes: `BoxPlan` from `src/types`
- Produces: passes `boxPlans` to `createListing` on publish

- [ ] **Step 1: Add imports and boxPlans state**

At the top of `VendorComposePage.tsx`, add to the existing import block:

```ts
import { distributeBoxes, formatBoxItem } from '../../utils/boxDistribution'
import type { BoxPlan } from '../../types'
import { RefreshCw, AlertTriangle as BoxWarn } from 'lucide-react'
```

Inside the component, add state after the existing `composerResult` state:

```ts
const [boxPlans, setBoxPlans] = useState<Omit<BoxPlan, 'takenByOrderId'>[]>([])
```

- [ ] **Step 2: Add generateBoxPlans function**

Add this function inside the component, after `handleCompose`:

```ts
const generateBoxPlans = () => {
  if (selectedItems.size === 0 || numBoxes < 1) return
  const items = Array.from(selectedItems.values()).map(({ item, qty }) => ({
    id: item.id,
    name: item.name,
    unitPrice: item.unitPrice,
    qty,
    unit: item.unit,
  }))
  setBoxPlans(distributeBoxes(items, numBoxes))
}
```

- [ ] **Step 3: Auto-generate when numBoxes or selectedItems change (after composerResult set)**

Add a useEffect after the existing price sync effect:

```ts
useEffect(() => {
  if (!composerResult || selectedItems.size === 0) return
  generateBoxPlans()
}, [numBoxes, composerResult])
```

- [ ] **Step 4: Replace packing guide section with per-box preview**

Find the existing packing guide block in the JSX (the `<div className="border-t border-outline-variant pt-4">` block containing `{t('vendor.packing_guide')}`) and replace it entirely with:

```tsx
{/* Per-box preview */}
{boxPlans.length > 0 && (
  <div className="border-t border-outline-variant pt-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
        <Package size={12} /> {t('vendor.box_preview')}
      </h4>
      <button
        onClick={generateBoxPlans}
        className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
      >
        <RefreshCw size={11} /> {t('vendor.rerandomize')}
      </button>
    </div>
    <div className="space-y-2">
      {boxPlans.map(plan => (
        <div
          key={plan.boxNumber}
          className={`p-3 rounded-xl border ${plan.belowAverage ? 'border-amber-500/40 bg-amber-950/20' : 'border-outline-variant bg-surface-container-high'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-on-surface font-semibold text-body-sm">
              {t('vendor.box_number', { n: plan.boxNumber })}
            </span>
            <span className="text-outline text-xs">~{plan.value.toLocaleString('vi-VN')} đ</span>
          </div>
          {plan.belowAverage && (
            <p className="text-amber-400 text-xs mb-2 flex items-center gap-1">
              <BoxWarn size={11} /> {t('vendor.box_below_average')}
            </p>
          )}
          <ul className="space-y-1">
            {plan.items.map(item => (
              <li key={item.name} className="text-on-surface-variant text-xs">
                {formatBoxItem(item)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 5: Pass boxPlans to createListing in handlePublish**

In `handlePublish`, replace the `boxContents` construction and the `createListing` call with:

```ts
const validPlans = boxPlans.length > 0 ? boxPlans : undefined

await createListing({
  vendorId: currentUser.uid, type: 'mystery_box',
  title: editTitle, description: editDescription, category: editCategory,
  price, originalPrice: currentOriginalPrice,
  quantityTotal: numBoxes, quantityRemaining: numBoxes,
  imageUrl: '',
  pickupStart: Timestamp.fromDate(new Date(pickupStart)),
  pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
  status: 'active',
  boxContents: validPlans
    ? validPlans[0]?.items ?? []
    : packingGuide.filter(p => p.perBox > 0).map(p => ({ name: p.name, qty: p.perBox })),
  ...(validPlans ? { boxPlans: validPlans } : {}),
})
```

- [ ] **Step 6: Update publish button disabled condition**

Change the publish button's `disabled` prop to also require boxPlans when composerResult is set:

```tsx
disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0 || (!!composerResult && boxPlans.length === 0)}
```

- [ ] **Step 7: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/vendor/VendorComposePage.tsx
git commit -m "feat: replace packing guide with per-box preview in VendorComposePage"
```

---

### Task 5: VendorOrdersPage links + VendorOrderDetailPage + App route

**Files:**
- Modify: `src/pages/vendor/VendorOrdersPage.tsx`
- Create: `src/pages/vendor/VendorOrderDetailPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `formatBoxItem` from `src/utils/boxDistribution`
- Consumes: `subscribeToOrder` from `src/services/orders` (already exists)
- Consumes: `TimerBadge` from `src/components/shared/TimerBadge`

- [ ] **Step 1: Wrap order cards in VendorOrdersPage with Link**

In `src/pages/vendor/VendorOrdersPage.tsx`, add `Link` to existing imports:

```ts
import { Link } from 'react-router-dom'
```

Replace `<div key={o.id} className="bg-surface-container ...">` with:

```tsx
<Link
  key={o.id}
  to={`/vendor/orders/${o.id}`}
  className="block bg-surface-container border border-outline-variant rounded-xl p-4 hover:border-outline transition-colors"
>
```

And close with `</Link>` instead of `</div>`.

Also update the existing inline box contents display to use `formatBoxItem`:

```tsx
import { formatBoxItem } from '../../utils/boxDistribution'
// ...
{o.boxContents && o.boxContents.length > 0 && (
  <p className="text-outline text-xs mt-1">
    <img src="/images/icons/single-item.png" alt="" className="w-3 h-3 object-contain inline mr-1" />
    {t('vendor.each_box')}: {o.boxContents.map(b => formatBoxItem(b)).join(', ')}
  </p>
)}
```

- [ ] **Step 2: Create VendorOrderDetailPage**

Create `src/pages/vendor/VendorOrderDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToOrder } from '../../services/orders'
import { TimerBadge } from '../../components/shared/TimerBadge'
import { formatBoxItem } from '../../utils/boxDistribution'
import { ArrowLeft, Package, QrCode } from 'lucide-react'
import type { Order, OrderStatus } from '../../types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-surface-container text-on-surface-variant',
  cancelled: 'bg-red-900 text-red-300',
  pending_cod: 'bg-orange-900 text-orange-300',
  pending_bank_transfer: 'bg-blue-900 text-blue-300',
  pending_vnpay: 'bg-purple-900 text-purple-300',
  refunded: 'bg-surface-container text-on-surface-variant',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'PENDING', paid: 'PAID', picked_up: 'PICKED UP',
  cancelled: 'CANCELLED', pending_cod: 'COD',
  pending_bank_transfer: 'BANK', pending_vnpay: 'VNPAY', refunded: 'REFUNDED',
}

export default function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    return subscribeToOrder(id, o => {
      // Guard: only the vendor for this order can view it
      if (o && o.vendorId !== currentUser?.uid) {
        navigate('/vendor/orders')
        return
      }
      setOrder(o)
      setLoading(false)
    })
  }, [id, currentUser])

  if (loading) return <p className="text-on-surface-variant">{t('browse.loading')}</p>
  if (!order) return <p className="text-on-surface-variant">{t('vendor.orderNotFound')}</p>

  const createdAt = new Date(order.createdAt.seconds * 1000).toLocaleString('vi-VN')

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-8">
      {/* Back link */}
      <Link
        to="/vendor/orders"
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
      >
        <ArrowLeft size={16} /> {t('vendor.orders')}
      </Link>

      {/* Order header */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-on-surface font-bold text-lg">{order.listingTitle}</h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="text-on-surface-variant text-sm">{createdAt}</p>
        <div className="flex gap-3 mt-3 text-sm text-on-surface-variant">
          <span>{order.quantity} {t('vendor.box_unit')}</span>
          <span>·</span>
          <span>{order.totalPrice.toLocaleString('vi-VN')} đ</span>
          {order.paymentMethod && (
            <>
              <span>·</span>
              <span className="uppercase text-outline">{order.paymentMethod.replace('_', ' ')}</span>
            </>
          )}
          {order.boxNumber != null && (
            <>
              <span>·</span>
              <span className="text-primary font-medium">{t('vendor.box_number', { n: order.boxNumber })}</span>
            </>
          )}
        </div>
      </div>

      {/* What to prepare */}
      {order.boxContents && order.boxContents.length > 0 && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-1">
            <Package size={13} /> {t('vendor.prepareTitle')}
          </h2>

          {order.boxNumber != null ? (
            // Per-box view (new listings with boxPlans)
            <div>
              <p className="text-on-surface font-semibold mb-3">
                {t('vendor.box_number', { n: order.boxNumber })}
              </p>
              <ul className="space-y-2">
                {order.boxContents.map(item => (
                  <li
                    key={item.name}
                    className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5"
                  >
                    <span className="text-on-surface text-sm">{formatBoxItem(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Fallback: combined list (old listings without boxPlans)
            <ul className="space-y-2">
              {order.boxContents.map(item => (
                <li
                  key={item.name}
                  className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5"
                >
                  <span className="text-on-surface text-sm">{formatBoxItem(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pickup info */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
        <div className="flex items-center justify-between">
          {order.pickupEnd
            ? <TimerBadge pickupEnd={order.pickupEnd} />
            : <span className="text-on-surface-variant text-sm">—</span>}
          {order.status === 'paid' && (
            <span className="text-green-400 text-sm">{t('vendor.qrReady')}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <Link
        to="/vendor/scan"
        className="gradient-bg text-white w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <QrCode size={16} /> {t('vendor.scanQR')}
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Add route to App.tsx**

In `src/App.tsx`, add the import:

```ts
import VendorOrderDetailPage from './pages/vendor/VendorOrderDetailPage'
```

Inside the vendor route group, after `<Route path="/vendor/orders" element={<VendorOrdersPage />} />`, add:

```tsx
<Route path="/vendor/orders/:id" element={<VendorOrderDetailPage />} />
```

- [ ] **Step 4: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/vendor/VendorOrdersPage.tsx src/pages/vendor/VendorOrderDetailPage.tsx src/App.tsx
git commit -m "feat: vendor order detail page with per-box breakdown; wrap order cards in Link"
```

---

### Task 6: i18n — vendor-side new keys

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

- [ ] **Step 1: Add English keys**

In `src/locales/en/translation.json`, inside the `"vendor"` object, add:

```json
"box_preview": "Box Preview",
"rerandomize": "Re-randomize",
"box_number": "Box {{n}}",
"box_unit": "box",
"box_below_average": "Below average value — customer gets 10% off next order",
"prepareTitle": "What to prepare",
"qrReady": "Customer has QR ready for pickup",
"scanQR": "Scan QR",
"orderNotFound": "Order not found"
```

- [ ] **Step 2: Add Vietnamese keys**

In `src/locales/vi/translation.json`, inside the `"vendor"` object, add:

```json
"box_preview": "Xem trước hộp",
"rerandomize": "Tạo lại ngẫu nhiên",
"box_number": "Hộp {{n}}",
"box_unit": "hộp",
"box_below_average": "Giá trị thấp hơn trung bình — khách sẽ được giảm 10% đơn sau",
"prepareTitle": "Cần chuẩn bị",
"qrReady": "Khách đã có QR để nhận hàng",
"scanQR": "Quét QR",
"orderNotFound": "Không tìm thấy đơn hàng"
```

- [ ] **Step 3: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: i18n keys for box preview, vendor order detail, and per-box labels"
```

---

## Self-Review

**Spec coverage check:**
- ✅ BoxItem.unit, BoxPlan, Discount types — Task 1
- ✅ Distribution algorithm with greedy fill + balance pass — Task 2
- ✅ belowAverage flag (< 85% of average) — Task 2
- ✅ formatBoxItem: `600ml sữa tươi (×2 bottles)` format — Task 2
- ✅ VendorComposePage per-box preview replacing packing guide — Task 4
- ✅ Re-randomize button — Task 4
- ✅ Publish disabled until preview generated — Task 4
- ✅ boxPlans stored on listing at publish — Task 4
- ✅ VendorOrdersPage cards → Link — Task 5
- ✅ VendorOrderDetailPage with per-box breakdown — Task 5
- ✅ Fallback for old listings (no boxPlans) — Task 5
- ✅ i18n for all new vendor strings — Task 6

**Out of scope for Plan 1 (handled in Plan 2):**
- Customer box selector on ListingDetailPage
- Reveal card on success/order detail
- Cloud Functions box assignment transaction
- Post-pickup discount trigger
