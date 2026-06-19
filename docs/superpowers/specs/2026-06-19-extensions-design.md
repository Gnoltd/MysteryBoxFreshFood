# MysteryBox — Extensions Design Spec
**Date:** 2026-06-19  
**Status:** Approved  
**Extends:** `docs/superpowers/specs/2026-06-17-mysterybox-design.md`

---

## Overview

Four extensions to the completed MysteryBox app. All build on the existing stack (React + Vite + TypeScript + Firebase + Tailwind + shadcn/ui) with no new Cloud Functions required except Firestore rules for the new `reviews` collection.

| ID | Feature | Scope |
|---|---|---|
| D1 | Vendor Analytics Charts | VendorDashboardPage — new Analytics tab |
| D2 | Customer Reviews & Ratings | New `reviews` Firestore collection, OrderDetailPage, ListingDetailPage, StorePage |
| D3 | Search + Advanced Filters | BrowsePage client-side filtering |
| D4 | Vendor Public Store Page | New `/store/:vendorId` public route |

---

## D1 — Vendor Analytics Charts

### Where
`VendorDashboardPage` gets a tab switcher at the top:
- **Overview tab** — existing stat cards, unchanged
- **Analytics tab** — new charts section

### Analytics Tab Content
- **Line chart** — revenue per day, last 7 days (`recharts` `LineChart`)
- **Bar chart** — order count by category (`recharts` `BarChart`)
- **Top listing card** — highest-revenue listing this week

### Data Source
Query `orders` where `vendorId == uid` and `status` in `["paid", "picked_up"]`. All client-side computation — no new Cloud Functions or Firestore indexes needed.

### New Dependency
`recharts` (MIT license)

### New i18n Keys
```
analytics.tab
analytics.revenue_chart
analytics.orders_by_category
analytics.top_listing
analytics.no_data
```

---

## D2 — Customer Reviews & Ratings

### New Firestore Collection: `reviews/{reviewId}`
```
orderId       string      ← enforces one review per order
listingId     string
vendorId      string
customerId    string
rating        number      (1–5)
comment       string      (optional, max 300 chars)
createdAt     timestamp
```

### Review Submission
- **Where:** `OrderDetailPage`
- **Condition:** shown only when `order.status == "picked_up"` and no review exists for that `orderId`
- **UI:** Star rating widget (1–5) + optional comment textarea + submit button
- **After submit:** form replaced with static "Thanks for your review!" — no editing allowed

### Review Display
- `ListingDetailPage` — average star rating badge + up to 5 most recent comments
- `VendorStorePage` (D4) — aggregate rating across all vendor listings

### New Service
`src/services/reviews.ts`
- `submitReview(review)` — writes to `reviews/` collection
- `getReviewsForListing(listingId)` — ordered by `createdAt` desc, limit 5
- `getAggregateRatingForVendor(vendorId)` — averages all ratings for a vendor

### Firestore Rules
- Write: `customerId == request.auth.uid` (customer owns the order)
- Read: public (anyone can read reviews)

### New i18n Keys
```
review.leave_review
review.rating
review.comment_placeholder
review.submit
review.thanks
review.avg_rating
review.no_reviews
review.out_of_5
```

---

## D3 — Search + Advanced Filters on BrowsePage

### Approach
Client-side filtering of the already-loaded listings array. No new Firestore queries or indexes. `getActiveListings()` service call unchanged.

### Filter Controls (added above listing grid)
| Control | Type | Behavior |
|---|---|---|
| Search bar | Text input | Case-insensitive match on `title` and `description` |
| Price range | Two number inputs (min / max VND) | Empty = no limit |
| Available now | Toggle switch | `pickupStart ≤ now ≤ pickupEnd` |
| Category | Existing chips | Keep as-is |
| Sort | Dropdown | Price low→high, Price high→low, Newest first (default) |

### Active Filters UX
Chip row below controls when any non-default filter is active. Each chip has × to clear that filter. "Clear all" button resets everything.

### New i18n Keys
```
filter.search_placeholder
filter.price_min
filter.price_max
filter.available_now
filter.sort
filter.sort_price_asc
filter.sort_price_desc
filter.sort_newest
filter.clear_all
filter.active_filters
```

---

## D4 — Vendor Public Store Page

### Route
`/store/:vendorId` — public, no authentication required, shareable URL.

### Page Content
1. **Vendor header** — `storeName`, `storeDescription`, `address`, aggregate star rating from D2
2. **Active listings grid** — existing `ListingCard` components filtered by `vendorId`
3. **Empty state** — message when vendor has no active listings

### Entry Points
- `ListingDetailPage` — vendor name becomes a `<Link>` to `/store/:vendorId`
- `ListingCard` — small "View store" link below vendor name

### Data Fetching
- `getUserProfile(vendorId)` — existing call to `users/{uid}`
- `getActiveListingsByVendor(vendorId)` — new filter added to `src/services/listings.ts` (Firestore query: `vendorId == vendorId` + `status == "active"`)
- `getAggregateRatingForVendor(vendorId)` — from D2 reviews service

### New File
`src/pages/customer/VendorStorePage.tsx`

### New Route (in App.tsx)
`/store/:vendorId` — wrapped in `CustomerLayout`, no `RoleRoute` guard (public)

### New i18n Keys
```
store.active_listings
store.no_listings
store.view_store
store.rating
store.no_rating_yet
```

---

## Firestore Schema Changes

### New Collection
```
reviews/{reviewId}
  orderId       string
  listingId     string
  vendorId      string
  customerId    string
  rating        number
  comment       string
  createdAt     timestamp
```

### New Firestore Index
`reviews` collection: `vendorId ASC, createdAt DESC` (for vendor aggregate queries)  
`reviews` collection: `listingId ASC, createdAt DESC` (for listing review display)

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/services/reviews.ts` | Reviews CRUD |
| `src/pages/customer/VendorStorePage.tsx` | D4 store page |

## Modified Files Summary

| File | Change |
|---|---|
| `src/pages/vendor/VendorDashboardPage.tsx` | Add tab switcher + Analytics tab with Recharts |
| `src/pages/customer/BrowsePage.tsx` | Add search bar, filters, sort (D3) |
| `src/pages/customer/OrderDetailPage.tsx` | Add review form (D2) |
| `src/pages/customer/ListingDetailPage.tsx` | Add review display + store link (D2, D4) |
| `src/components/shared/ListingCard.tsx` | Add "View store" link (D4) |
| `src/App.tsx` | Add `/store/:vendorId` route |
| `firestore.rules` | Add `reviews` collection rules |
| `firestore.indexes.json` | Add two new composite indexes |
| `src/locales/en/translation.json` | New keys for D1–D4 |
| `src/locales/vi/translation.json` | New keys for D1–D4 |

---

## What Is NOT Changing

- Cloud Functions — no new functions needed
- Auth flow — no changes
- Orders flow — Stripe/COD/VietQR unchanged
- QR pickup flow — unchanged
- Vendor listings CRUD — unchanged
