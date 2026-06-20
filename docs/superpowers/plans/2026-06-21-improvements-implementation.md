# MysteryBox Market Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three Vietnamese-market improvements — Share QR proxy pickup (E1), one-touch vendor listing creation (E2), and food safety countdown with Stripe auto-refund (E3).

**Architecture:** E1 is a UI addition to OrderDetailPage using the Web Share API. E2 adds a Quick Create modal to ListingsPage backed by a new `suggestQuantity` utility. E3 spans frontend (countdown hook + badges), two Cloud Function patches, and one new scheduled Cloud Function that calls `stripe.refunds.create`.

**Tech Stack:** React 19 + Vite + TypeScript, Firebase Firestore + Cloud Functions v1, Stripe Node SDK, qrcode.react v4, Vitest + Testing Library

## Global Constraints

- All user-visible strings use `t('key')` from react-i18next — no hardcoded text in components (exception: ListingCard already has hardcoded strings; follow its existing pattern there)
- Currency displayed as `{n.toLocaleString('vi-VN')} đ`
- UI theme: `bg-slate-900` cards, `indigo-500`/`purple-500` accents, dark backgrounds
- Orders are never status-updated by the client — only Cloud Functions write `orders/{id}.status`
- Stripe config key is `functions.config().stripe.secret_key` (matches existing functions)
- Test runner: `npm test` (vitest)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Add `packedAt?` to Listing; add `stripePaymentIntentId?`, `pickupEnd?` to Order; add `'refunded'` to OrderStatus |
| `src/locales/en/translation.json` | Modify | New i18n keys for E1, E2, E3 |
| `src/locales/vi/translation.json` | Modify | Vietnamese translations for same keys |
| `src/utils/quickCreate.ts` | Create | `suggestQuantity(orders, volume)` — E2 estimation logic |
| `src/utils/quickCreate.test.ts` | Create | Unit tests for suggestQuantity |
| `src/hooks/useCountdown.ts` | Create | `useCountdown(pickupEnd)` hook — E3 live timer |
| `src/hooks/useCountdown.test.ts` | Create | Unit tests for useCountdown |
| `src/services/orders.ts` | Modify | Add `getVendorOrders(vendorId)` one-shot fetch for E2 |
| `src/pages/customer/OrderDetailPage.tsx` | Modify | E1: Share QR button + E3: refunded status card |
| `src/pages/vendor/ListingsPage.tsx` | Modify | E2: Quick Create button + modal |
| `src/pages/vendor/ListingFormPage.tsx` | Modify | E3: optional `packedAt` datetime field |
| `src/components/shared/ListingCard.tsx` | Modify | E3: countdown badge |
| `src/pages/customer/ListingDetailPage.tsx` | Modify | E3: packedAt label + countdown badge |
| `functions/src/createCheckoutSession.ts` | Modify | E3: write `pickupEnd` onto order |
| `functions/src/stripeWebhook.ts` | Modify | E3: write `stripePaymentIntentId` onto order |
| `functions/src/autoRefundExpiredOrders.ts` | Create | E3: scheduled refund function |
| `functions/src/index.ts` | Modify | E3: export new function |
| `firestore.indexes.json` | Modify | E3: add `orders(status, pickupEnd)` composite index |

---

## Task 1: Type updates + i18n keys

**Files:**
- Modify: `src/types.ts`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

**Interfaces:**
- Produces: `OrderStatus` with `'refunded'`, `Listing.packedAt?: Timestamp`, `Order.stripePaymentIntentId?: string`, `Order.pickupEnd?: Timestamp` — all later tasks depend on these

- [ ] **Step 1: Update `src/types.ts`**

Replace the file with:

```ts
import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  role: 'vendor' | 'customer'
  displayName: string
  email: string
  lang: 'en' | 'vi'
  storeName?: string
  address?: string
  storeDescription?: string
  bankName?: string
  bankBin?: string
  bankAccount?: string
  bankAccountName?: string
}

export type ListingCategory = 'bakery' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
export type ListingStatus = 'active' | 'sold_out' | 'expired'
export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'cancelled' | 'pending_cod' | 'pending_bank_transfer' | 'refunded'
export type PaymentMethod = 'stripe' | 'cod' | 'bank_transfer'

export interface Listing {
  id: string
  vendorId: string
  type: 'mystery_box' | 'item'
  title: string
  description: string
  price: number
  originalPrice: number
  quantityTotal: number
  quantityRemaining: number
  pickupStart: Timestamp
  pickupEnd: Timestamp
  category: ListingCategory
  imageUrl: string
  status: ListingStatus
  createdAt: Timestamp
  packedAt?: Timestamp
}

export interface Order {
  id: string
  customerId: string
  vendorId: string
  listingId: string
  listingTitle: string
  quantity: number
  totalPrice: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  qrCode: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  pickupEnd?: Timestamp
  createdAt: Timestamp
}

export interface Review {
  id: string
  orderId: string
  listingId: string
  vendorId: string
  customerId: string
  rating: number
  comment: string
  createdAt: Timestamp
}
```

- [ ] **Step 2: Add E1 + E2 + E3 keys to `src/locales/en/translation.json`**

Inside the `"order"` object, add after the `"changePayment"` key:
```json
"share_qr": "Share QR for pick-up",
"download_qr": "Download QR",
"share_qr_note": "You can share this QR with a friend to pick up on your behalf.",
"status_refunded": "Refunded",
"refund_note": "This order expired — your payment has been refunded."
```

Inside the `"vendor"` object, add after the `"bankInfoNotSet"` key:
```json
"quick_create": "Quick Create",
"quick_create_modal": "Quick Listing",
"volume_low": "Low",
"volume_medium": "Medium",
"volume_high": "High",
"suggested_qty": "Suggested: {{count}} boxes",
"auto_title": "{{store}} Mystery Box — {{category}}",
"pickup_window": "Pickup window",
"packed_at_label": "Packed at (optional)"
```

Inside the `"listing"` object, add after the `"back"` key:
```json
"packed_at": "Packed at {{time}}",
"time_left": "{{hours}}h {{minutes}}m left",
"time_left_min": "{{minutes}}m left",
"time_left_urgent": "{{minutes}}m left — Hurry!",
"expired_label": "Expired"
```

- [ ] **Step 3: Add same keys to `src/locales/vi/translation.json`**

Inside `"order"`:
```json
"share_qr": "Chia sẻ QR để nhận hàng",
"download_qr": "Tải QR",
"share_qr_note": "Bạn có thể chia sẻ mã QR này cho bạn bè để nhận hàng thay.",
"status_refunded": "Đã hoàn tiền",
"refund_note": "Đơn hàng đã hết hạn — thanh toán của bạn sẽ được hoàn lại."
```

Inside `"vendor"`:
```json
"quick_create": "Tạo nhanh",
"quick_create_modal": "Đăng sản phẩm nhanh",
"volume_low": "Ít",
"volume_medium": "Vừa",
"volume_high": "Nhiều",
"suggested_qty": "Đề xuất: {{count}} hộp",
"auto_title": "Mystery Box {{category}} — {{store}}",
"pickup_window": "Khung giờ lấy hàng",
"packed_at_label": "Đóng hộp lúc (tùy chọn)"
```

Inside `"listing"`:
```json
"packed_at": "Đóng gói lúc {{time}}",
"time_left": "Còn {{hours}}h {{minutes}}p",
"time_left_min": "Còn {{minutes}}p",
"time_left_urgent": "Còn {{minutes}}p — Nhanh lên!",
"expired_label": "Hết hạn"
```

- [ ] **Step 4: Run TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: no new type errors. (Build may fail on Vite steps — only TypeScript errors matter here.)

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat(E1-E3): add refunded status, packedAt, pickupEnd types + i18n keys"
```

---

## Task 2: E2 — suggestQuantity utility + tests

**Files:**
- Create: `src/utils/quickCreate.ts`
- Create: `src/utils/quickCreate.test.ts`

**Interfaces:**
- Consumes: `Order` type from `src/types.ts`
- Produces: `suggestQuantity(orders: Order[], volume: Volume): number` and `Volume` type — used by Task 5 (ListingsPage modal)

- [ ] **Step 1: Write the failing test — create `src/utils/quickCreate.test.ts`**

```ts
import { describe, test, expect } from 'vitest'
import { suggestQuantity } from './quickCreate'
import type { Order } from '../types'

const ts = (s: number) => ({ seconds: s, nanoseconds: 0 }) as any

function makeOrders(count: number, status = 'paid'): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i), customerId: 'c1', vendorId: 'v1', listingId: 'l1',
    listingTitle: 'Test', quantity: 1, totalPrice: 30000,
    status: status as any, qrCode: 'qr', createdAt: ts(1000 + i),
  }))
}

describe('suggestQuantity', () => {
  test('returns 1 when no orders exist', () => {
    expect(suggestQuantity([], 'medium')).toBe(1)
  })

  test('returns 1 when only pending orders exist', () => {
    expect(suggestQuantity(makeOrders(14, 'pending'), 'medium')).toBe(1)
  })

  test('medium: ceil(avgDaily × 1.0)', () => {
    // 14 paid over 14 days = 1/day → ceil(1 × 1.0) = 1
    expect(suggestQuantity(makeOrders(14, 'paid'), 'medium')).toBe(1)
  })

  test('high: ceil(avgDaily × 1.5)', () => {
    // 14 paid → 1/day → ceil(1 × 1.5) = 2
    expect(suggestQuantity(makeOrders(14, 'paid'), 'high')).toBe(2)
  })

  test('low: ceil(avgDaily × 0.5), minimum 1', () => {
    // 14 paid → 1/day → ceil(1 × 0.5) = 1
    expect(suggestQuantity(makeOrders(14, 'paid'), 'low')).toBe(1)
  })

  test('scales with higher volume', () => {
    // 28 paid → 2/day → high = ceil(2 × 1.5) = 3
    expect(suggestQuantity(makeOrders(28, 'paid'), 'high')).toBe(3)
  })

  test('counts picked_up orders', () => {
    const mixed = [...makeOrders(7, 'paid'), ...makeOrders(7, 'picked_up')]
    // 14 total → 1/day → medium = 1
    expect(suggestQuantity(mixed, 'medium')).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- quickCreate --run
```

Expected: FAIL — `Cannot find module './quickCreate'`

- [ ] **Step 3: Create `src/utils/quickCreate.ts`**

```ts
import type { Order } from '../types'

export type Volume = 'low' | 'medium' | 'high'

const MULTIPLIERS: Record<Volume, number> = { low: 0.5, medium: 1.0, high: 1.5 }
const WINDOW_DAYS = 14

export function suggestQuantity(orders: Order[], volume: Volume): number {
  const sold = orders.filter(o => o.status === 'paid' || o.status === 'picked_up')
  const avgDailySold = sold.length / WINDOW_DAYS
  return Math.max(1, Math.ceil(avgDailySold * MULTIPLIERS[volume]))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- quickCreate --run
```

Expected: 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/utils/quickCreate.ts src/utils/quickCreate.test.ts
git commit -m "feat(E2): add suggestQuantity utility with tests"
```

---

## Task 3: E3 — useCountdown hook + tests

**Files:**
- Create: `src/hooks/useCountdown.ts`
- Create: `src/hooks/useCountdown.test.ts`

**Interfaces:**
- Consumes: `Timestamp` from `firebase/firestore`
- Produces: `useCountdown(pickupEnd: Timestamp): { hoursLeft, minutesLeft, urgent, expired }` — used by Tasks 6 and 7

- [ ] **Step 1: Write the failing test — create `src/hooks/useCountdown.test.ts`**

```ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from './useCountdown'

const NOW = new Date('2026-06-21T12:00:00Z')
const ts = (iso: string) => ({ seconds: new Date(iso).getTime() / 1000, nanoseconds: 0 }) as any

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  test('expired when pickupEnd is in the past', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T11:00:00Z')))
    expect(result.current.expired).toBe(true)
    expect(result.current.hoursLeft).toBe(0)
    expect(result.current.minutesLeft).toBe(0)
  })

  test('correct hours and minutes for future time', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T14:30:00Z')))
    expect(result.current.expired).toBe(false)
    expect(result.current.hoursLeft).toBe(2)
    expect(result.current.minutesLeft).toBe(30)
    expect(result.current.urgent).toBe(false)
  })

  test('urgent when 30 minutes or fewer remain', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T12:25:00Z')))
    expect(result.current.urgent).toBe(true)
    expect(result.current.hoursLeft).toBe(0)
    expect(result.current.minutesLeft).toBe(25)
  })

  test('not urgent at exactly 31 minutes', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T12:31:00Z')))
    expect(result.current.urgent).toBe(false)
  })

  test('updates on interval tick', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T14:00:00Z')))
    expect(result.current.hoursLeft).toBe(2)
    act(() => { vi.advanceTimersByTime(60000) })
    expect(result.current.hoursLeft).toBe(1)
    expect(result.current.minutesLeft).toBe(59)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- useCountdown --run
```

Expected: FAIL — `Cannot find module './useCountdown'`

- [ ] **Step 3: Create `src/hooks/useCountdown.ts`**

```ts
import { useState, useEffect } from 'react'
import type { Timestamp } from 'firebase/firestore'

export interface CountdownResult {
  hoursLeft: number
  minutesLeft: number
  urgent: boolean
  expired: boolean
}

export function useCountdown(pickupEnd: Timestamp): CountdownResult {
  const compute = (): CountdownResult => {
    const msLeft = pickupEnd.seconds * 1000 - Date.now()
    if (msLeft <= 0) return { hoursLeft: 0, minutesLeft: 0, urgent: false, expired: true }
    const totalMinutes = Math.floor(msLeft / 60000)
    return {
      hoursLeft: Math.floor(totalMinutes / 60),
      minutesLeft: totalMinutes % 60,
      urgent: totalMinutes <= 30,
      expired: false,
    }
  }

  const [result, setResult] = useState<CountdownResult>(compute)

  useEffect(() => {
    const id = setInterval(() => setResult(compute()), 60000)
    return () => clearInterval(id)
  }, [pickupEnd.seconds])

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- useCountdown --run
```

Expected: 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCountdown.ts src/hooks/useCountdown.test.ts
git commit -m "feat(E3): add useCountdown hook with tests"
```

---

## Task 4: E1 — Share QR + refunded status on OrderDetailPage

**Files:**
- Modify: `src/pages/customer/OrderDetailPage.tsx`

**Interfaces:**
- Consumes: `QRCodeCanvas` from `qrcode.react`, `Order.status === 'refunded'` from Task 1

- [ ] **Step 1: Add imports and Share QR logic**

At the top of `src/pages/customer/OrderDetailPage.tsx`, add `useRef` and `useCallback` to the React import, and add `QRCodeCanvas` to the qrcode.react import:

```ts
// Change:
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// To:
import { useEffect, useState, useRef, useCallback } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
```

- [ ] **Step 2: Add canvasRef and handleShareQR inside the component**

After the existing state declarations (after `const [reviewSubmitting, setReviewSubmitting] = useState(false)`), add:

```ts
const qrCanvasRef = useRef<HTMLCanvasElement>(null)

const handleShareQR = useCallback(async () => {
  const canvas = qrCanvasRef.current
  if (!canvas) return
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  const file = new File([blob], 'mysterybox-qr.png', { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'MysteryBox QR' })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mysterybox-qr.png'
    a.click()
    URL.revokeObjectURL(url)
  }
}, [])
```

- [ ] **Step 3: Update the Pickup QR block in JSX**

Find the `{/* Pickup QR */}` block and replace it with:

```tsx
{showQR && (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
    <p className="text-green-400 font-medium text-sm mb-4">{qrInstruction}</p>
    <div className="bg-white p-4 rounded-xl inline-block mb-3">
      <QRCodeSVG value={order.qrCode} size={200} />
    </div>
    <div className="hidden">
      <QRCodeCanvas ref={qrCanvasRef} value={order.qrCode} size={200} />
    </div>
    <p className="text-slate-500 text-xs font-mono break-all">{order.qrCode}</p>
    <button
      onClick={handleShareQR}
      className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
    >
      {t('order.share_qr')}
    </button>
    <p className="text-slate-500 text-xs mt-2 italic">{t('order.share_qr_note')}</p>
  </div>
)}
```

- [ ] **Step 4: Add refunded status card**

After the `{/* Picked up */}` block and before the `{/* Review form */}` block, add:

```tsx
{order.status === 'refunded' && (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
    <div className="text-5xl mb-3">💸</div>
    <p className="text-white font-bold text-lg">{t('order.status_refunded')}</p>
    <p className="text-slate-400 text-sm mt-1">{t('order.refund_note')}</p>
  </div>
)}
```

- [ ] **Step 5: Run TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: no new errors in OrderDetailPage.tsx

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/OrderDetailPage.tsx
git commit -m "feat(E1): add Share QR button and refunded status to OrderDetailPage"
```

---

## Task 5: E2 — getVendorOrders service + Quick Create modal on ListingsPage

**Files:**
- Modify: `src/services/orders.ts`
- Modify: `src/pages/vendor/ListingsPage.tsx`

**Interfaces:**
- Consumes: `suggestQuantity` from `src/utils/quickCreate.ts` (Task 2), `createListing` from `src/services/listings.ts`, `getVendorOrders` new function, `Listing`, `Order`, `ListingCategory` types
- Produces: working Quick Create modal that writes a listing via `createListing`

- [ ] **Step 1: Add `getVendorOrders` to `src/services/orders.ts`**

Add these imports at the top (merge with existing imports):
```ts
import {
  collection, doc, onSnapshot,
  query, where, orderBy, getDocs, runTransaction, Unsubscribe
} from 'firebase/firestore'
```
(`getDocs` is already imported — verify it's present, add only if missing.)

Add the function at the bottom of `src/services/orders.ts`:

```ts
export async function getVendorOrders(vendorId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('vendorId', '==', vendorId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}
```

- [ ] **Step 2: Replace `src/pages/vendor/ListingsPage.tsx` with the version including Quick Create**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing, createListing } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { suggestQuantity } from '../../utils/quickCreate'
import type { Volume } from '../../utils/quickCreate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Listing, ListingCategory, Order } from '../../types'

const CATEGORIES: ListingCategory[] = ['bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

function todayAt(hour: number, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

export default function ListingsPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // Quick Create state
  const [showQC, setShowQC] = useState(false)
  const [qcCategory, setQcCategory] = useState<ListingCategory>('bakery')
  const [qcVolume, setQcVolume] = useState<Volume | null>(null)
  const [qcQty, setQcQty] = useState(1)
  const [qcPrice, setQcPrice] = useState('')
  const [qcPickupStart, setQcPickupStart] = useState(todayAt(17))
  const [qcPickupEnd, setQcPickupEnd] = useState(todayAt(21))
  const [qcOrders, setQcOrders] = useState<Order[]>([])
  const [qcLoading, setQcLoading] = useState(false)
  const [qcError, setQcError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorListings(currentUser.uid, data => { setListings(data); setLoading(false) })
    return unsub
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const openQuickCreate = async () => {
    if (!currentUser) return
    setQcError('')
    setQcVolume(null)
    setQcQty(1)
    setQcPickupStart(todayAt(17))
    setQcPickupEnd(todayAt(21))
    // Pre-fill price from most recent listing of default category
    const recent = listings.find(l => l.category === qcCategory)
    setQcPrice(recent ? String(recent.price) : '')
    // Fetch orders for qty estimation
    const orders = await getVendorOrders(currentUser.uid)
    setQcOrders(orders)
    setShowQC(true)
  }

  const handleQcCategory = (cat: ListingCategory) => {
    setQcCategory(cat)
    const recent = listings.find(l => l.category === cat)
    if (recent) setQcPrice(String(recent.price))
    if (qcVolume) setQcQty(suggestQuantity(qcOrders, qcVolume))
  }

  const handleQcVolume = (vol: Volume) => {
    setQcVolume(vol)
    setQcQty(suggestQuantity(qcOrders, vol))
  }

  const handleQcSubmit = async () => {
    if (!currentUser || !qcVolume) return
    setQcLoading(true)
    setQcError('')
    try {
      const categoryLabel = t(`categories.${qcCategory}`)
      const storeName = currentUser.displayName ?? 'Store'
      const title = t('vendor.auto_title', { store: storeName, category: categoryLabel })
      await createListing({
        vendorId: currentUser.uid,
        type: 'mystery_box',
        title,
        description: '',
        price: parseInt(qcPrice) || 0,
        originalPrice: Math.round((parseInt(qcPrice) || 0) * 1.5),
        quantityTotal: qcQty,
        quantityRemaining: qcQty,
        category: qcCategory,
        imageUrl: '',
        pickupStart: Timestamp.fromDate(new Date(qcPickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(qcPickupEnd)),
        status: 'active',
      })
      setShowQC(false)
    } catch (err: unknown) {
      setQcError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setQcLoading(false)
    }
  }

  const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400', sold_out: 'text-orange-400', expired: 'text-slate-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('vendor.myListings')}</h1>
        <div className="flex gap-2">
          <Button
            onClick={openQuickCreate}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {t('vendor.quick_create')}
          </Button>
          <Link to="/vendor/listings/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">{t('vendor.newListing')}</Button>
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-400">{t('browse.loading')}</p>}
      {!loading && listings.length === 0 && <p className="text-slate-400">{t('vendor.noListings')}</p>}

      <div className="space-y-3">
        {listings.map(l => (
          <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {l.imageUrl ? <img src={l.imageUrl} className="w-full h-full object-cover rounded-lg" /> : '🎁'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{l.title}</p>
              <p className="text-slate-400 text-sm">
                {l.price.toLocaleString('vi-VN')} đ · {l.quantityRemaining}/{l.quantityTotal} left ·{' '}
                <span className={STATUS_COLOR[l.status]}>{l.status.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link to={`/vendor/listings/${l.id}/edit`}>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white">{t('vendor.edit')}</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)}>{t('vendor.delete')}</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Create Modal */}
      {showQC && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{t('vendor.quick_create_modal')}</h2>
              <button onClick={() => setShowQC(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>

            {/* Category */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Category</Label>
              <div className="grid grid-cols-3 gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleQcCategory(cat)}
                    className={`py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
                      qcCategory === cat
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t(`categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Surplus volume</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as Volume[]).map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => handleQcVolume(vol)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      qcVolume === vol
                        ? 'border-purple-500 bg-purple-600/20 text-purple-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t(`vendor.volume_${vol}`)}
                  </button>
                ))}
              </div>
              {qcVolume && (
                <p className="text-indigo-400 text-xs mt-1">
                  {t('vendor.suggested_qty', { count: suggestQuantity(qcOrders, qcVolume) })}
                </p>
              )}
            </div>

            {/* Qty adjust */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQcQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >−</button>
                <span className="text-white font-bold text-lg w-8 text-center">{qcQty}</span>
                <button
                  type="button"
                  onClick={() => setQcQty(q => q + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >+</button>
              </div>
            </div>

            {/* Price */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">Price (VND)</Label>
              <Input
                value={qcPrice}
                onChange={e => setQcPrice(e.target.value)}
                type="number"
                min="1000"
                placeholder="35000"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Pickup window */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.pickup_window')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={qcPickupStart} onChange={e => setQcPickupStart(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
                <Input value={qcPickupEnd} onChange={e => setQcPickupEnd(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
              </div>
            </div>

            {qcError && <p className="text-red-400 text-xs">{qcError}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleQcSubmit}
                disabled={qcLoading || !qcVolume || !qcPrice}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                {qcLoading ? t('vendor.saving') : t('vendor.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQC(false)}
                className="border-slate-700 text-slate-300"
              >
                {t('vendor.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: no errors in ListingsPage.tsx or orders.ts

- [ ] **Step 4: Commit**

```bash
git add src/services/orders.ts src/pages/vendor/ListingsPage.tsx
git commit -m "feat(E2): add Quick Create modal with AI quantity suggestion to ListingsPage"
```

---

## Task 6: E3 — Countdown UI on ListingCard + packedAt on ListingDetailPage

**Files:**
- Modify: `src/components/shared/ListingCard.tsx`
- Modify: `src/pages/customer/ListingDetailPage.tsx`

**Interfaces:**
- Consumes: `useCountdown` from Task 3, `Listing.packedAt?: Timestamp` from Task 1

- [ ] **Step 1: Update `src/components/shared/ListingCard.tsx`**

Add the import at the top:
```ts
import { useCountdown } from '../../hooks/useCountdown'
```

Inside the component, after the `pickup` const, add:
```ts
const { hoursLeft, minutesLeft, urgent, expired: cdExpired } = useCountdown(listing.pickupEnd)
const showBadge = !cdExpired && hoursLeft < 3
```

In JSX, inside the `<div className="p-3">` section, after the existing `<div className="flex items-center justify-between mt-1">` block containing the pickup time, add:

```tsx
{showBadge && (
  <p className={`text-xs font-medium mt-1 ${urgent ? 'text-red-400' : 'text-indigo-400'}`}>
    ⏱{' '}
    {urgent
      ? t('listing.time_left_urgent', { minutes: minutesLeft })
      : hoursLeft > 0
        ? t('listing.time_left', { hours: hoursLeft, minutes: minutesLeft })
        : t('listing.time_left_min', { minutes: minutesLeft })}
  </p>
)}
```

Also add `useTranslation` import:
```ts
import { useTranslation } from 'react-i18next'
```

And inside the component, add:
```ts
const { t } = useTranslation()
```

- [ ] **Step 2: Update ListingDetailPage — add packedAt label and countdown**

In `src/pages/customer/ListingDetailPage.tsx`, add the import at the top:
```ts
import { useCountdown } from '../../hooks/useCountdown'
import { useTranslation } from 'react-i18next'  // already imported — verify
```

Locate where `listing` is displayed (the section showing pickup window and category). After the pickup window line, in the JSX section that renders listing details, add:

```tsx
<CountdownBadge pickupEnd={listing.pickupEnd} />

{/* Packed at */}
{listing.packedAt && (
  <p className="text-slate-500 text-xs mt-1">
    {t('listing.packed_at', {
      time: new Date(listing.packedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })}
  </p>
)}
```

Add this `CountdownBadge` component above the `export default function ListingDetailPage()` definition in `ListingDetailPage.tsx`, and add `import { Timestamp } from 'firebase/firestore'` and `import { useCountdown } from '../../hooks/useCountdown'` to the imports:

```tsx
function CountdownBadge({ pickupEnd }: { pickupEnd: Timestamp }) {
  const { t } = useTranslation()
  const { hoursLeft, minutesLeft, urgent, expired } = useCountdown(pickupEnd)
  if (expired || hoursLeft >= 3) return null
  return (
    <p className={`text-sm font-medium mt-1 ${urgent ? 'text-red-400' : 'text-indigo-400'}`}>
      ⏱{' '}
      {urgent
        ? t('listing.time_left_urgent', { minutes: minutesLeft })
        : hoursLeft > 0
          ? t('listing.time_left', { hours: hoursLeft, minutes: minutesLeft })
          : t('listing.time_left_min', { minutes: minutesLeft })}
    </p>
  )
}
```

Then in the JSX:
```tsx
<CountdownBadge pickupEnd={listing.pickupEnd} />
{listing.packedAt && (
  <p className="text-slate-500 text-xs mt-1">
    {t('listing.packed_at', {
      time: new Date(listing.packedAt.seconds * 1000)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })}
  </p>
)}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/ListingCard.tsx src/pages/customer/ListingDetailPage.tsx
git commit -m "feat(E3): add countdown badge to ListingCard and ListingDetailPage"
```

---

## Task 7: E3 — packedAt field on ListingFormPage

**Files:**
- Modify: `src/pages/vendor/ListingFormPage.tsx`

**Interfaces:**
- Consumes: `Listing.packedAt?: Timestamp` from Task 1

- [ ] **Step 1: Add packedAt state and populate it on edit load**

In `src/pages/vendor/ListingFormPage.tsx`, add a new state variable after the existing state declarations:

```ts
const [packedAt, setPackedAt] = useState('')
```

In the `useEffect` that loads an existing listing (after `setPickupEnd(...)`), add:
```ts
if (l.packedAt) setPackedAt(toDatetimeLocal(l.packedAt))
```

- [ ] **Step 2: Include packedAt in the submit data**

In `handleSubmit`, inside the `data` object, add:
```ts
...(packedAt ? { packedAt: Timestamp.fromDate(new Date(packedAt)) } : {}),
```

- [ ] **Step 3: Add the input field to the JSX**

After the pickup window grid and before the image field, add:

```tsx
<div className="space-y-1">
  <Label className="text-slate-300">{t('vendor.packed_at_label')}</Label>
  <Input
    value={packedAt}
    onChange={e => setPackedAt(e.target.value)}
    type="datetime-local"
    className="bg-slate-800 border-slate-700 text-white"
  />
</div>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/vendor/ListingFormPage.tsx
git commit -m "feat(E3): add optional packedAt field to listing form"
```

---

## Task 8: E3 — createCheckoutSession: write pickupEnd to order

**Files:**
- Modify: `functions/src/createCheckoutSession.ts`

**Interfaces:**
- Produces: `orders/{id}.pickupEnd: Timestamp` — queried by `autoRefundExpiredOrders` (Task 10)

- [ ] **Step 1: Add `pickupEnd` to the order document**

In `functions/src/createCheckoutSession.ts`, find the `await db.collection('orders').doc(orderId).set({...})` call and add `pickupEnd` to the object:

```ts
await db.collection('orders').doc(orderId).set({
  customerId,
  vendorId: listing.vendorId,
  listingId,
  listingTitle: listing.title,
  quantity,
  totalPrice: listing.price * quantity,
  status: 'pending',
  qrCode: uuidv4(),
  stripeSessionId: session.id,
  pickupEnd: listing.pickupEnd,          // ← add this line
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
})
```

`listing.pickupEnd` is a Firestore Timestamp already on the listing document, so it passes through directly.

- [ ] **Step 2: Deploy and verify (manual)**

```bash
cd functions && npm run build
```

Expected: compiles without errors. (Full deploy is covered in the final task.)

- [ ] **Step 3: Commit**

```bash
git add functions/src/createCheckoutSession.ts
git commit -m "feat(E3): denormalize pickupEnd onto order in createCheckoutSession"
```

---

## Task 9: E3 — stripeWebhook: write stripePaymentIntentId to order

**Files:**
- Modify: `functions/src/stripeWebhook.ts`

**Interfaces:**
- Produces: `orders/{id}.stripePaymentIntentId: string` — used by `autoRefundExpiredOrders` (Task 10)

- [ ] **Step 1: Add `stripePaymentIntentId` to the order update**

In `functions/src/stripeWebhook.ts`, find the `t.update(orderRef, { status: 'paid' })` line inside the transaction and change it to:

```ts
t.update(orderRef, {
  status: 'paid',
  stripePaymentIntentId: session.payment_intent as string,
})
```

`session.payment_intent` is a string (the PaymentIntent ID like `pi_xxx`) available on every completed `checkout.session.completed` event when `mode: 'payment'` is used.

- [ ] **Step 2: Build functions**

```bash
cd functions && npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add functions/src/stripeWebhook.ts
git commit -m "feat(E3): store stripePaymentIntentId on order in webhook"
```

---

## Task 10: E3 — autoRefundExpiredOrders Cloud Function + Firestore index

**Files:**
- Create: `functions/src/autoRefundExpiredOrders.ts`
- Modify: `functions/src/index.ts`
- Modify: `firestore.indexes.json`

**Interfaces:**
- Consumes: `orders.status == 'paid'`, `orders.pickupEnd`, `orders.stripePaymentIntentId` — all written by Tasks 8 and 9
- Produces: Stripe refund + `orders.status = 'refunded'`

- [ ] **Step 1: Create `functions/src/autoRefundExpiredOrders.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const autoRefundExpiredOrders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const db = admin.firestore()
    const stripe = getStripe()

    const snap = await db.collection('orders')
      .where('status', '==', 'paid')
      .where('pickupEnd', '<', admin.firestore.Timestamp.now())
      .get()

    if (snap.empty) {
      console.log('autoRefundExpiredOrders: no expired paid orders')
      return
    }

    console.log(`autoRefundExpiredOrders: processing ${snap.docs.length} orders`)

    await Promise.allSettled(snap.docs.map(async orderDoc => {
      await db.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref)
        if (!fresh.exists) return
        if (fresh.data()!.status !== 'paid') return

        const paymentIntentId = fresh.data()!.stripePaymentIntentId as string | undefined
        if (!paymentIntentId) {
          console.warn(`autoRefundExpiredOrders: order ${orderDoc.id} missing stripePaymentIntentId — skipping`)
          return
        }

        await stripe.refunds.create({ payment_intent: paymentIntentId })
        tx.update(orderDoc.ref, { status: 'refunded' })
      })
    }))

    console.log('autoRefundExpiredOrders: done')
  })
```

- [ ] **Step 2: Export from `functions/src/index.ts`**

Add to the bottom of `functions/src/index.ts`:

```ts
export { autoRefundExpiredOrders } from './autoRefundExpiredOrders'
```

- [ ] **Step 3: Add Firestore composite index to `firestore.indexes.json`**

Inside the `"indexes"` array in `firestore.indexes.json`, add before the closing `]`:

```json
{ "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [{"fieldPath":"status","order":"ASCENDING"},{"fieldPath":"pickupEnd","order":"ASCENDING"}]}
```

- [ ] **Step 4: Build functions**

```bash
cd functions && npm run build
```

Expected: compiles without errors

- [ ] **Step 5: Run all frontend tests**

```bash
cd .. && npm test -- --run
```

Expected: all existing tests + 7 quickCreate + 5 useCountdown pass (22+ total)

- [ ] **Step 6: Deploy everything**

```bash
# Deploy Firestore rules and new index
firebase deploy --only firestore:rules,firestore:indexes

# Deploy all Cloud Functions
firebase deploy --only functions

# Build and deploy frontend
npm run build && firebase deploy --only hosting
```

Expected: all deployments succeed; Stripe CLI or Dashboard webhook is active.

- [ ] **Step 7: Manual smoke test**

**E1:** Place an order (use test card `4242 4242 4242 4242`). On OrderDetailPage, tap "Share QR" — on mobile it should open the share sheet; on desktop it should download a PNG.

**E2:** As a vendor, click "Quick Create". Select a category, pick "High". Confirm a suggested quantity appears. Set a price and submit. The listing should appear in the list immediately.

**E3:** Check a listing with a pickupEnd < 3h from now — a countdown badge should show on the card and detail page. To test auto-refund: in Firestore Console, manually set a paid order's `pickupEnd` to a timestamp in the past, wait ≤5 min, and confirm its status changes to `"refunded"` and Stripe shows a refund.

- [ ] **Step 8: Commit**

```bash
git add functions/src/autoRefundExpiredOrders.ts functions/src/index.ts firestore.indexes.json
git commit -m "feat(E3): add autoRefundExpiredOrders scheduled Cloud Function + Firestore index"
```

---

## Stripe Setup (if you don't have an account yet)

Before Task 10 will work in production, complete these steps:

**1. Create account:** [stripe.com](https://stripe.com) → Start now → use Test mode (no identity verification needed)

**2. Get API keys:** Dashboard → Developers → API keys

| Key | Where to use |
|---|---|
| Publishable key (`pk_test_...`) | `VITE_STRIPE_PUBLISHABLE_KEY` in `.env.local` |
| Secret key (`sk_test_...`) | `functions/.runtimeconfig.json` → `stripe.secret_key` |

`functions/.runtimeconfig.json`:
```json
{
  "stripe": {
    "secret_key": "sk_test_YOUR_KEY_HERE",
    "webhook_secret": "whsec_YOUR_WEBHOOK_SECRET_HERE"
  },
  "app": {
    "url": "http://localhost:5173"
  }
}
```

**3. Local webhook forwarding:**
```bash
stripe login
stripe listen --forward-to http://localhost:5001/{your-project-id}/us-central1/stripeWebhook
```
Copy the printed `whsec_...` value into `runtimeconfig.json` as `stripe.webhook_secret`.

**4. Production webhook:** Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://us-central1-{your-project-id}.cloudfunctions.net/stripeWebhook`
- Event: `checkout.session.completed`
- Then: `firebase functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."`

**5. Test a refund:**
```bash
stripe refunds list  # should show refunds after autoRefundExpiredOrders fires
```
