# MysteryBox — Design Spec
**Date:** 2026-06-17  
**Status:** Approved  
**Stack:** React + Vite + TypeScript · Firebase Auth + Firestore + Cloud Functions · Stripe test mode

---

## 1. Overview

MysteryBox is an F&B surplus management app connecting food vendors with customers who want to buy discounted end-of-day surplus as mystery boxes. Vendors list surplus food; customers browse, purchase via Stripe Checkout, and collect with a QR code the vendor scans at pickup.

---

## 2. Architecture

### Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| Backend functions | Firebase Cloud Functions (Node.js) |
| Payments | Stripe Checkout (test mode) |
| Routing | React Router v6 |
| i18n | react-i18next (EN + VI) |
| QR display | qrcode.react |
| QR scanning | html5-qrcode |

### Key Invariants

- **Orders are created server-side only.** The `createCheckoutSession` Cloud Function creates the pending order; the `stripeWebhook` function sets it to `"paid"`. The client never writes order status.
- **Stock is decremented by the webhook**, not by the client, preventing overselling under concurrent purchases.
- **QR pickup is validated against `vendorId`** — a vendor can only mark pickup for their own orders.

---

## 3. Data Model

### `users/{uid}`
```
role             "vendor" | "customer"
displayName      string
email            string
lang             "en" | "vi"
// vendor only:
storeName        string
address          string
storeDescription string
```

### `listings/{listingId}`
```
vendorId         string
type             "mystery_box" | "item"
title            string
description      string
price            number  (VND)
originalPrice    number  (VND)
quantityTotal    number
quantityRemaining number  ← decremented via transaction
pickupStart      timestamp
pickupEnd        timestamp
category         string
imageUrl         string
status           "active" | "sold_out" | "expired"
stripeProductId  string
stripePriceId    string
```

### `orders/{orderId}`
```
customerId       string
vendorId         string
listingId        string
listingTitle     string
quantity         number
totalPrice       number  (VND)
status           "pending" | "paid" | "picked_up" | "cancelled"
qrCode           string  (UUID v4 — the scannable value)
stripeSessionId  string
createdAt        timestamp
```

---

## 4. Page Structure & Routing

### Auth (public, no nav)
| Route | Page |
|---|---|
| `/login` | Login form |
| `/register` | Register form — role selector (vendor / customer) |

### Customer layout (top nav + language toggle)
| Route | Page |
|---|---|
| `/browse` | Listings feed with `FilterBar` |
| `/listing/:id` | Listing detail + `CheckoutButton` |
| `/checkout/success` | Stripe return — polls order until `"paid"`, then navigates to `/orders/:id` |
| `/checkout/cancel` | Stripe cancel return |
| `/orders` | Order history list |
| `/orders/:id` | Order detail with `QRCodeDisplay` |

### Vendor layout (sidebar nav + language toggle)
| Route | Page |
|---|---|
| `/vendor` | Dashboard — stat cards (revenue, active listings, pending orders) |
| `/vendor/listings` | Listings table with edit/delete |
| `/vendor/listings/new` | Create listing form |
| `/vendor/listings/:id/edit` | Edit listing form |
| `/vendor/orders` | Incoming orders table |
| `/vendor/scan` | QR scanner — camera → validate → mark `"picked_up"` |

### Route guards
- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `RoleRoute` — redirects vendors accessing customer routes and vice versa

---

## 5. Component & Service Architecture

### Source layout
```
src/
  locales/
    en/translation.json
    vi/translation.json
  firebase.ts          ← Firebase app init
  services/
    auth.ts            ← signIn, signUp, signOut
    listings.ts        ← CRUD + onSnapshot
    orders.ts          ← onSnapshot, status helpers
    stripe.ts          ← calls createCheckoutSession Cloud Fn
  contexts/
    AuthContext.tsx    ← current user + role
  components/
    shared/
      ProtectedRoute.tsx
      RoleRoute.tsx
      ListingCard.tsx
      LoadingSpinner.tsx
      ErrorMessage.tsx
      LanguageToggle.tsx
    layouts/
      AuthLayout.tsx
      CustomerLayout.tsx
      VendorLayout.tsx
  pages/
    auth/
      LoginPage.tsx
      RegisterPage.tsx
    customer/
      BrowsePage.tsx
      ListingDetailPage.tsx
      CheckoutSuccessPage.tsx
      CheckoutCancelPage.tsx
      OrdersPage.tsx
      OrderDetailPage.tsx
    vendor/
      VendorDashboardPage.tsx
      ListingsPage.tsx
      ListingFormPage.tsx
      VendorOrdersPage.tsx
      QRScanPage.tsx

functions/
  src/
    index.ts           ← exports createCheckoutSession + stripeWebhook
    createCheckoutSession.ts
    stripeWebhook.ts
```

### Service layer rule
Components never import the Firebase SDK directly — they call service functions. This keeps Firebase swappable and keeps components testable.

---

## 6. Data Flows

### Purchase flow
1. Customer clicks "Buy" on `ListingDetailPage`
2. `stripe.createCheckoutSession(listingId, qty)` calls Cloud Function
3. Cloud Function: checks `quantityRemaining ≥ qty` (transaction), creates Stripe Checkout session, writes `orders/{id}` with status `"pending"` + `stripeSessionId`, returns session URL
4. Browser redirects to Stripe Checkout; customer enters test card `4242 4242 4242 4242`
5. `stripeWebhook` fires: verifies Stripe signature, finds order by `stripeSessionId`, sets status → `"paid"`, decrements `quantityRemaining`
6. Stripe redirects to `/checkout/success`; page uses `onSnapshot` to wait for `"paid"` status, then navigates to `/orders/:id` with QR code

### QR pickup flow
1. Vendor opens `/vendor/scan`; `html5-qrcode` activates device camera
2. Customer shows QR code from `/orders/:id`
3. QR decoded as UUID → Firestore query: `qrCode == uuid AND vendorId == currentUser.uid AND status == "paid"`
4. Match found → update status to `"picked_up"`, show confirmation
5. No match → inline error: "Invalid or already used QR code", camera stays open

### Error handling
| Scenario | Handling |
|---|---|
| Out of stock at checkout | Cloud Fn returns error → client shows "Sold out" toast, disables button |
| Stripe payment fails | Stripe redirects to `/checkout/cancel`; pending order remains (no cleanup needed for prototype) |
| Invalid / used QR | Inline error in scanner UI; camera stays open for retry |
| Auth errors | Inline form errors |
| Firestore errors | Toast via `useToast` hook |

---

## 7. i18n (EN/VI)

- `react-i18next` with `i18next`
- Translation files: `src/locales/en/translation.json` and `src/locales/vi/translation.json`
- Language toggle in header of both `CustomerLayout` and `VendorLayout`
- Preference saved to `users/{uid}.lang` in Firestore, loaded on login
- Fallback to `navigator.language`, then `"en"`
- All user-visible strings use `t('key')` — no hardcoded text in components

---

## 8. UI Design

- **Theme:** Dark & Modern — dark slate background (`#0f172a` / `#1e293b`) with indigo/purple accents (`#6366f1` / `#a855f7`)
- **Component library:** shadcn/ui (built on Radix UI + Tailwind)
- **Currency display:** Vietnamese Dong (đ) formatted as `35.000 đ`
- **QR codes:** Generated by `qrcode.react`, displayed as SVG on order detail page

---

## 9. Testing Strategy

For the prototype, testing focuses on the two critical flows:
- **Purchase flow:** Stripe test mode with card `4242 4242 4242 4242`; use Stripe CLI (`stripe listen --forward-to`) to forward webhooks during development
- **QR pickup flow:** Manual testing with two browser windows (customer + vendor) or two devices
- **Stock safety:** Manually trigger concurrent purchases to verify transaction prevents overselling
