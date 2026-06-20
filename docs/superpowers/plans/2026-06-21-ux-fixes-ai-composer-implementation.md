# UX Fixes + AI Box Composer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix nested-link card navigation, add image preview on file select, expand F&B categories to 10, and replace the Quick Create modal with an AI-powered Box Composer backed by Google Gemini.

**Architecture:** Three sequential tasks — (1) foundational type/i18n/UI bug fixes, (2) new `composeMysteryBox` callable Cloud Function using `@google/generative-ai`, (3) rewritten `ListingsPage` AI Box Composer modal that calls the function via a new `src/services/ai.ts` service.

**Tech Stack:** React 19 + Vite + TypeScript, Firebase Cloud Functions v1 (Node 20), `@google/generative-ai` (Gemini 2.0 Flash Lite), react-i18next, react-router-dom `useNavigate`

## Global Constraints

- All user-visible strings use `t('key')` from react-i18next — no hardcoded text in components
- Currency displayed as `{n.toLocaleString('vi-VN')} đ`
- UI theme: `bg-slate-900` cards, `indigo-500`/`purple-500` accents, dark backgrounds
- Components never import Firebase SDK directly — all Firebase access goes through `src/services/`
- Stripe config key pattern: `functions.config().stripe.secret_key` — Gemini follows same pattern: `functions.config().gemini.api_key`
- Test runner: `npm test` (vitest) — no new unit tests required for UI changes; TypeScript `tsc` is the verification gate

---

## Task 1: Types + i18n + Bug Fixes A, B, C

**Files:**
- Modify: `src/types.ts`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`
- Modify: `src/components/shared/ListingCard.tsx`
- Modify: `src/pages/vendor/ListingFormPage.tsx`
- Modify: `src/pages/customer/BrowsePage.tsx`

**Interfaces:**
- Produces: `ListingCategory` expanded union (10 values) — consumed by Task 3 modal category selector and the Cloud Function in Task 2
- Produces: i18n keys `vendor.ai_composer`, `vendor.ai_compose_btn`, `vendor.ai_composing`, `vendor.ai_suggestion`, `vendor.ai_price_hint`, `vendor.ai_error`, `vendor.add_item`, `vendor.num_boxes`, `vendor.discount_pct`, `vendor.item_name`, `vendor.item_qty`, `vendor.item_price`, `vendor.publish_listing`, `vendor.item_count_warning` — consumed by Task 3

- [ ] **Step 1: Update `src/types.ts` — expand ListingCategory**

Replace line 18:
```ts
export type ListingCategory = 'bakery' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
```
With:
```ts
export type ListingCategory = 'bakery' | 'fruit' | 'vegetables' | 'dairy' | 'meat' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
```

- [ ] **Step 2: Update `src/locales/en/translation.json`**

Replace the entire `"categories"` block:
```json
"categories": {
  "bakery": "Bakery",
  "fruit": "Fruit",
  "vegetables": "Vegetables",
  "dairy": "Dairy",
  "meat": "Meat & Seafood",
  "rice": "Rice",
  "noodles": "Noodles",
  "drinks": "Drinks",
  "snacks": "Snacks",
  "other": "Other"
},
```

Inside the `"vendor"` object, replace the `"surplus_volume"` line (last key) with:
```json
"surplus_volume": "Surplus volume",
"ai_composer": "AI Box Composer",
"ai_compose_btn": "Compose with AI",
"ai_composing": "AI is composing…",
"ai_suggestion": "AI Suggestion (editable)",
"ai_price_hint": "AI suggests: {{price}} đ",
"ai_error": "AI couldn't compose a box — please try again",
"add_item": "Add Item",
"num_boxes": "Number of boxes",
"discount_pct": "Discount",
"item_name": "Item name",
"item_qty": "Qty",
"item_price": "Price / unit (VND)",
"publish_listing": "Publish Listing",
"item_count_warning": "You only have {{n}} total items — reduce boxes or increase quantities"
```

- [ ] **Step 3: Update `src/locales/vi/translation.json`**

Replace the entire `"categories"` block:
```json
"categories": {
  "bakery": "Bánh",
  "fruit": "Trái cây",
  "vegetables": "Rau củ",
  "dairy": "Sữa & Chế phẩm",
  "meat": "Thịt & Hải sản",
  "rice": "Cơm",
  "noodles": "Bún / Phở",
  "drinks": "Đồ uống",
  "snacks": "Đồ ăn vặt",
  "other": "Khác"
},
```

Inside the `"vendor"` object, replace the `"surplus_volume"` line (last key) with:
```json
"surplus_volume": "Lượng dư thừa",
"ai_composer": "AI Tạo Hộp",
"ai_compose_btn": "Tạo bằng AI",
"ai_composing": "AI đang tạo…",
"ai_suggestion": "Gợi ý của AI (có thể chỉnh)",
"ai_price_hint": "AI gợi ý: {{price}} đ",
"ai_error": "AI không thể tạo hộp — vui lòng thử lại",
"add_item": "Thêm sản phẩm",
"num_boxes": "Số hộp",
"discount_pct": "Giảm giá",
"item_name": "Tên sản phẩm",
"item_qty": "Số lượng",
"item_price": "Giá / đơn vị (VND)",
"publish_listing": "Đăng sản phẩm",
"item_count_warning": "Bạn chỉ có {{n}} sản phẩm — giảm số hộp hoặc tăng số lượng"
```

- [ ] **Step 4: Fix `src/components/shared/ListingCard.tsx` — nested link (Fix A)**

Replace the entire file with:
```tsx
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCountdown } from '../../hooks/useCountdown'
import type { Listing } from '../../types'

interface ListingCardProps {
  listing: Listing
  href: string
}

export function ListingCard({ listing, href }: ListingCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickup = new Date(listing.pickupStart.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    + ' – ' + new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const { hoursLeft, minutesLeft, urgent, expired: cdExpired } = useCountdown(listing.pickupEnd)
  const showBadge = !cdExpired && hoursLeft < 3

  return (
    <div className="block group cursor-pointer" onClick={() => navigate(href)}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors">
        <div className="relative h-40 bg-slate-800">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
          <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
          {listing.status === 'sold_out' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SOLD OUT</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-white text-sm truncate">{listing.title}</p>
          <div className="flex items-center justify-between mt-1">
            <div>
              <span className="text-indigo-400 font-bold text-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
              <span className="text-slate-500 text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <span className="text-slate-400 text-xs">{listing.quantityRemaining} left</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-slate-500 text-xs truncate">Pickup {pickup}</p>
            <Link
              to={`/store/${listing.vendorId}`}
              onClick={e => e.stopPropagation()}
              className="text-indigo-500 hover:text-indigo-400 text-xs shrink-0 ml-2"
            >
              ↗
            </Link>
          </div>
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
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Fix `src/pages/vendor/ListingFormPage.tsx` — image preview (Fix B)**

Add `useEffect` to the React import (it's already there — verify `useEffect` is in the import list at line 1; if not, add it).

Add a new state variable after the existing `imageFile` state declaration (after line 33 `const [imageFile, setImageFile] = useState<File | null>(null)`):
```ts
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
```

Add a new `useEffect` after the existing `useEffect` block that loads listing data (after line 57's closing `}, [id])`):
```ts
useEffect(() => {
  if (!imageFile) {
    setPreviewUrl(null)
    return
  }
  const url = URL.createObjectURL(imageFile)
  setPreviewUrl(url)
  return () => URL.revokeObjectURL(url)
}, [imageFile])
```

Replace the existing image field JSX block (lines 172–175):
```tsx
<div className="space-y-1">
  <Label className="text-slate-300">Image</Label>
  <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-slate-800 border-slate-700 text-white" />
  {existingImageUrl && !imageFile && <img src={existingImageUrl} className="mt-2 h-20 rounded object-cover" alt="Current listing" />}
</div>
```
With:
```tsx
<div className="space-y-1">
  <Label className="text-slate-300">Image</Label>
  <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-slate-800 border-slate-700 text-white" />
  {(previewUrl || (existingImageUrl && !imageFile)) && (
    <img
      src={previewUrl ?? existingImageUrl}
      className="mt-2 h-32 w-full rounded-lg object-cover"
      alt="Listing preview"
    />
  )}
</div>
```

- [ ] **Step 6: TypeScript check**

```bash
npm run build 2>&1 | head -50
```

Expected: no TypeScript errors. (Vite bundle warning about chunk size is fine — not an error.)

- [ ] **Step 6b: Update category arrays in `ListingFormPage.tsx` and `BrowsePage.tsx`**

In `src/pages/vendor/ListingFormPage.tsx`, replace line 14:
```ts
const CATEGORIES: ListingCategory[] = ['bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']
```
With:
```ts
const CATEGORIES: ListingCategory[] = ['bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'rice', 'noodles', 'drinks', 'snacks', 'other']
```

In `src/pages/customer/BrowsePage.tsx`, replace line 9:
```ts
const CATEGORY_VALUES: (ListingCategory | 'all')[] = ['all', 'bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']
```
With:
```ts
const CATEGORY_VALUES: (ListingCategory | 'all')[] = ['all', 'bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'rice', 'noodles', 'drinks', 'snacks', 'other']
```

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/locales/en/translation.json src/locales/vi/translation.json src/components/shared/ListingCard.tsx src/pages/vendor/ListingFormPage.tsx src/pages/customer/BrowsePage.tsx
git commit -m "feat: fix card navigation, add image preview, expand categories to 10"
```

---

## Task 2: composeMysteryBox Cloud Function

**Files:**
- Modify: `functions/package.json`
- Create: `functions/src/composeMysteryBox.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `functions.config().gemini.api_key` (set via `firebase functions:config:set gemini.api_key="..."`)
- Produces: callable function `composeMysteryBox` — input `{ items, targetDiscount, numBoxes, storeName }`, output `{ category, titleEn, titleVi, descriptionEn, descriptionVi, suggestedPrice, originalPrice }` — consumed by Task 3 `src/services/ai.ts`

- [ ] **Step 1: Install `@google/generative-ai` in functions**

```bash
cd functions && npm install @google/generative-ai
```

Expected: package added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Create `functions/src/composeMysteryBox.ts`**

```ts
import * as functions from 'firebase-functions'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Item {
  name: string
  quantity: number
  unitPrice: number
}

interface ComposeMysteryBoxInput {
  items: Item[]
  targetDiscount: number
  numBoxes: number
  storeName: string
}

export const composeMysteryBox = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { items, targetDiscount, numBoxes, storeName } = data as ComposeMysteryBoxInput

  if (!items || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'At least one item is required')
  }
  if (!numBoxes || numBoxes < 1 || numBoxes > 20) {
    throw new functions.https.HttpsError('invalid-argument', 'numBoxes must be between 1 and 20')
  }
  if (targetDiscount < 20 || targetDiscount > 90) {
    throw new functions.https.HttpsError('invalid-argument', 'targetDiscount must be between 20 and 90')
  }

  const totalValue = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000
  const suggestedPrice = Math.round(originalPrice * (1 - targetDiscount / 100) / 1000) * 1000

  const itemsText = items
    .map(i => `- ${i.name}: ${i.quantity} units × ${i.unitPrice.toLocaleString('vi-VN')}đ`)
    .join('\n')

  const prompt = `You are helping a Vietnamese F&B vendor create a mystery box listing for their end-of-day surplus. Store name: "${storeName}".

Today's surplus items:
${itemsText}

They want to sell ${numBoxes} mystery box(es) at ${targetDiscount}% off.
Total value per box before discount: ${originalPrice.toLocaleString('vi-VN')}đ.
Suggested sale price: ${suggestedPrice.toLocaleString('vi-VN')}đ.

Respond ONLY with valid JSON:
{
  "category": "<one of: bakery|fruit|vegetables|dairy|meat|rice|noodles|drinks|snacks|other>",
  "titleEn": "<English title, max 60 chars>",
  "titleVi": "<Vietnamese title, max 60 chars>",
  "descriptionEn": "<2-3 sentences in English: what the box contains and why it is a deal>",
  "descriptionVi": "<Same in Vietnamese>"
}`

  const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  })

  let parsed: {
    category: string
    titleEn: string
    titleVi: string
    descriptionEn: string
    descriptionVi: string
  }

  try {
    const result = await model.generateContent(prompt)
    parsed = JSON.parse(result.response.text())
  } catch {
    throw new functions.https.HttpsError('internal', 'compose_failed')
  }

  return {
    category: parsed.category,
    titleEn: parsed.titleEn,
    titleVi: parsed.titleVi,
    descriptionEn: parsed.descriptionEn,
    descriptionVi: parsed.descriptionVi,
    suggestedPrice,
    originalPrice,
  }
})
```

- [ ] **Step 3: Export from `functions/src/index.ts`**

Add this line at the bottom of `functions/src/index.ts`:
```ts
export { composeMysteryBox } from './composeMysteryBox'
```

- [ ] **Step 4: Build functions**

```bash
cd functions && npm run build 2>&1
```

Expected: TypeScript compiles with no errors. Warnings about deprecated Node 20 runtime are fine.

- [ ] **Step 5: Set Gemini API key in functions config**

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_KEY_HERE"
```

(Get the key from aistudio.google.com → Create API key. Replace `YOUR_GEMINI_KEY_HERE` with the actual key.)

- [ ] **Step 6: Deploy functions**

```bash
cd .. && firebase deploy --only functions
```

Expected: `composeMysteryBox` appears in the deploy output as a new function being created.

- [ ] **Step 7: Commit**

```bash
git add functions/src/composeMysteryBox.ts functions/src/index.ts functions/package.json functions/package-lock.json
git commit -m "feat: add composeMysteryBox Gemini-powered Cloud Function"
```

---

## Task 3: AI Box Composer modal + service

**Files:**
- Create: `src/services/ai.ts`
- Modify: `src/pages/vendor/ListingsPage.tsx`

**Interfaces:**
- Consumes: `composeMysteryBox` Cloud Function from Task 2 (via `httpsCallable`)
- Consumes: `createListing` from `src/services/listings.ts` — signature: `createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<string>`
- Consumes: `ListingCategory` (10-value union from Task 1), i18n keys from Task 1
- Consumes: `functions` export from `src/firebase.ts` (already exported)
- Produces: working AI Box Composer modal on `/vendor/listings` page

- [ ] **Step 1: Create `src/services/ai.ts`**

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import type { ListingCategory } from '../types'

interface ComposeMysteryBoxInput {
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number
  numBoxes: number
  storeName: string
}

export interface ComposeMysteryBoxResult {
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}

export async function composeMysteryBox(input: ComposeMysteryBoxInput): Promise<ComposeMysteryBoxResult> {
  const fn = httpsCallable<ComposeMysteryBoxInput, ComposeMysteryBoxResult>(functions, 'composeMysteryBox')
  const result = await fn(input)
  return result.data
}
```

- [ ] **Step 2: Replace `src/pages/vendor/ListingsPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing, createListing } from '../../services/listings'
import { composeMysteryBox } from '../../services/ai'
import type { ComposeMysteryBoxResult } from '../../services/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Listing, ListingCategory } from '../../types'

const ALL_CATEGORIES: ListingCategory[] = ['bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'rice', 'noodles', 'drinks', 'snacks', 'other']

interface ComposerItem {
  name: string
  quantity: string
  unitPrice: string
}

function todayAt(hour: number, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

export default function ListingsPage() {
  const { t, i18n } = useTranslation()
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // AI Box Composer state
  const [showComposer, setShowComposer] = useState(false)
  const [composerItems, setComposerItems] = useState<ComposerItem[]>([{ name: '', quantity: '', unitPrice: '' }])
  const [numBoxes, setNumBoxes] = useState(3)
  const [discount, setDiscount] = useState(40)
  const [composerLoading, setComposerLoading] = useState(false)
  const [composerError, setComposerError] = useState('')
  const [composerResult, setComposerResult] = useState<ComposeMysteryBoxResult | null>(null)
  const [editCategory, setEditCategory] = useState<ListingCategory>('other')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [pickupStart, setPickupStart] = useState(todayAt(17))
  const [pickupEnd, setPickupEnd] = useState(todayAt(21))
  const [publishLoading, setPublishLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorListings(currentUser.uid, data => { setListings(data); setLoading(false) })
    return unsub
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const openComposer = () => {
    setComposerItems([{ name: '', quantity: '', unitPrice: '' }])
    setNumBoxes(3)
    setDiscount(40)
    setComposerError('')
    setComposerResult(null)
    setPickupStart(todayAt(17))
    setPickupEnd(todayAt(21))
    setShowComposer(true)
  }

  const updateItem = (index: number, field: keyof ComposerItem, value: string) => {
    setComposerItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => setComposerItems(prev => [...prev, { name: '', quantity: '', unitPrice: '' }])

  const removeItem = (index: number) => setComposerItems(prev => prev.filter((_, i) => i !== index))

  const totalItems = composerItems.reduce((sum, i) => sum + (parseInt(i.quantity) || 0), 0)
  const canCompose = composerItems.some(i => i.name.trim() && i.quantity && i.unitPrice)

  const handleCompose = async () => {
    if (!currentUser || !canCompose) return
    setComposerLoading(true)
    setComposerError('')
    setComposerResult(null)
    try {
      const items = composerItems
        .filter(i => i.name.trim() && i.quantity && i.unitPrice)
        .map(i => ({ name: i.name.trim(), quantity: parseInt(i.quantity), unitPrice: parseInt(i.unitPrice) }))
      const result = await composeMysteryBox({
        items,
        targetDiscount: discount,
        numBoxes,
        storeName: currentUser.displayName ?? 'Store',
      })
      setComposerResult(result)
      setEditCategory(result.category as ListingCategory)
      setEditTitle(i18n.language === 'vi' ? result.titleVi : result.titleEn)
      setEditDescription(i18n.language === 'vi' ? result.descriptionVi : result.descriptionEn)
      setEditPrice(String(result.suggestedPrice))
    } catch {
      setComposerError(t('vendor.ai_error'))
    } finally {
      setComposerLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!currentUser || !composerResult) return
    const price = parseInt(editPrice)
    if (!price || price <= 0) return
    setPublishLoading(true)
    try {
      await createListing({
        vendorId: currentUser.uid,
        type: 'mystery_box',
        title: editTitle,
        description: editDescription,
        price,
        originalPrice: composerResult.originalPrice,
        quantityTotal: numBoxes,
        quantityRemaining: numBoxes,
        category: editCategory,
        imageUrl: '',
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        status: 'active',
      })
      setShowComposer(false)
    } catch (err: unknown) {
      setComposerError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishLoading(false)
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
          <Button onClick={openComposer} className="bg-purple-600 hover:bg-purple-500">
            {t('vendor.ai_composer')}
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
              {l.imageUrl ? <img src={l.imageUrl} className="w-full h-full object-cover rounded-lg" alt={l.title} /> : '🎁'}
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

      {/* AI Box Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">🤖 {t('vendor.ai_composer')}</h2>
              <button onClick={() => setShowComposer(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>

            {/* Item rows */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">{t('vendor.add_item')}</Label>
              <div className="space-y-2">
                {composerItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_90px_28px] gap-1.5 items-center">
                    <Input
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder={t('vendor.item_name')}
                      className="bg-slate-800 border-slate-700 text-white text-xs"
                    />
                    <Input
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      type="number"
                      min="1"
                      placeholder={t('vendor.item_qty')}
                      className="bg-slate-800 border-slate-700 text-white text-xs"
                    />
                    <Input
                      value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                      type="number"
                      min="1000"
                      placeholder="15000"
                      className="bg-slate-800 border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={composerItems.length === 1}
                      className="text-slate-500 hover:text-red-400 disabled:opacity-30 text-lg leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-medium"
              >
                + {t('vendor.add_item')}
              </button>
            </div>

            {/* numBoxes + discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">{t('vendor.num_boxes')}</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNumBoxes(n => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >−</button>
                  <span className="text-white font-bold w-6 text-center">{numBoxes}</span>
                  <button
                    type="button"
                    onClick={() => setNumBoxes(n => Math.min(20, n + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >+</button>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">{t('vendor.discount_pct')}: {discount}%</Label>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            {/* Item count warning */}
            {totalItems > 0 && numBoxes > totalItems && (
              <p className="text-yellow-400 text-xs">{t('vendor.item_count_warning', { n: totalItems })}</p>
            )}

            {/* Pickup window */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.pickup_window')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
                <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
              </div>
            </div>

            <Button
              onClick={handleCompose}
              disabled={!canCompose || composerLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
            >
              {composerLoading ? t('vendor.ai_composing') : t('vendor.ai_compose_btn')}
            </Button>

            {composerError && <p className="text-red-400 text-xs">{composerError}</p>}

            {/* AI result panel */}
            {composerResult && (
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <p className="text-indigo-400 text-xs font-medium uppercase tracking-wide">{t('vendor.ai_suggestion')}</p>

                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.category')}</Label>
                  <Select value={editCategory} onValueChange={v => setEditCategory(v as ListingCategory)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {ALL_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c} className="text-white capitalize">
                          {t(`categories.${c}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.title')}</Label>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.description')}</Label>
                  <Textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.price')}</Label>
                  <Input
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    type="number"
                    min="1000"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    {t('vendor.ai_price_hint', { price: composerResult.suggestedPrice.toLocaleString('vi-VN') })}
                  </p>
                  {parseInt(editPrice) <= 0 && (
                    <p className="text-red-400 text-xs mt-0.5">Price must be &gt; 0</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handlePublish}
                    disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {publishLoading ? t('vendor.saving') : t('vendor.publish_listing')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowComposer(false)}
                    className="border-slate-700 text-slate-300"
                  >
                    {t('vendor.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npm run build 2>&1 | head -50
```

Expected: no TypeScript errors.

- [ ] **Step 4: Build and deploy everything**

```bash
npm run build && firebase deploy --only hosting
firebase deploy --only functions
```

Expected: both deploys succeed. Live URL: `https://final-prj-52341.web.app`

- [ ] **Step 5: Manual smoke test**

**Fix A:** Log in as customer → go to Browse → click a listing card anywhere on the card body → should navigate to listing detail page. The ↗ icon should navigate to the vendor store page.

**Fix B:** Log in as vendor → Listings → New Listing or Edit → click the image field and choose a photo → a preview of the photo should appear immediately below the file input without saving.

**Fix C:** Check category dropdowns in the listing form and the AI composer modal — should show all 10 categories including Fruit, Vegetables, Dairy, Meat & Seafood.

**Feature D:** Log in as vendor → Listings → click "AI Box Composer" → add 2–3 items (e.g., "Bánh mì" qty 8 price 15000, "Sữa chua" qty 5 price 25000) → set 3 boxes, 40% discount → click "Compose with AI" → AI result should appear with title, description, category, and suggested price → edit the price if needed → click "Publish Listing" → the new listing should appear in the list.

- [ ] **Step 6: Commit**

```bash
git add src/services/ai.ts src/pages/vendor/ListingsPage.tsx
git commit -m "feat: add AI Box Composer modal with Gemini-powered mystery box generation"
```
