# MysteryBox — Progress

## Current Phase: Design Complete — Ready for Implementation

**Last updated:** 2026-06-17  
**Spec:** `docs/superpowers/specs/2026-06-17-mysterybox-design.md`

---

## Status

| Phase | Status |
|---|---|
| Brainstorming & design | ✅ Complete — approved 2026-06-17 |
| Implementation plan | ✅ Complete — `docs/superpowers/plans/2026-06-17-mysterybox-implementation.md` |
| Project scaffold (Vite + Firebase + Tailwind) | ⏳ Not started |
| Firebase config + Auth | ⏳ Not started |
| Firestore data layer + services | ⏳ Not started |
| Routing + layouts | ⏳ Not started |
| Auth pages (Login, Register) | ⏳ Not started |
| Customer pages (Browse, Detail, Orders, QR) | ⏳ Not started |
| Vendor pages (Dashboard, Listings, Orders, Scan) | ⏳ Not started |
| Cloud Functions (createCheckoutSession, stripeWebhook) | ⏳ Not started |
| i18n (EN/VI translation files) | ⏳ Not started |
| Stripe integration + webhook testing | ⏳ Not started |
| End-to-end testing (purchase flow + QR pickup) | ⏳ Not started |

---

## Key Decisions Made

- **Stack:** React + Vite + TypeScript + Firebase (Auth + Firestore + Functions) + Stripe test mode
- **Scope:** Full flow both sides — vendor dashboard + customer purchase flow, both fully functional
- **Payment:** Stripe Checkout test mode; webhook via Firebase Cloud Function sets order `"paid"`
- **UI:** Dark & Modern (slate + indigo/purple), Tailwind CSS + shadcn/ui
- **QR pickup:** Vendor camera scans customer QR (html5-qrcode); UUID validated against vendorId
- **i18n:** react-i18next, EN/VI toggle, preference saved to Firestore

---

## Next Session: Start Here

1. Read this file first
2. Read `CLAUDE.md` for rules and structure
3. Read `docs/superpowers/specs/2026-06-17-mysterybox-design.md` for full spec
4. Check which phase is current in the status table above
5. Continue from the first ⏳ phase
