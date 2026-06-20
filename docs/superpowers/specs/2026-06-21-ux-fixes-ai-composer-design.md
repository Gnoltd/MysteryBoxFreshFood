# MysteryBox — UX Fixes + AI Box Composer Design

**Date:** 2026-06-21  
**Status:** Approved  
**Spec covers:** Fix A (nested link), Fix B (image preview), Fix C (category expansion), Feature D (AI Box Composer)

---

## Background

Four issues reported after the E1–E3 deployment:

1. Clicking a listing card on BrowsePage does not navigate — caused by nested `<a>` tags (React Router `<Link>` inside `<Link>`).
2. Selecting an image file in the listing form shows no preview until after saving.
3. Categories (`bakery | rice | noodles | drinks | snacks | other`) are too narrow for fresh-food vendors like Fresh Garden — fruits, vegetables, dairy, and meat are missing.
4. The Quick Create modal always suggests quantity = 1 because the math engine needs 14+ orders before it gives anything useful. Vendors want an AI-powered flow: enter today's surplus items → Gemini composes a mystery box → suggests a price → vendor edits and publishes.

---

## Fix A — ListingCard Nested Link

**Problem:** `ListingCard` wraps the entire card in `<Link to={href}>`. Inside it, a second `<Link to={/store/:vendorId}>` renders the ↗ store icon. Nested `<a>` elements are invalid HTML; the outer link stops working in most browsers.

**Fix:** Remove the outer `<Link>`. Wrap the card `<div>` with `onClick={() => navigate(href)}` using `useNavigate`. The ↗ store icon remains the only real `<Link>` inside the card; its existing `e.stopPropagation()` correctly prevents the card's `onClick` from also firing.

**Files:** `src/components/shared/ListingCard.tsx`

---

## Fix B — Image File Preview

**Problem:** In `ListingFormPage`, the image section shows `<Input type="file">` and only previews the already-saved `existingImageUrl`. When a vendor selects a new file (`imageFile` state is set), no preview appears — they must save first to see the result.

**Fix:** When `imageFile` is set, compute `URL.createObjectURL(imageFile)` and render it as a preview `<img>` immediately below the file input. Clean up the object URL with `URL.revokeObjectURL` on component unmount or when `imageFile` changes. The existing saved-image preview (`existingImageUrl && !imageFile`) is unchanged.

**Files:** `src/pages/vendor/ListingFormPage.tsx`

---

## Fix C — Category Expansion

**Problem:** The six current categories exclude common fresh-food types that vendors like Fresh Garden sell daily.

**New category set (10 total):**

| Value | EN label | VI label |
|---|---|---|
| `bakery` | Bakery | Bánh |
| `fruit` | Fruit | Trái cây |
| `vegetables` | Vegetables | Rau củ |
| `dairy` | Dairy | Sữa & Chế phẩm |
| `meat` | Meat & Seafood | Thịt & Hải sản |
| `rice` | Rice dishes | Cơm |
| `noodles` | Noodles | Bún / Phở |
| `drinks` | Drinks | Đồ uống |
| `snacks` | Snacks | Đồ ăn vặt |
| `other` | Other | Khác |

**Files:** `src/types.ts`, `src/locales/en/translation.json`, `src/locales/vi/translation.json`

The `ListingCategory` union type gains `'fruit' | 'vegetables' | 'dairy' | 'meat'`. All existing data with the old 6 categories remains valid — no migration needed.

---

## Feature D — AI Box Composer

### Overview

Replaces the Quick Create button on `ListingsPage` with an "AI Box Composer" modal. Vendor enters today's surplus inventory, sets a discount and box count, calls a new Gemini-powered Cloud Function, and gets a ready-to-edit listing suggestion back.

### New Cloud Function: `composeMysteryBox` (callable)

**Input:**
```ts
{
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number   // 20–90 (percent)
  numBoxes: number         // 1–20
  storeName: string
}
```

**Logic:**
1. Validate: `items.length >= 1`, `numBoxes >= 1`, `targetDiscount` in [20, 90].
2. Compute `totalValue = sum(item.unitPrice × item.quantity)`.
3. Compute `originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000` (rounded to nearest 1,000 đ).
4. Compute `suggestedPrice = Math.round(originalPrice * (1 - targetDiscount / 100) / 1000) * 1000`.
5. Build Gemini prompt (see below) and call `gemini-2.0-flash-lite` with `response_mime_type: "application/json"`.
6. Parse response. If `JSON.parse` throws, return `{ error: 'compose_failed' }` with HTTP 400.
7. Return structured result.

**Gemini prompt:**
```
You are helping a Vietnamese F&B vendor create a mystery box listing for their
end-of-day surplus. Store name: "{storeName}".

Today's surplus items:
{items list, one per line: "- {name}: {qty} units × {unitPrice}đ"}

They want to sell {numBoxes} mystery box(es) at {targetDiscount}% off.
Total value per box before discount: {originalPrice}đ.
Suggested sale price: {suggestedPrice}đ.

Respond ONLY with valid JSON:
{
  "category": "<one of: bakery|fruit|vegetables|dairy|meat|rice|noodles|drinks|snacks|other>",
  "titleEn": "<English title, max 60 chars>",
  "titleVi": "<Vietnamese title, max 60 chars>",
  "descriptionEn": "<2-3 sentences in English: what the box contains and why it's a deal>",
  "descriptionVi": "<Same in Vietnamese>"
}
```

**Output returned to client:**
```ts
{
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}
```

**API key config:**
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY_HERE"
# Key obtained from: aistudio.google.com (free tier: 1,500 req/day)
```

Accessed in function as `functions.config().gemini.api_key`.

**npm dependency:** `@google/generative-ai` added to `functions/package.json`.

### Frontend Modal

Triggered by "AI Box Composer" button (replaces "Quick Create") on `ListingsPage`.

**State:**
```ts
items: { name: string; quantity: string; unitPrice: string }[]  // start with 1 empty row
numBoxes: number        // default 3
discount: number        // default 40
loading: boolean
error: string
result: ComposerResult | null   // the AI response
// editable result fields:
editTitle: string
editDescription: string
editPrice: string
editCategory: ListingCategory
```

**UI flow:**

1. **Item table** — each row: text input (name) + number input (qty) + number input (unit price VND) + [×] remove button. [+ Add Item] button appends a new empty row.
2. **Controls row** — "Number of boxes" stepper (−/+, min 1 max 20) + "Discount" slider (20–90%, step 5).
3. **Compose button** — disabled until ≥1 item has name + qty + price filled. Shows a spinner while the Cloud Function runs.
4. **Validation guard** — if `numBoxes > total item count` show inline warning: "You only have {n} total items — reduce boxes or increase quantities." Compose button stays enabled but warning is visible.
5. **AI result panel** — appears below the compose button after a successful call:
   - Category `<Select>` (pre-selected from AI, editable)
   - Title `<Input>` (pre-filled from AI in the user's current lang, editable)
   - Description `<Textarea>` (pre-filled, editable)
   - Price `<Input>` with AI suggested price pre-filled; "AI suggests: {n.toLocaleString('vi-VN')} đ" shown as hint below
6. **Publish button** — disabled if price ≤ 0. Calls `createListing` with:
   - `type: 'mystery_box'`
   - `title`: editTitle
   - `description`: editDescription
   - `category`: editCategory
   - `price`: parseInt(editPrice)
   - `originalPrice`: result.originalPrice
   - `quantityTotal / quantityRemaining`: numBoxes
   - `imageUrl: ''` (vendor can edit the listing afterwards to add image)
   - `pickupStart / pickupEnd`: today 17:00–21:00 defaults (same as Quick Create)
   - `status: 'active'`

**Error handling:**

| Situation | UI response |
|---|---|
| Cloud Function returns `compose_failed` | Inline error: "AI couldn't compose a box — please try again" |
| Network / quota error | Same inline error |
| Price edited to 0 or empty | Publish disabled, red hint "Price must be > 0" |
| Discount slider > 90% | Capped at 90 |
| No items | Compose button disabled |

### i18n Keys Added

Inside `"vendor"` object (EN / VI):
```
"ai_composer": "AI Box Composer" / "AI Tạo Hộp"
"ai_compose_btn": "Compose with AI" / "Tạo bằng AI"
"ai_composing": "AI is composing…" / "AI đang tạo…"
"ai_suggestion": "AI Suggestion (editable)" / "Gợi ý của AI (có thể chỉnh)"
"ai_price_hint": "AI suggests: {{price}} đ" / "AI gợi ý: {{price}} đ"
"ai_error": "AI couldn't compose a box — please try again" / "AI không thể tạo hộp — vui lòng thử lại"
"add_item": "Add Item" / "Thêm sản phẩm"
"num_boxes": "Number of boxes" / "Số hộp"
"discount_pct": "Discount" / "Giảm giá"
"item_name": "Item name" / "Tên sản phẩm"
"item_qty": "Qty" / "Số lượng"
"item_price": "Price / unit (VND)" / "Giá / đơn vị (VND)"
"publish_listing": "Publish Listing" / "Đăng sản phẩm"
"item_count_warning": "You only have {{n}} total items — reduce boxes or increase quantities" / "Bạn chỉ có {{n}} sản phẩm — giảm số hộp hoặc tăng số lượng"
```

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/types.ts` | Add `fruit`, `vegetables`, `dairy`, `meat` to `ListingCategory` |
| `src/locales/en/translation.json` | New category labels + composer keys |
| `src/locales/vi/translation.json` | Vietnamese translations |
| `src/components/shared/ListingCard.tsx` | Fix A: replace outer Link with onClick + useNavigate |
| `src/pages/vendor/ListingFormPage.tsx` | Fix B: live image preview on file select |
| `src/pages/vendor/ListingsPage.tsx` | Feature D: AI Box Composer modal replaces Quick Create |
| `functions/src/composeMysteryBox.ts` | New callable Cloud Function |
| `functions/src/index.ts` | Export composeMysteryBox |
| `functions/package.json` | Add `@google/generative-ai` |

---

## Out of Scope

- Saving item inventory between sessions (vendor re-enters each day)
- Multiple mystery box variants per compose session
- Image generation for mystery boxes
- Customer-facing "what's inside" reveal after pickup
