# MysteryBox — Progress

## Current Phase: Full Redesign + Subscriptions + Real-Time (Planning Complete)

**Last updated:** 2026-06-22  
**Spec:** `docs/superpowers/specs/2026-06-17-mysterybox-design.md`  
**Plan:** `docs/superpowers/plans/2026-06-17-mysterybox-implementation.md`
**Extensions spec:** `docs/superpowers/specs/2026-06-19-extensions-design.md`  
**Extensions plan:** `docs/superpowers/plans/2026-06-19-extensions-implementation.md`
**Improvements spec:** `docs/superpowers/specs/2026-06-21-improvements-design.md`  
**Improvements plan:** `docs/superpowers/plans/2026-06-21-improvements-implementation.md`
**UX + AI spec:** `docs/superpowers/specs/2026-06-21-ux-fixes-ai-composer-design.md`  
**UX + AI plan:** `docs/superpowers/plans/2026-06-21-ux-fixes-ai-composer-implementation.md`

**Redesign spec:** `docs/superpowers/specs/2026-06-21-redesign-subscriptions-realtime-design.md`  
**Redesign Plan 1 (Design System):** `docs/superpowers/plans/2026-06-22-redesign-p1-design-system.md`  
**Redesign Plan 2 (Customer Pages):** `docs/superpowers/plans/2026-06-22-redesign-p2-customer-pages.md`  
**Redesign Plan 3 (Subscriptions + Real-Time):** `docs/superpowers/plans/2026-06-22-redesign-p3-subscriptions-realtime.md`  
**Redesign Plan 4 (Vendor Pages):** `docs/superpowers/plans/2026-06-22-redesign-p4-vendor-pages.md`

---

## Status

| Phase | Status |
|---|---|
| Brainstorming & design | ✅ Complete |
| Implementation plan | ✅ Complete |
| Task 1 — Project scaffold (Vite + Firebase + Tailwind) | ✅ Complete |
| Task 2 — TypeScript types + Firestore rules | ✅ Complete |
| Task 3 — Auth service + AuthContext | ✅ Complete |
| Task 4 — React Router + route guards | ✅ Complete |
| Task 5 — Layouts (Auth, Customer, Vendor) | ✅ Complete |
| Task 6 — Auth pages (Login, Register) | ✅ Complete |
| Task 7 — Firestore services (listings, orders, storage) | ✅ Complete |
| Task 8 — Cloud Functions scaffold | ✅ Complete |
| Task 9 — createCheckoutSession Cloud Function | ✅ Complete |
| Task 10 — stripeWebhook Cloud Function | ✅ Complete |
| Task 11 — Customer: ListingCard + BrowsePage | ✅ Complete |
| Task 12 — Customer: ListingDetailPage + CheckoutButton | ✅ Complete |
| Task 13 — Customer: Checkout/Orders/QR pages | ✅ Complete |
| Task 14 — Vendor: Dashboard | ✅ Complete |
| Task 15 — Vendor: Listings CRUD | ✅ Complete |
| Task 16 — Vendor: Orders + QR scanner | ✅ Complete |
| Task 17 — i18n (EN/VI) | ✅ Complete |
| Task 18 — Final polish (storage rules, firebase.json) | ✅ Complete |

---

## What Was Built

Full functional prototype — all features complete:

**Customer side:**
- Register/login as customer
- Browse active surplus listings with category filter
- View listing detail with discount %, pickup window, remaining stock
- Purchase via Stripe Checkout (test mode: `4242 4242 4242 4242`)
- Real-time order confirmation after payment
- Order history with status badges
- QR code display on paid orders for pickup

**Vendor side:**
- Register/login as vendor (storeName required)
- Dashboard with revenue, active listings, pending pickups stats
- Create/edit/delete listings with Firebase Storage image upload
- Real-time orders list
- Camera QR scanner (`html5-qrcode`) to confirm pickups — validates `vendorId == currentUser.uid`

**Infrastructure:**
- Cloud Functions: `createCheckoutSession` (callable) + `stripeWebhook` (HTTP)
- Stripe webhook with Firestore transaction for atomic paid status + stock decrement
- QR redemption with Firestore transaction (no double-redemption race)
- Firestore composite indexes for all query patterns
- Storage rules scoped to `listings/{vendorId}/`
- EN/VI bilingual UI via react-i18next, language saved to Firestore

---

## Next Steps (User Must Complete)

1. **Fill in `.env.local`** with Firebase project credentials
2. **Set up Stripe test keys** in `functions/.runtimeconfig.json`
3. **Deploy Firestore rules:** `firebase deploy --only firestore:rules,firestore:indexes`
4. **Deploy functions:** `firebase deploy --only functions`
5. **Register Stripe webhook** in Stripe Dashboard → point to Cloud Function URL
6. **Test purchase flow** with Stripe CLI: `stripe listen --forward-to http://localhost:5001/{project}/us-central1/stripeWebhook`
7. **Full deploy:** `npm run build && firebase deploy`

---

## Key Decisions Made

- **Stack:** React + Vite + TypeScript + Firebase (Auth + Firestore + Functions + Storage) + Stripe test mode
- **Scope:** Full flow both sides — vendor dashboard + customer purchase flow
- **Payment:** Stripe Checkout test mode; webhook via Cloud Function sets order `"paid"`
- **UI:** Dark & Modern (slate + indigo/purple), Tailwind CSS + shadcn/ui
- **QR pickup:** Vendor camera scans customer QR; UUID validated against vendorId in Firestore transaction
- **i18n:** react-i18next, EN/VI toggle, preference saved to Firestore
- **stripeProductId/stripePriceId omitted** — prototype uses `price_data` at checkout time

---

## Extensions (2026-06-19)

| Feature | Status |
|---|---|
| D1 — Vendor Analytics tab (Recharts line + bar charts) | ✅ Complete |
| D2 — Customer Reviews & Ratings (StarRating, review form, display) | ✅ Complete |
| D3 — Search + Advanced Filters on BrowsePage | ✅ Complete |
| D4 — Vendor Public Store Page (`/store/:vendorId`) | ✅ Complete |

**New files:** `src/services/reviews.ts`, `src/utils/filterListings.ts`, `src/utils/analytics.ts`, `src/components/shared/StarRating.tsx`, `src/pages/customer/VendorStorePage.tsx`  
**New tests:** 22 tests total (filterListings: 10, analytics: 8, StarRating: 4)  
**New dependency:** `recharts`

---

## Market Improvements (2026-06-21)

| Feature | Status |
|---|---|
| E1 — Share QR proxy pickup (Web Share API + PNG download fallback) | ✅ Complete |
| E2 — Quick Create modal with AI quantity suggestion (suggestQuantity) | ✅ Complete |
| E3 — Food safety countdown badge (useCountdown hook) | ✅ Complete |
| E3 — packedAt field on listing form | ✅ Complete |
| E3 — pickupEnd denormalized onto order in createCheckoutSession | ✅ Complete |
| E3 — stripePaymentIntentId stored on order in stripeWebhook | ✅ Complete |
| E3 — autoRefundExpiredOrders scheduled Cloud Function | ✅ Complete |
| E3 — Firestore composite index (orders: status + pickupEnd) | ✅ Complete |
| fix — refunded status badge in OrdersPage + VendorOrdersPage | ✅ Complete |

**New files:** `src/utils/quickCreate.ts`, `src/utils/quickCreate.test.ts`, `src/hooks/useCountdown.ts`, `src/hooks/useCountdown.test.ts`, `functions/src/autoRefundExpiredOrders.ts`  
**New tests:** 12 new (quickCreate: 7, useCountdown: 5) → 34 total  
**Type additions:** `OrderStatus` += `'refunded'`, `Listing.packedAt?`, `Order.stripePaymentIntentId?`, `Order.pickupEnd?`

---

## UX Fixes + AI Box Composer (2026-06-21)

| Feature | Status |
|---|---|
| Fix A — ListingCard nested link bug (card click now navigates correctly) | ✅ Complete |
| Fix B — Image file preview in listing form (live preview on file select) | ✅ Complete |
| Fix C — Category expansion: 6 → 10 (added fruit, vegetables, dairy, meat) | ✅ Complete |
| Feature D — AI Box Composer modal (Gemini-powered, replaces Quick Create) | ✅ Complete |
| `composeMysteryBox` Cloud Function (Gemini 2.0 Flash Lite) | ✅ Complete |
| `src/services/ai.ts` service wrapper | ✅ Complete |

**New files:** `src/services/ai.ts`, `functions/src/composeMysteryBox.ts`  
**Modified:** `ListingCard.tsx`, `ListingFormPage.tsx`, `ListingsPage.tsx`, `BrowsePage.tsx`, `types.ts`, both locale files  
**AI API:** Google Gemini 2.0 Flash Lite — key stored via `firebase functions:config:set gemini.api_key`  
**New categories:** `fruit` · `vegetables` · `dairy` · `meat` (alongside existing 6)

### Smoke Tests
1. Browse → click listing card body → navigates to detail ✓
2. Vendor → New/Edit listing → pick image file → preview appears immediately ✓
3. Browse category chips show all 10 categories ✓
4. Vendor → Listings → "AI Box Composer" → add items → Compose → Gemini returns title/description/price → Publish → listing created ✓

---

## Full Redesign + Subscriptions + Real-Time (2026-06-22)

| Task | Status |
|---|---|
| Brainstorming & design | ✅ Complete |
| Plan Part 1 — Design System + Shared Components | ✅ Ready |
| Plan Part 2 — Customer Pages Redesign | ✅ Ready |
| Plan Part 3 — Subscriptions + Real-Time Backend | ✅ Ready |
| Plan Part 4 — Vendor Pages Redesign | ✅ Ready |
| Implementation | ⬜ Not started |

**Design files used:** `Design/mysterybox_marketplace/`, `Design/intelligent_vendor_core/`, `Design/mysterybox_browse/`, `Design/mysterybox_login/`, `Design/mysterybox_subscriptions/`, etc.

**New features:**
- Dark design system tokens (new Tailwind config + CSS utilities)
- 9 new shared components (GradientButton, GhostButton, MysteryCard, GlassNav, StatusChip, StockBadge, TimerBadge, StockProgressBar, NotificationPanel)
- Real-time stock via Firestore `onSnapshot` on BrowsePage + ListingDetailPage
- Live order status tracker on Success/OrderDetail pages
- Push notifications via Firebase Cloud Messaging (FCM)
- Follow vendor system (`follows/` collection)
- Stripe recurring subscriptions (`subscriptions/` collection)
- New SubscriptionsPage (`/subscriptions`)
- New Cloud Functions: `savePushToken`, `onListingPublished`, `createStripeSubscription`, `stripeSubscriptionWebhook`, `cancelSubscription`
