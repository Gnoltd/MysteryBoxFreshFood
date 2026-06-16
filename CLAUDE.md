# MysteryBox — CLAUDE.md

F&B surplus management app. Vendors list end-of-day surplus as mystery boxes; customers browse, pay via Stripe, and collect with a QR code.

**Full spec:** `docs/superpowers/specs/2026-06-17-mysterybox-design.md`  
**Progress tracking:** `progress.md`

---

## Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Firebase Authentication (email/password)
- **Database:** Cloud Firestore
- **Functions:** Firebase Cloud Functions (Node.js)
- **Payments:** Stripe Checkout (test mode)
- **Routing:** React Router v6
- **i18n:** react-i18next (EN + VI)
- **QR display:** qrcode.react
- **QR scanning:** html5-qrcode

---

## Project Structure

```
src/
  locales/en/translation.json
  locales/vi/translation.json
  firebase.ts
  services/auth.ts · listings.ts · orders.ts · stripe.ts
  contexts/AuthContext.tsx
  components/shared/   ← ProtectedRoute, RoleRoute, ListingCard, LoadingSpinner, ErrorMessage, LanguageToggle
  components/layouts/  ← AuthLayout, CustomerLayout, VendorLayout
  pages/auth/          ← LoginPage, RegisterPage
  pages/customer/      ← BrowsePage, ListingDetailPage, CheckoutSuccessPage, CheckoutCancelPage, OrdersPage, OrderDetailPage
  pages/vendor/        ← VendorDashboardPage, ListingsPage, ListingFormPage, VendorOrdersPage, QRScanPage

functions/src/
  index.ts
  createCheckoutSession.ts
  stripeWebhook.ts
```

---

## Critical Rules

1. **Orders are never created or status-updated by the client.** Only `createCheckoutSession` and `stripeWebhook` Cloud Functions write to `orders/`.
2. **Components never import Firebase SDK directly.** All Firebase access goes through `src/services/`.
3. **Stock decrement happens in `stripeWebhook`**, inside a Firestore transaction, not in the frontend.
4. **QR pickup validation must check `vendorId == currentUser.uid`** to prevent cross-vendor scanning.
5. **All user-visible strings use `t('key')`** from react-i18next — no hardcoded text in components.

---

## Firestore Collections

| Collection | Key fields |
|---|---|
| `users/{uid}` | `role` ("vendor"\|"customer"), `lang` ("en"\|"vi"), vendor fields: `storeName`, `address`, `storeDescription` |
| `listings/{id}` | `vendorId`, `type`, `price`, `quantityRemaining` (transaction-safe), `status`, `stripeProductId`, `stripePriceId` |
| `orders/{id}` | `status` ("pending"→"paid"→"picked_up"), `qrCode` (UUID v4), `stripeSessionId` |

---

## Routes

| Role | Routes |
|---|---|
| Public | `/login`, `/register` |
| Customer | `/browse`, `/listing/:id`, `/checkout/success`, `/checkout/cancel`, `/orders`, `/orders/:id` |
| Vendor | `/vendor`, `/vendor/listings`, `/vendor/listings/new`, `/vendor/listings/:id/edit`, `/vendor/orders`, `/vendor/scan` |

---

## UI Theme

Dark & Modern: `bg-slate-950` / `bg-slate-900` backgrounds, `indigo-500` / `purple-500` accents. shadcn/ui components. Currency in VND (e.g. `35.000 đ`).

---

## Development Notes

- Use **Stripe CLI** during development to forward webhooks: `stripe listen --forward-to localhost:5001/{project}/us-central1/stripeWebhook`
- Firebase emulators for local dev: Auth + Firestore + Functions
- Test Stripe card: `4242 4242 4242 4242`, any future date, any CVC
- When reading progress.md at session start, check which phase is current before doing any work

---

## Progress Tracking

After completing each implementation phase, update `progress.md`. At the start of each new session, read `progress.md` first to understand current state before touching any code.
