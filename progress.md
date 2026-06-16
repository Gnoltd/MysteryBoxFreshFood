# MysteryBox — Progress

## Current Phase: Implementation Complete

**Last updated:** 2026-06-17  
**Spec:** `docs/superpowers/specs/2026-06-17-mysterybox-design.md`  
**Plan:** `docs/superpowers/plans/2026-06-17-mysterybox-implementation.md`

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
