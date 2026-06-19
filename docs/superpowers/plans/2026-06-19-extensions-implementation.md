# MysteryBox Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four extensions to the completed MysteryBox app — D1 Vendor Analytics charts, D2 Customer Reviews, D3 Search/Filters on Browse, D4 Vendor Public Store Page.

**Architecture:** All features are client-side additions to existing pages (D1, D2, D3) plus one new public page (D4). Pure logic is extracted into testable utility files. Firebase service calls extend existing patterns — one new Firestore collection (`reviews`), one new service file, two new utility files, one new page component.

**Tech Stack:** React + TypeScript + Vite · Vitest + @testing-library/react · Firebase Firestore · Recharts (new dependency for D1) · react-i18next · Tailwind CSS + shadcn/ui

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Add `Review` interface |
| `src/utils/filterListings.ts` | Create | Pure filter/sort logic for D3 (testable) |
| `src/utils/filterListings.test.ts` | Create | Unit tests for filter logic |
| `src/utils/analytics.ts` | Create | Pure analytics computations for D1 (testable) |
| `src/utils/analytics.test.ts` | Create | Unit tests for analytics computations |
| `src/services/reviews.ts` | Create | Firestore CRUD for reviews collection |
| `src/services/listings.ts` | Modify | Add `getActiveListingsByVendor` |
| `src/components/shared/StarRating.tsx` | Create | Reusable star rating widget (D2) |
| `src/components/shared/StarRating.test.tsx` | Create | Component tests for StarRating |
| `src/pages/customer/BrowsePage.tsx` | Modify | Add search + filters (D3) |
| `src/pages/customer/OrderDetailPage.tsx` | Modify | Add review form (D2) |
| `src/pages/customer/ListingDetailPage.tsx` | Modify | Add review display + store link (D2, D4) |
| `src/pages/customer/VendorStorePage.tsx` | Create | Public vendor store page (D4) |
| `src/components/shared/ListingCard.tsx` | Modify | Add "View store" link (D4) |
| `src/App.tsx` | Modify | Register `/store/:vendorId` public route (D4) |
| `src/pages/vendor/VendorDashboardPage.tsx` | Modify | Add Analytics tab + Recharts (D1) |
| `src/locales/en/translation.json` | Modify | New i18n keys for D1–D4 |
| `src/locales/vi/translation.json` | Modify | New i18n keys for D1–D4 |
| `firestore.rules` | Modify | Add `reviews` collection rules |
| `firestore.indexes.json` | Modify | Add composite indexes for `reviews` |

---

## Task 1: Add `Review` type + create reviews service

**Files:**
- Modify: `src/types.ts`
- Create: `src/services/reviews.ts`

- [ ] **Step 1: Add `Review` interface to `src/types.ts`**

  Append after the `Order` interface:

  ```typescript
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

- [ ] **Step 2: Create `src/services/reviews.ts`**

  ```typescript
  import {
    collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp
  } from 'firebase/firestore'
  import { db } from '../firebase'
  import type { Review } from '../types'

  export async function submitReview(
    data: Omit<Review, 'id' | 'createdAt'>
  ): Promise<void> {
    await addDoc(collection(db, 'reviews'), { ...data, createdAt: serverTimestamp() })
  }

  export async function getReviewForOrder(orderId: string): Promise<Review | null> {
    const q = query(collection(db, 'reviews'), where('orderId', '==', orderId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Review
  }

  export async function getReviewsForListing(listingId: string): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('listingId', '==', listingId),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))
  }

  export async function getAggregateRatingForVendor(
    vendorId: string
  ): Promise<{ avg: number; count: number }> {
    const q = query(collection(db, 'reviews'), where('vendorId', '==', vendorId))
    const snap = await getDocs(q)
    if (snap.empty) return { avg: 0, count: 0 }
    const ratings = snap.docs.map(d => d.data().rating as number)
    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length
    return { avg: Math.round(avg * 10) / 10, count: ratings.length }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/types.ts src/services/reviews.ts
  git commit -m "feat: add Review type and reviews Firestore service"
  ```

---

## Task 2: Create filter utility with tests (D3 foundation)

**Files:**
- Create: `src/utils/filterListings.ts`
- Create: `src/utils/filterListings.test.ts`

- [ ] **Step 1: Write the failing test file `src/utils/filterListings.test.ts`**

  ```typescript
  import { describe, test, expect } from 'vitest'
  import { filterListings } from './filterListings'
  import type { Listing } from '../types'

  const ts = (seconds: number) => ({ seconds, nanoseconds: 0 }) as any

  const base: Listing = {
    id: '1', vendorId: 'v1', type: 'mystery_box',
    title: 'Bánh mì box', description: 'Fresh bread',
    price: 30000, originalPrice: 60000,
    quantityTotal: 5, quantityRemaining: 3,
    pickupStart: ts(0), pickupEnd: ts(9999999999),
    category: 'bakery', imageUrl: '', status: 'active',
    createdAt: ts(1000),
  }

  const listings: Listing[] = [
    { ...base, id: '1', title: 'Bánh mì box', price: 30000, category: 'bakery', createdAt: ts(1000) },
    { ...base, id: '2', title: 'Cơm hộp', description: 'Rice lunch', price: 50000, category: 'rice', createdAt: ts(2000) },
    { ...base, id: '3', title: 'Trà sữa', description: 'Milk tea', price: 20000, category: 'drinks', createdAt: ts(3000),
      pickupStart: ts(0), pickupEnd: ts(1) },
  ]

  const defaults = { search: '', minPrice: '', maxPrice: '', availableNow: false, sort: 'newest' as const }

  describe('filterListings', () => {
    test('returns all listings when no filters applied', () => {
      expect(filterListings(listings, defaults)).toHaveLength(3)
    })

    test('filters by search term in title', () => {
      const result = filterListings(listings, { ...defaults, search: 'bánh' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    test('filters by search term in description', () => {
      const result = filterListings(listings, { ...defaults, search: 'milk' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    test('search is case-insensitive', () => {
      const result = filterListings(listings, { ...defaults, search: 'RICE' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    test('filters by minPrice', () => {
      const result = filterListings(listings, { ...defaults, minPrice: '25000' })
      expect(result).toHaveLength(2)
      expect(result.map(l => l.id)).toContain('1')
      expect(result.map(l => l.id)).toContain('2')
    })

    test('filters by maxPrice', () => {
      const result = filterListings(listings, { ...defaults, maxPrice: '30000' })
      expect(result).toHaveLength(2)
      expect(result.map(l => l.id)).toContain('1')
      expect(result.map(l => l.id)).toContain('3')
    })

    test('availableNow filters out expired pickup windows', () => {
      const result = filterListings(listings, { ...defaults, availableNow: true })
      expect(result).toHaveLength(2)
      expect(result.map(l => l.id)).not.toContain('3')
    })

    test('sort price_asc orders by price ascending', () => {
      const result = filterListings(listings, { ...defaults, sort: 'price_asc' })
      expect(result[0].price).toBe(20000)
      expect(result[2].price).toBe(50000)
    })

    test('sort price_desc orders by price descending', () => {
      const result = filterListings(listings, { ...defaults, sort: 'price_desc' })
      expect(result[0].price).toBe(50000)
      expect(result[2].price).toBe(20000)
    })

    test('sort newest preserves original order', () => {
      const result = filterListings(listings, { ...defaults, sort: 'newest' })
      expect(result.map(l => l.id)).toEqual(['1', '2', '3'])
    })
  })
  ```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

  ```bash
  npm test -- filterListings
  ```

  Expected: `Error: Cannot find module './filterListings'`

- [ ] **Step 3: Create `src/utils/filterListings.ts`**

  ```typescript
  import type { Listing } from '../types'

  export type SortOption = 'newest' | 'price_asc' | 'price_desc'

  export interface FilterState {
    search: string
    minPrice: string
    maxPrice: string
    availableNow: boolean
    sort: SortOption
  }

  export const DEFAULT_FILTERS: FilterState = {
    search: '',
    minPrice: '',
    maxPrice: '',
    availableNow: false,
    sort: 'newest',
  }

  export function filterListings(listings: Listing[], filters: FilterState): Listing[] {
    const now = Date.now()
    let result = listings.filter(l => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.description.toLowerCase().includes(q)
        ) return false
      }
      if (filters.minPrice && l.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false
      if (filters.availableNow) {
        const start = l.pickupStart.seconds * 1000
        const end = l.pickupEnd.seconds * 1000
        if (now < start || now > end) return false
      }
      return true
    })
    if (filters.sort === 'price_asc') result = [...result].sort((a, b) => a.price - b.price)
    if (filters.sort === 'price_desc') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }

  export function hasActiveFilters(filters: FilterState): boolean {
    return (
      filters.search !== '' ||
      filters.minPrice !== '' ||
      filters.maxPrice !== '' ||
      filters.availableNow ||
      filters.sort !== 'newest'
    )
  }
  ```

- [ ] **Step 4: Run test — expect PASS**

  ```bash
  npm test -- filterListings
  ```

  Expected: `✓ filterListings (9 tests)`

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/filterListings.ts src/utils/filterListings.test.ts
  git commit -m "feat: add filterListings utility with tests (D3 foundation)"
  ```

---

## Task 3: Create analytics utility with tests (D1 foundation)

**Files:**
- Create: `src/utils/analytics.ts`
- Create: `src/utils/analytics.test.ts`

- [ ] **Step 1: Write the failing test file `src/utils/analytics.test.ts`**

  ```typescript
  import { describe, test, expect } from 'vitest'
  import { getRevenueByDay, getOrdersByCategory, getTopListing } from './analytics'
  import type { Order, Listing } from '../types'

  const ts = (seconds: number) => ({ seconds, nanoseconds: 0 }) as any

  const NOW_SECONDS = Math.floor(Date.now() / 1000)
  const DAY = 86400

  const baseOrder: Order = {
    id: 'o1', customerId: 'c1', vendorId: 'v1',
    listingId: 'l1', listingTitle: 'Bánh box',
    quantity: 1, totalPrice: 30000,
    status: 'paid', qrCode: 'qr1',
    createdAt: ts(NOW_SECONDS),
  }

  const baseListing: Listing = {
    id: 'l1', vendorId: 'v1', type: 'mystery_box',
    title: 'Bánh mì box', description: '',
    price: 30000, originalPrice: 60000,
    quantityTotal: 5, quantityRemaining: 3,
    pickupStart: ts(0), pickupEnd: ts(9999999999),
    category: 'bakery', imageUrl: '', status: 'active',
    createdAt: ts(1000),
  }

  describe('getRevenueByDay', () => {
    test('returns 7 entries', () => {
      const result = getRevenueByDay([])
      expect(result).toHaveLength(7)
    })

    test('sums revenue for today', () => {
      const orders = [
        { ...baseOrder, totalPrice: 30000, createdAt: ts(NOW_SECONDS) },
        { ...baseOrder, id: 'o2', totalPrice: 20000, createdAt: ts(NOW_SECONDS) },
      ]
      const result = getRevenueByDay(orders)
      const today = result[result.length - 1]
      expect(today.revenue).toBe(50000)
    })

    test('ignores orders older than 7 days', () => {
      const old = { ...baseOrder, totalPrice: 99999, createdAt: ts(NOW_SECONDS - 8 * DAY) }
      const result = getRevenueByDay([old])
      expect(result.every(d => d.revenue === 0)).toBe(true)
    })

    test('ignores pending and cancelled orders', () => {
      const pending = { ...baseOrder, status: 'pending' as const }
      const result = getRevenueByDay([pending])
      expect(result.every(d => d.revenue === 0)).toBe(true)
    })
  })

  describe('getOrdersByCategory', () => {
    test('returns empty array when no orders', () => {
      expect(getOrdersByCategory([], [])).toHaveLength(0)
    })

    test('counts orders by listing category', () => {
      const orders = [
        { ...baseOrder, listingId: 'l1' },
        { ...baseOrder, id: 'o2', listingId: 'l1' },
        { ...baseOrder, id: 'o3', listingId: 'l2' },
      ]
      const listings = [
        { ...baseListing, id: 'l1', category: 'bakery' as const },
        { ...baseListing, id: 'l2', category: 'rice' as const },
      ]
      const result = getOrdersByCategory(orders, listings)
      const bakery = result.find(r => r.category === 'bakery')
      const rice = result.find(r => r.category === 'rice')
      expect(bakery?.count).toBe(2)
      expect(rice?.count).toBe(1)
    })
  })

  describe('getTopListing', () => {
    test('returns null when no orders', () => {
      expect(getTopListing([], [])).toBeNull()
    })

    test('returns listing with highest total revenue', () => {
      const orders = [
        { ...baseOrder, listingId: 'l1', totalPrice: 30000 },
        { ...baseOrder, id: 'o2', listingId: 'l2', totalPrice: 50000 },
        { ...baseOrder, id: 'o3', listingId: 'l2', totalPrice: 50000 },
      ]
      const listings = [
        { ...baseListing, id: 'l1', title: 'Bánh box' },
        { ...baseListing, id: 'l2', title: 'Cơm hộp' },
      ]
      const result = getTopListing(orders, listings)
      expect(result?.listing.id).toBe('l2')
      expect(result?.revenue).toBe(100000)
    })
  })
  ```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

  ```bash
  npm test -- analytics
  ```

  Expected: `Error: Cannot find module './analytics'`

- [ ] **Step 3: Create `src/utils/analytics.ts`**

  ```typescript
  import type { Order, Listing } from '../types'

  const PAID_STATUSES = ['paid', 'picked_up']

  export interface DayRevenue {
    date: string
    revenue: number
  }

  export interface CategoryCount {
    category: string
    count: number
  }

  export interface TopListing {
    listing: Listing
    revenue: number
  }

  export function getRevenueByDay(orders: Order[]): DayRevenue[] {
    const days: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days[d.toLocaleDateString('en-CA')] = 0
    }
    orders
      .filter(o => PAID_STATUSES.includes(o.status))
      .forEach(o => {
        const d = new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-CA')
        if (d in days) days[d] = (days[d] || 0) + o.totalPrice
      })
    return Object.entries(days).map(([date, revenue]) => ({
      date: date.slice(5),
      revenue,
    }))
  }

  export function getOrdersByCategory(orders: Order[], listings: Listing[]): CategoryCount[] {
    const listingMap = new Map(listings.map(l => [l.id, l]))
    const counts: Record<string, number> = {}
    orders
      .filter(o => PAID_STATUSES.includes(o.status))
      .forEach(o => {
        const cat = listingMap.get(o.listingId)?.category ?? 'other'
        counts[cat] = (counts[cat] || 0) + 1
      })
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }

  export function getTopListing(orders: Order[], listings: Listing[]): TopListing | null {
    if (!orders.length) return null
    const revenue: Record<string, number> = {}
    orders
      .filter(o => PAID_STATUSES.includes(o.status))
      .forEach(o => {
        revenue[o.listingId] = (revenue[o.listingId] || 0) + o.totalPrice
      })
    const topId = Object.entries(revenue).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (!topId) return null
    const listing = listings.find(l => l.id === topId)
    if (!listing) return null
    return { listing, revenue: revenue[topId] }
  }
  ```

- [ ] **Step 4: Run test — expect PASS**

  ```bash
  npm test -- analytics
  ```

  Expected: `✓ analytics (7 tests)`

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/analytics.ts src/utils/analytics.test.ts
  git commit -m "feat: add analytics utility with tests (D1 foundation)"
  ```

---

## Task 4: Add `getActiveListingsByVendor` to listings service

**Files:**
- Modify: `src/services/listings.ts`

- [ ] **Step 1: Add the function to `src/services/listings.ts`**

  Add after the existing `getListing` function (after line 21):

  ```typescript
  export async function getActiveListingsByVendor(vendorId: string): Promise<Listing[]> {
    const q = query(
      collection(db, 'listings'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))
  }
  ```

  Also add `getDocs` to the import at the top:

  ```typescript
  import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    onSnapshot, query, where, orderBy, serverTimestamp, Unsubscribe
  } from 'firebase/firestore'
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/services/listings.ts
  git commit -m "feat: add getActiveListingsByVendor to listings service (D4 foundation)"
  ```

---

## Task 5: Add i18n keys + Firestore rules + indexes

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Add keys to `src/locales/en/translation.json`**

  Add these four objects before the closing `}` of the JSON (after the `"categories"` block):

  ```json
  ,
  "analytics": {
    "tab": "Analytics",
    "overview": "Overview",
    "revenue_chart": "Revenue (last 7 days)",
    "orders_by_category": "Orders by Category",
    "top_listing": "Top Listing This Week",
    "no_data": "No data yet"
  },
  "review": {
    "leave_review": "Leave a Review",
    "rating": "Rating",
    "comment_placeholder": "Share your experience (optional, max 300 chars)",
    "submit": "Submit Review",
    "submitting": "Submitting…",
    "thanks": "Thanks for your review!",
    "avg_rating": "avg rating",
    "no_reviews": "No reviews yet",
    "out_of_5": "/ 5"
  },
  "filter": {
    "search_placeholder": "Search listings…",
    "price_min": "Min price",
    "price_max": "Max price",
    "available_now": "Available now",
    "sort": "Sort",
    "sort_price_asc": "Price: low to high",
    "sort_price_desc": "Price: high to low",
    "sort_newest": "Newest",
    "clear_all": "Clear all",
    "active_filters": "Active filters"
  },
  "store": {
    "active_listings": "Active Listings",
    "no_listings": "No active listings right now",
    "view_store": "View store",
    "rating": "Rating",
    "no_rating_yet": "No ratings yet"
  }
  ```

- [ ] **Step 2: Add keys to `src/locales/vi/translation.json`**

  Same position (before closing `}`):

  ```json
  ,
  "analytics": {
    "tab": "Phân tích",
    "overview": "Tổng quan",
    "revenue_chart": "Doanh thu (7 ngày qua)",
    "orders_by_category": "Đơn hàng theo danh mục",
    "top_listing": "Sản phẩm nổi bật tuần này",
    "no_data": "Chưa có dữ liệu"
  },
  "review": {
    "leave_review": "Viết đánh giá",
    "rating": "Đánh giá",
    "comment_placeholder": "Chia sẻ trải nghiệm của bạn (tùy chọn, tối đa 300 ký tự)",
    "submit": "Gửi đánh giá",
    "submitting": "Đang gửi…",
    "thanks": "Cảm ơn đánh giá của bạn!",
    "avg_rating": "đánh giá TB",
    "no_reviews": "Chưa có đánh giá",
    "out_of_5": "/ 5"
  },
  "filter": {
    "search_placeholder": "Tìm kiếm sản phẩm…",
    "price_min": "Giá tối thiểu",
    "price_max": "Giá tối đa",
    "available_now": "Đang nhận hàng",
    "sort": "Sắp xếp",
    "sort_price_asc": "Giá: thấp đến cao",
    "sort_price_desc": "Giá: cao đến thấp",
    "sort_newest": "Mới nhất",
    "clear_all": "Xóa tất cả",
    "active_filters": "Bộ lọc đang dùng"
  },
  "store": {
    "active_listings": "Sản phẩm đang bán",
    "no_listings": "Hiện không có sản phẩm nào",
    "view_store": "Xem cửa hàng",
    "rating": "Đánh giá",
    "no_rating_yet": "Chưa có đánh giá"
  }
  ```

- [ ] **Step 3: Update `firestore.rules` — add reviews block**

  Add inside `match /databases/{database}/documents { ... }` after the orders block:

  ```
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.rating is int
        && request.resource.data.rating >= 1
        && request.resource.data.rating <= 5;
      allow update, delete: if false;
    }
  ```

- [ ] **Step 4: Update `firestore.indexes.json` — add two review indexes**

  Add to the `"indexes"` array:

  ```json
  { "collectionGroup": "reviews", "queryScope": "COLLECTION", "fields": [{"fieldPath":"listingId","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
  { "collectionGroup": "reviews", "queryScope": "COLLECTION", "fields": [{"fieldPath":"vendorId","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
  { "collectionGroup": "listings", "queryScope": "COLLECTION", "fields": [{"fieldPath":"vendorId","order":"ASCENDING"},{"fieldPath":"status","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]}
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/locales/en/translation.json src/locales/vi/translation.json firestore.rules firestore.indexes.json
  git commit -m "feat: add i18n keys for D1-D4, reviews Firestore rules and indexes"
  ```

---

## Task 6: Create StarRating component

**Files:**
- Create: `src/components/shared/StarRating.tsx`
- Create: `src/components/shared/StarRating.test.tsx`

- [ ] **Step 1: Write the failing test `src/components/shared/StarRating.test.tsx`**

  ```tsx
  import { describe, test, expect, vi } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'
  import { StarRating } from './StarRating'

  describe('StarRating', () => {
    test('renders 5 star buttons', () => {
      render(<StarRating value={0} />)
      expect(screen.getAllByRole('button')).toHaveLength(5)
    })

    test('each star has an aria-label', () => {
      render(<StarRating value={0} />)
      expect(screen.getByLabelText('1 star')).toBeInTheDocument()
      expect(screen.getByLabelText('5 star')).toBeInTheDocument()
    })

    test('calls onChange with star number when clicked', () => {
      const onChange = vi.fn()
      render(<StarRating value={0} onChange={onChange} />)
      fireEvent.click(screen.getByLabelText('3 star'))
      expect(onChange).toHaveBeenCalledWith(3)
    })

    test('does not call onChange when no handler provided (display mode)', () => {
      render(<StarRating value={3} />)
      fireEvent.click(screen.getByLabelText('1 star'))
      // no error thrown — buttons are disabled
    })
  })
  ```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

  ```bash
  npm test -- StarRating
  ```

  Expected: `Error: Cannot find module './StarRating'`

- [ ] **Step 3: Create `src/components/shared/StarRating.tsx`**

  ```tsx
  interface StarRatingProps {
    value: number
    onChange?: (rating: number) => void
    size?: 'sm' | 'md' | 'lg'
  }

  export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
    const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-xl'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            disabled={!onChange}
            aria-label={`${star} star`}
            className={`${sizeClass} transition-colors ${
              star <= value ? 'text-yellow-400' : 'text-slate-600'
            } ${onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
          >
            ★
          </button>
        ))}
      </div>
    )
  }
  ```

- [ ] **Step 4: Run test — expect PASS**

  ```bash
  npm test -- StarRating
  ```

  Expected: `✓ StarRating (4 tests)`

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/shared/StarRating.tsx src/components/shared/StarRating.test.tsx
  git commit -m "feat: add reusable StarRating component with tests"
  ```

---

## Task 7: D3 — Search + Filters on BrowsePage

**Files:**
- Modify: `src/pages/customer/BrowsePage.tsx`

- [ ] **Step 1: Replace the full contents of `src/pages/customer/BrowsePage.tsx`**

  ```tsx
  import { useEffect, useState } from 'react'
  import { useTranslation } from 'react-i18next'
  import { subscribeToActiveListings } from '../../services/listings'
  import { ListingCard } from '../../components/shared/ListingCard'
  import { filterListings, hasActiveFilters, DEFAULT_FILTERS } from '../../utils/filterListings'
  import type { Listing, ListingCategory } from '../../types'
  import type { FilterState } from '../../utils/filterListings'

  const CATEGORY_VALUES: (ListingCategory | 'all')[] = ['all', 'bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

  export default function BrowsePage() {
    const { t } = useTranslation()
    const [listings, setListings] = useState<Listing[]>([])
    const [category, setCategory] = useState<ListingCategory | 'all'>('all')
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

    useEffect(() => {
      const unsub = subscribeToActiveListings(data => {
        setListings(data)
        setLoading(false)
      })
      return unsub
    }, [])

    const categoryFiltered = category === 'all' ? listings : listings.filter(l => l.category === category)
    const displayed = filterListings(categoryFiltered, filters)
    const activeFilters = hasActiveFilters(filters)

    const clearAll = () => setFilters(DEFAULT_FILTERS)
    const clearFilter = (key: keyof FilterState) =>
      setFilters(f => ({ ...f, [key]: DEFAULT_FILTERS[key] }))

    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">{t('browse.title')}</h1>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORY_VALUES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {c === 'all' ? t('browse.all') : t(`categories.${c}`)}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder={t('filter.search_placeholder')}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="number"
              value={filters.minPrice}
              onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
              placeholder={t('filter.price_min')}
              className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-500 text-sm">—</span>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
              placeholder={t('filter.price_max')}
              className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="flex items-center gap-2 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={filters.availableNow}
                onChange={e => setFilters(f => ({ ...f, availableNow: e.target.checked }))}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-slate-300 text-sm">{t('filter.available_now')}</span>
            </label>
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
              className="ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">{t('filter.sort_newest')}</option>
              <option value="price_asc">{t('filter.sort_price_asc')}</option>
              <option value="price_desc">{t('filter.sort_price_desc')}</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters && (
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-slate-500 text-xs">{t('filter.active_filters')}:</span>
            {filters.search && (
              <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                "{filters.search}" <button onClick={() => clearFilter('search')} className="hover:text-white">×</button>
              </span>
            )}
            {filters.minPrice && (
              <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                ≥{Number(filters.minPrice).toLocaleString('vi-VN')}đ <button onClick={() => clearFilter('minPrice')} className="hover:text-white">×</button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                ≤{Number(filters.maxPrice).toLocaleString('vi-VN')}đ <button onClick={() => clearFilter('maxPrice')} className="hover:text-white">×</button>
              </span>
            )}
            {filters.availableNow && (
              <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                {t('filter.available_now')} <button onClick={() => clearFilter('availableNow')} className="hover:text-white">×</button>
              </span>
            )}
            {filters.sort !== 'newest' && (
              <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                {t(`filter.sort_${filters.sort}`)} <button onClick={() => clearFilter('sort')} className="hover:text-white">×</button>
              </span>
            )}
            <button onClick={clearAll} className="text-slate-500 hover:text-white text-xs ml-1 underline">
              {t('filter.clear_all')}
            </button>
          </div>
        )}

        {loading && <p className="text-slate-400">{t('browse.loading')}</p>}
        {!loading && displayed.length === 0 && <p className="text-slate-400">{t('browse.noListings')}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Run all tests — must still pass**

  ```bash
  npm test
  ```

  Expected: all existing tests still pass

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/customer/BrowsePage.tsx
  git commit -m "feat: D3 — add search, price range, availability filter, and sort to BrowsePage"
  ```

---

## Task 8: D2 — Review form on OrderDetailPage

**Files:**
- Modify: `src/pages/customer/OrderDetailPage.tsx`

- [ ] **Step 1: Add review state + fetch logic**

  Add these imports at the top of the file (after existing imports):

  ```tsx
  import { getReviewForOrder, submitReview } from '../../services/reviews'
  import { useAuth } from '../../contexts/AuthContext'
  import { StarRating } from '../../components/shared/StarRating'
  ```

  Add these state declarations inside `OrderDetailPage` (after the existing `const [switching, setSwitching] = useState(false)` line):

  ```tsx
  const { currentUser } = useAuth()
  const [hasReview, setHasReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  ```

  Add this `useEffect` after the existing order subscription `useEffect`:

  ```tsx
  useEffect(() => {
    if (!id || !order || order.status !== 'picked_up') return
    getReviewForOrder(id).then(r => setHasReview(r !== null)).catch(() => {})
  }, [id, order?.status])
  ```

  Add this handler function (after `handleSwitchPayment`):

  ```tsx
  const handleSubmitReview = async () => {
    if (!order || !currentUser || rating === 0) return
    setReviewSubmitting(true)
    try {
      await submitReview({
        orderId: order.id,
        listingId: order.listingId,
        vendorId: order.vendorId,
        customerId: currentUser.uid,
        rating,
        comment: comment.slice(0, 300),
      })
      setReviewSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setReviewSubmitting(false)
    }
  }
  ```

- [ ] **Step 2: Add review form UI block**

  In the JSX, after the `{isPickedUp && ( ... )}` block, add:

  ```tsx
  {/* Review form — shown after pickup, once per order */}
  {isPickedUp && !hasReview && !reviewSubmitted && (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-3">{t('review.leave_review')}</h3>
      <div className="mb-3">
        <p className="text-slate-400 text-sm mb-2">{t('review.rating')}</p>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        maxLength={300}
        placeholder={t('review.comment_placeholder')}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <p className="text-slate-600 text-xs mt-1 text-right">{comment.length}/300</p>
      <button
        onClick={handleSubmitReview}
        disabled={rating === 0 || reviewSubmitting}
        className="mt-3 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {reviewSubmitting ? t('review.submitting') : t('review.submit')}
      </button>
    </div>
  )}

  {/* After review submitted */}
  {isPickedUp && (hasReview || reviewSubmitted) && (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
      <p className="text-green-400 text-sm">⭐ {t('review.thanks')}</p>
    </div>
  )}
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/customer/OrderDetailPage.tsx
  git commit -m "feat: D2 — add review form to OrderDetailPage (shown after pickup)"
  ```

---

## Task 9: D2/D4 — Review display on ListingDetailPage + store link

**Files:**
- Modify: `src/pages/customer/ListingDetailPage.tsx`

- [ ] **Step 1: Add imports**

  Add to the existing imports block:

  ```tsx
  import { Link } from 'react-router-dom'
  import { getReviewsForListing } from '../../services/reviews'
  import { StarRating } from '../../components/shared/StarRating'
  import type { Review } from '../../types'
  ```

- [ ] **Step 2: Add reviews state + fetch**

  Add after `const [error, setError] = useState('')`:

  ```tsx
  const [reviews, setReviews] = useState<Review[]>([])
  ```

  Add a new `useEffect` after the existing listing-fetch `useEffect`:

  ```tsx
  useEffect(() => {
    if (!id) return
    getReviewsForListing(id).then(setReviews).catch(() => {})
  }, [id])
  ```

- [ ] **Step 3: Add average rating computation**

  Add after the `const isSoldOut` line:

  ```tsx
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0
  ```

- [ ] **Step 4: Add vendor store link + reviews section to the JSX**

  After the closing `<div className="grid grid-cols-2 gap-3 text-sm">` block (after the 4 info grid items), add:

  ```tsx
  {/* Vendor link (D4) */}
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-400">{t('auth.vendor')}</span>
    <Link
      to={`/store/${listing.vendorId}`}
      className="text-indigo-400 hover:text-indigo-300 text-sm"
    >
      {t('store.view_store')} →
    </Link>
  </div>

  {/* Reviews section (D2) */}
  <div className="border-t border-slate-800 pt-4">
    <div className="flex items-center gap-2 mb-3">
      {avgRating > 0 ? (
        <>
          <StarRating value={Math.round(avgRating)} size="sm" />
          <span className="text-white font-medium text-sm">{avgRating}</span>
          <span className="text-slate-500 text-xs">{t('review.out_of_5')} ({reviews.length} {t('review.avg_rating')})</span>
        </>
      ) : (
        <span className="text-slate-500 text-sm">{t('review.no_reviews')}</span>
      )}
    </div>
    {reviews.map(r => (
      <div key={r.id} className="bg-slate-800 rounded-lg p-3 mb-2">
        <StarRating value={r.rating} size="sm" />
        {r.comment && <p className="text-slate-300 text-sm mt-1">{r.comment}</p>}
      </div>
    ))}
  </div>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/customer/ListingDetailPage.tsx
  git commit -m "feat: D2/D4 — add review display and vendor store link to ListingDetailPage"
  ```

---

## Task 10: D4 — VendorStorePage + route + ListingCard link

**Files:**
- Create: `src/pages/customer/VendorStorePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/shared/ListingCard.tsx`

- [ ] **Step 1: Create `src/pages/customer/VendorStorePage.tsx`**

  ```tsx
  import { useEffect, useState } from 'react'
  import { useParams, Link } from 'react-router-dom'
  import { useTranslation } from 'react-i18next'
  import { getUserProfile } from '../../services/auth'
  import { getActiveListingsByVendor } from '../../services/listings'
  import { getAggregateRatingForVendor } from '../../services/reviews'
  import { ListingCard } from '../../components/shared/ListingCard'
  import { StarRating } from '../../components/shared/StarRating'
  import type { UserProfile, Listing } from '../../types'

  export default function VendorStorePage() {
    const { t } = useTranslation()
    const { vendorId } = useParams<{ vendorId: string }>()
    const [vendor, setVendor] = useState<UserProfile | null>(null)
    const [listings, setListings] = useState<Listing[]>([])
    const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (!vendorId) return
      Promise.all([
        getUserProfile(vendorId),
        getActiveListingsByVendor(vendorId),
        getAggregateRatingForVendor(vendorId),
      ]).then(([profile, activeListings, agg]) => {
        setVendor(profile)
        setListings(activeListings)
        setRating(agg)
      }).catch(() => {}).finally(() => setLoading(false))
    }, [vendorId])

    if (loading) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">{t('browse.loading')}</p>
      </div>
    )

    if (!vendor) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Store not found.</p>
      </div>
    )

    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/browse" className="text-slate-400 hover:text-white text-sm mb-6 block">
            ← {t('browse.title')}
          </Link>

          {/* Vendor header */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">{vendor.storeName}</h1>
            {vendor.address && (
              <p className="text-slate-400 text-sm mb-2">📍 {vendor.address}</p>
            )}
            {vendor.storeDescription && (
              <p className="text-slate-300 text-sm mb-3">{vendor.storeDescription}</p>
            )}
            <div className="flex items-center gap-2">
              {rating.count > 0 ? (
                <>
                  <StarRating value={Math.round(rating.avg)} size="sm" />
                  <span className="text-white text-sm font-medium">{rating.avg}</span>
                  <span className="text-slate-500 text-xs">
                    {t('review.out_of_5')} ({rating.count} {t('review.avg_rating')})
                  </span>
                </>
              ) : (
                <span className="text-slate-500 text-sm">{t('store.no_rating_yet')}</span>
              )}
            </div>
          </div>

          {/* Active listings */}
          <h2 className="text-white font-semibold mb-4">{t('store.active_listings')}</h2>
          {listings.length === 0 ? (
            <p className="text-slate-500">{t('store.no_listings')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Register route in `src/App.tsx`**

  Add import at the top with other page imports:

  ```tsx
  import VendorStorePage from './pages/customer/VendorStorePage'
  ```

  Add route inside `<Routes>` just before the `<Route path="/" ...>` catch-all line:

  ```tsx
  <Route path="/store/:vendorId" element={<VendorStorePage />} />
  ```

- [ ] **Step 3: Add "View store" link to `src/components/shared/ListingCard.tsx`**

  Add `import { Link } from 'react-router-dom'` if not already imported (it already is via wrapping Link). The outer `<Link to={href}>` wraps the card — we need a nested link for "view store". Use `e.stopPropagation()` to prevent navigation conflict.

  Replace the `<p className="text-slate-500 text-xs mt-1 truncate">Pickup {pickup}</p>` line with:

  ```tsx
  <div className="flex items-center justify-between mt-1">
    <p className="text-slate-500 text-xs truncate">Pickup {pickup}</p>
    <Link
      to={`/store/${listing.vendorId}`}
      onClick={e => e.stopPropagation()}
      className="text-indigo-500 hover:text-indigo-400 text-xs shrink-0 ml-2"
    >
      {/* store link — uses i18n key added in task 5 */}
      ↗
    </Link>
  </div>
  ```

- [ ] **Step 4: Run all tests — must still pass**

  ```bash
  npm test
  ```

  Expected: all tests pass

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/customer/VendorStorePage.tsx src/App.tsx src/components/shared/ListingCard.tsx
  git commit -m "feat: D4 — add public VendorStorePage, route, and store link on ListingCard"
  ```

---

## Task 11: D1 — Analytics tab on VendorDashboardPage

**Files:**
- Modify: `src/pages/vendor/VendorDashboardPage.tsx`

- [ ] **Step 1: Install recharts**

  ```bash
  npm install recharts
  ```

  Expected: `added N packages`

- [ ] **Step 2: Add tab state + analytics imports to `src/pages/vendor/VendorDashboardPage.tsx`**

  Add to the existing imports at the top:

  ```tsx
  import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
  import { getRevenueByDay, getOrdersByCategory, getTopListing } from '../../utils/analytics'
  ```

  Add tab state inside the component (after the existing `useState` declarations):

  ```tsx
  const [tab, setTab] = useState<'overview' | 'analytics'>('overview')
  ```

- [ ] **Step 3: Replace the JSX return in `VendorDashboardPage`**

  Replace the entire `return (` block with:

  ```tsx
  const revenueData = getRevenueByDay(orders)
  const categoryData = getOrdersByCategory(orders, listings)
  const topListing = getTopListing(orders, listings)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">{t('vendor.dashboard')}</h1>
      <p className="text-slate-400 mb-6">{t('vendor.welcome')}, {userProfile?.displayName}</p>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          {t('analytics.overview')}
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          {t('analytics.tab')}
        </button>
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label={t('vendor.activeListings')} value={activeListings} />
            <StatCard label={t('vendor.pendingPickups')} value={pendingOrders.length} sub={t('vendor.awaitingQR')} />
            <StatCard label={t('vendor.totalRevenue')} value={`${revenue.toLocaleString('vi-VN')} đ`} />
          </div>

          <div className="mb-8">
            <h2 className="text-white font-semibold mb-3">{t('vendor.recentOrders')}</h2>
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 text-sm">
                <span className="text-white">{o.listingTitle}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  o.status === 'paid' ? 'bg-green-900 text-green-300'
                  : o.status === 'picked_up' ? 'bg-slate-700 text-slate-300'
                  : o.status === 'pending_cod' ? 'bg-orange-900 text-orange-300'
                  : o.status === 'pending_bank_transfer' ? 'bg-blue-900 text-blue-300'
                  : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {o.status === 'pending_cod' ? 'COD' : o.status === 'pending_bank_transfer' ? 'BANK' : o.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {orders.length === 0 && <p className="text-slate-500 text-sm">{t('vendor.noOrders')}</p>}
          </div>

          {/* Bank account info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-semibold">{t('vendor.bankInfo')}</h2>
              {!editingBank && (
                <button onClick={() => setEditingBank(true)} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  {t('vendor.editBankInfo')}
                </button>
              )}
            </div>
            <p className="text-slate-500 text-xs mb-4">{t('vendor.bankInfoSub')}</p>

            {!editingBank ? (
              userProfile?.bankAccount ? (
                <div className="space-y-2 text-sm">
                  {userProfile.bankName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('vendor.bankName')}</span>
                      <span className="text-white">{userProfile.bankName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('vendor.bankAccount')}</span>
                    <span className="text-white font-mono font-bold">{userProfile.bankAccount}</span>
                  </div>
                  {userProfile.bankAccountName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('vendor.bankAccountName')}</span>
                      <span className="text-white">{userProfile.bankAccountName}</span>
                    </div>
                  )}
                  {userProfile.bankBin && (
                    <p className="text-green-400 text-xs pt-1">✓ VietQR enabled — customers can pay with one tap</p>
                  )}
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">{t('vendor.bankInfoNotSet')}</p>
              )
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">{t('vendor.bankName')}</Label>
                  <select
                    value={selectedBin}
                    onChange={e => setSelectedBin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Chọn ngân hàng —</option>
                    {VIETNAMESE_BANKS.map(b => (
                      <option key={b.bin} value={b.bin}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">{t('vendor.bankAccount')}</Label>
                  <Input
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    placeholder="Số tài khoản"
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">{t('vendor.bankAccountName')}</Label>
                  <Input
                    value={bankAccountName}
                    onChange={e => setBankAccountName(e.target.value)}
                    placeholder="Tên chủ tài khoản"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleBankSave}
                    disabled={bankSaving || !selectedBin || !bankAccount}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                  >
                    {bankSaving ? t('vendor.saving') : t('vendor.saveBankInfo')}
                  </Button>
                  <Button
                    onClick={() => setEditingBank(false)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                  >
                    {t('vendor.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Top listing */}
          {topListing ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-400 text-sm mb-1">{t('analytics.top_listing')}</p>
              <p className="text-white text-lg font-bold">{topListing.listing.title}</p>
              <p className="text-indigo-400 font-medium">{topListing.revenue.toLocaleString('vi-VN')} đ</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-sm">{t('analytics.no_data')}</p>
            </div>
          )}

          {/* Revenue line chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-white font-semibold mb-4">{t('analytics.revenue_chart')}</p>
            {revenueData.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#818cf8' }}
                    formatter={(v: number) => [`${v.toLocaleString('vi-VN')} đ`, '']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">{t('analytics.no_data')}</p>
            )}
          </div>

          {/* Orders by category bar chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-white font-semibold mb-4">{t('analytics.orders_by_category')}</p>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">{t('analytics.no_data')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
  ```

- [ ] **Step 4: Run all tests — must still pass**

  ```bash
  npm test
  ```

  Expected: all tests pass

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/vendor/VendorDashboardPage.tsx package.json package-lock.json
  git commit -m "feat: D1 — add Analytics tab with Recharts line and bar charts to VendorDashboardPage"
  ```

---

## Task 12: Deploy Firestore rules + indexes

- [ ] **Step 1: Deploy updated Firestore rules and indexes**

  ```bash
  firebase deploy --only firestore:rules,firestore:indexes
  ```

  Expected: `✔ Deploy complete!`

- [ ] **Step 2: Manual smoke test — D3 (Search + Filters)**

  1. Log in as customer → Browse page
  2. Type "bánh" in search box — only bakery listings appear
  3. Set min price 40000 — expensive listings only
  4. Toggle "Available now" — confirm expired listings disappear
  5. Change sort to "Price: low to high" — cheapest first
  6. Check active filter chips appear and × clears each one
  7. "Clear all" resets everything

- [ ] **Step 3: Manual smoke test — D2 (Reviews)**

  1. Log in as customer → find a `picked_up` order in My Orders
  2. Open order detail → review form appears below the ✅ card
  3. Click 4 stars → submit → "Thanks for your review!" appears
  4. Reload page → review form no longer appears (already reviewed)
  5. Go to the listing → star rating and comment appear

- [ ] **Step 4: Manual smoke test — D4 (Store Page)**

  1. On any listing card, click the ↗ link → `/store/:vendorId` loads
  2. Vendor name, description, address, rating, and active listings shown
  3. Direct URL in incognito (no auth) → page still loads (public route)
  4. Click listing card on store page → goes to listing detail

- [ ] **Step 5: Manual smoke test — D1 (Analytics)**

  1. Log in as vendor → Dashboard → click "Analytics" tab
  2. Line chart shows 7-day revenue (flat if no recent orders)
  3. Bar chart shows category breakdown
  4. Top listing card shows highest-revenue listing
  5. Click "Overview" tab → original dashboard content unchanged

- [ ] **Step 6: Final commit with progress update**

  Update `progress.md` — add a new section:

  ```markdown
  ## Extensions (2026-06-19)

  | Feature | Status |
  |---|---|
  | D1 — Vendor Analytics (Recharts tab) | ✅ Complete |
  | D2 — Customer Reviews & Ratings | ✅ Complete |
  | D3 — Search + Advanced Filters | ✅ Complete |
  | D4 — Vendor Public Store Page | ✅ Complete |
  ```

  ```bash
  git add progress.md
  git commit -m "chore: mark D1-D4 extensions complete in progress.md"
  ```
