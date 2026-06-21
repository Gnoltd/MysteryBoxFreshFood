# MysteryBox — Session Context

Paste this at the start of any Claude CLI session to get full context instantly.

---

## What This App Is

A food surplus app for Hanoi F&B stores (AEON, Tour les Jours, etc.).
Vendors list end-of-day unsold food as discounted "mystery boxes" by category.
Customers browse, pay via Stripe, and collect with a QR code the vendor scans.

**Live stack:** React + Vite + TypeScript + Tailwind + shadcn/ui + Firebase (Auth, Firestore, Storage, Cloud Functions) + Stripe Checkout + react-i18next (EN/VI) + qrcode.react + html5-qrcode

---

## What Is Already Built (Do Not Rebuild)

- Auth: Firebase email/password, roles: "vendor" | "customer"
- Customer flow: Browse → ListingDetail → Stripe Checkout → QR code on order
- Vendor flow: Dashboard stats → CRUD listings with image upload → Orders list → Camera QR scanner
- Cloud Functions: `createCheckoutSession` (callable) + `stripeWebhook` (HTTP, Firestore transaction)
- i18n: EN/VI toggle, saved to Firestore `users/{uid}.lang`
- Atomic stock decrement inside `stripeWebhook` transaction
- QR pickup validates `vendorId == currentUser.uid` (no cross-vendor scan)

---

## Critical Rules (Never Break These)

1. Orders are NEVER written by the client — only by `createCheckoutSession` and `stripeWebhook`
2. Components NEVER import Firebase SDK directly — use `src/services/` only
3. Stock decrement happens in `stripeWebhook` Firestore transaction only
4. All UI strings use `t('key')` from react-i18next — no hardcoded text in components
5. Add new i18n keys to BOTH `src/locales/en/translation.json` AND `src/locales/vi/translation.json`

---

## Firestore Schema

```
users/{uid}         role, lang, storeName, address, storeDescription
listings/{id}       vendorId, type, price, quantityRemaining, category, imageUrl,
                    status ("active"|"closed"|"expired"), stripeProductId, stripePriceId
orders/{id}         status ("pending"→"paid"→"picked_up"), qrCode (UUID v4),
                    stripeSessionId, vendorId, customerId, listingId, quantity
```

---

## File Structure

```
src/
  locales/en/translation.json
  locales/vi/translation.json
  firebase.ts
  services/auth.ts · listings.ts · orders.ts · stripe.ts
  contexts/AuthContext.tsx
  components/shared/    ProtectedRoute, RoleRoute, ListingCard, LoadingSpinner, ErrorMessage, LanguageToggle
  components/layouts/   AuthLayout, CustomerLayout, VendorLayout
  pages/auth/           LoginPage, RegisterPage
  pages/customer/       BrowsePage, ListingDetailPage, CheckoutSuccessPage, CheckoutCancelPage, OrdersPage, OrderDetailPage
  pages/vendor/         VendorDashboardPage, ListingsPage, ListingFormPage, VendorOrdersPage, QRScanPage

functions/src/
  index.ts
  createCheckoutSession.ts
  stripeWebhook.ts
```

---

## Routes

| Role     | Routes |
|----------|--------|
| Public   | `/login`, `/register` |
| Customer | `/browse`, `/listing/:id`, `/checkout/success`, `/checkout/cancel`, `/orders`, `/orders/:id` |
| Vendor   | `/vendor`, `/vendor/listings`, `/vendor/listings/new`, `/vendor/listings/:id/edit`, `/vendor/orders`, `/vendor/scan` |

---

## UI Theme

Dark & Modern: `bg-slate-950` / `bg-slate-900` backgrounds, `indigo-500` / `purple-500` accents.
shadcn/ui components. Currency format: `35.000 đ` (Vietnamese Dong).

---

## What To Build Next

### Feature A — Waste Impact Counter
**Why:** Makes the app about sustainability, not just transactions. Strengthens the academic report.

Add `weightKg: number` field to listings Firestore schema.
Vendor sets estimated weight per box when creating a listing (e.g. 0.8kg).

Show on **CheckoutSuccessPage**:
```
"Đơn này giúp tiết kiệm ~0.8kg thực phẩm 🌱"
```

Show on **VendorDashboardPage** (new stat card):
```
"Tuần này: 12.4kg thực phẩm được cứu"
```

Show on **CustomerOrdersPage** (aggregate):
```
"Bạn đã cứu tổng cộng 5.2kg thực phẩm khỏi bị lãng phí"
```

Implementation:
- Add `weightKg` input to `ListingFormPage` (optional, default 0.5)
- Add `weightKg` to listings Firestore service
- In `CheckoutSuccessPage`, read `weightKg` from the listing and display
- In `VendorDashboardPage`, query paid orders this week, sum `weightKg * quantity`
- In `OrdersPage`, query all customer paid orders, sum `weightKg * quantity`
- Add i18n keys: `waste.saved_this_order`, `waste.vendor_weekly`, `waste.customer_total`

---

### Feature B — Customer Loyalty Badges
**Why:** Increases repeat purchase motivation. Easy to build from existing order data.

On **OrdersPage** or a new `/profile` page, show:
```
Hạng của bạn: Chiến Binh Xanh 🌿 (đã mua 10 hộp)
```

Badge tiers (count of paid orders):
| Count | Badge VI | Badge EN |
|-------|----------|----------|
| 1–4   | Người Mới 🌱 | Newcomer |
| 5–9   | Người Bảo Vệ 🌿 | Guardian |
| 10–19 | Chiến Binh Xanh ♻️ | Green Warrior |
| 20+   | Anh Hùng Môi Trường 🌍 | Eco Hero |

Implementation:
- Query `orders` where `customerId == uid` and `status == "paid"` — count them
- Compute badge tier from count
- Display badge card on `OrdersPage` header
- No new Firestore writes needed — purely derived from existing data
- Add i18n keys: `badge.newcomer`, `badge.guardian`, `badge.warrior`, `badge.hero`, `badge.your_rank`

---

### Feature C — Pickup Countdown + Auto-expire (Optional)
**Why:** Prevents customers buying boxes that are already past pickup time.

- Add `pickupDeadline: Timestamp` to listings (may already exist — check `listings.ts`)
- On `BrowsePage` listing cards, show live countdown: "Còn 1 giờ 23 phút"
- Filter out listings where `pickupDeadline < now` on the browse query
- Optional: scheduled Cloud Function every 30min to set expired listings to `status="closed"`

---

## How To Work In This Session

Tell Claude which feature you want: A, B, or C.
Claude should read the relevant existing file before writing new code.
Follow the critical rules above — especially i18n and no direct Firebase imports in components.
Test with Firebase emulators locally before deploying.

---

## Test Credentials (Stripe)

Card: `4242 4242 4242 4242` | Any future date | Any CVC

Stripe CLI webhook forward:
```
stripe listen --forward-to localhost:5001/{your-project-id}/us-central1/stripeWebhook
```
