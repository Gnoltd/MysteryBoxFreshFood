# Vendor Inventory & AI Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent vendor inventory catalog, AI-suggested box count, manual ± adjustment widget, expiry alerts, and dynamic pricing to the MysteryBox vendor side.

**Architecture:** New Firestore subcollection `inventory/{vendorId}/items/{itemId}` stores the catalog. Two new pages (`/vendor/inventory`, `/vendor/compose`) replace the existing modal in `ListingsPage`. Two Cloud Functions are updated/added: `composeMysteryBox` (numBoxes now output) and `suggestPrice` (new, Groq + heuristic fallback).

**Tech Stack:** React + TypeScript + Vite, Firebase Firestore (subcollection), Firebase Cloud Functions (Node.js), Groq SDK (already installed), Vitest, react-i18next, shadcn/ui, lucide-react

## Global Constraints

- All Firebase access goes through `src/services/` — no SDK imports in pages
- All user-visible strings use `t('key')` — no hardcoded text in components
- Currency formatted as `n.toLocaleString('vi-VN') đ`
- Dark theme: `bg-slate-950` / `bg-slate-900` backgrounds, `indigo-500` / `purple-500` accents
- Groq API key accessed via `functions.config().groq.api_key`
- Run tests with: `npx vitest run`

---

### Task 1: InventoryItem type + utility functions + inventory service + Firestore rules

**Files:**
- Modify: `src/types.ts`
- Create: `src/utils/inventoryUtils.ts`
- Create: `src/utils/inventoryUtils.test.ts`
- Create: `src/services/inventory.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Produces: `InventoryItem` type, `expiryLabel(item): 'today' | 'soon' | 'expired' | null`, `getExpiringItems(items, hoursAhead): InventoryItem[]`, `subscribeToInventory`, `addInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`

- [ ] **Step 1: Add InventoryItem to src/types.ts**

Add after the `Review` interface:

```ts
export interface InventoryItem {
  id: string
  name: string
  category: ListingCategory
  unitPrice: number
  unit: string
  defaultQty: number
  bestBefore: Timestamp | null
  createdAt: Timestamp
}
```

- [ ] **Step 2: Write failing tests for inventoryUtils**

Create `src/utils/inventoryUtils.test.ts`:

```ts
import { describe, test, expect } from 'vitest'
import { getExpiringItems, expiryLabel } from './inventoryUtils'
import type { InventoryItem } from '../types'

const now = Math.floor(Date.now() / 1000)
const ts = (offsetSec: number) => ({ seconds: now + offsetSec, nanoseconds: 0 }) as any

function makeItem(id: string, offsetSec: number | null): InventoryItem {
  return {
    id, name: `Item ${id}`, category: 'bakery', unitPrice: 10000,
    unit: 'piece', defaultQty: 1,
    bestBefore: offsetSec !== null ? ts(offsetSec) : null,
    createdAt: ts(-86400),
  }
}

describe('getExpiringItems', () => {
  test('excludes items with no bestBefore', () => {
    expect(getExpiringItems([makeItem('1', null)], 48)).toHaveLength(0)
  })
  test('includes items expiring within hoursAhead', () => {
    expect(getExpiringItems([makeItem('1', 3600)], 48)).toHaveLength(1)
  })
  test('excludes items expiring beyond hoursAhead', () => {
    expect(getExpiringItems([makeItem('1', 72 * 3600)], 48)).toHaveLength(0)
  })
  test('includes already-expired items', () => {
    expect(getExpiringItems([makeItem('1', -3600)], 48)).toHaveLength(1)
  })
})

describe('expiryLabel', () => {
  test('returns null when no bestBefore', () => {
    expect(expiryLabel(makeItem('1', null))).toBeNull()
  })
  test('returns "expired" when bestBefore is in the past', () => {
    expect(expiryLabel(makeItem('1', -3600))).toBe('expired')
  })
  test('returns "today" when bestBefore is within 24 hours', () => {
    expect(expiryLabel(makeItem('1', 12 * 3600))).toBe('today')
  })
  test('returns "soon" when bestBefore is 24-48 hours away', () => {
    expect(expiryLabel(makeItem('1', 36 * 3600))).toBe('soon')
  })
  test('returns null when bestBefore is more than 48 hours away', () => {
    expect(expiryLabel(makeItem('1', 60 * 3600))).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

```
npx vitest run src/utils/inventoryUtils.test.ts
```
Expected: `Cannot find module './inventoryUtils'`

- [ ] **Step 4: Create src/utils/inventoryUtils.ts**

```ts
import type { InventoryItem } from '../types'

function toMs(ts: { seconds: number; nanoseconds: number }): number {
  return ts.seconds * 1000 + ts.nanoseconds / 1_000_000
}

export function getExpiringItems(items: InventoryItem[], hoursAhead: number): InventoryItem[] {
  const cutoff = Date.now() + hoursAhead * 3600 * 1000
  return items.filter(item => item.bestBefore !== null && toMs(item.bestBefore) <= cutoff)
}

export function expiryLabel(item: InventoryItem): 'today' | 'soon' | 'expired' | null {
  if (!item.bestBefore) return null
  const now = Date.now()
  const ms = toMs(item.bestBefore)
  if (ms < now) return 'expired'
  if (ms < now + 24 * 3600 * 1000) return 'today'
  if (ms < now + 48 * 3600 * 1000) return 'soon'
  return null
}
```

- [ ] **Step 5: Run tests — expect PASS**

```
npx vitest run src/utils/inventoryUtils.test.ts
```
Expected: 9 tests pass

- [ ] **Step 6: Create src/services/inventory.ts**

```ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { InventoryItem } from '../types'

export function subscribeToInventory(
  vendorId: string,
  callback: (items: InventoryItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'inventory', vendorId, 'items'),
    orderBy('name', 'asc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)))
  )
}

export async function addInventoryItem(
  vendorId: string,
  item: Omit<InventoryItem, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(
    collection(db, 'inventory', vendorId, 'items'),
    { ...item, createdAt: serverTimestamp() }
  )
}

export async function updateInventoryItem(
  vendorId: string,
  itemId: string,
  patch: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'inventory', vendorId, 'items', itemId), patch)
}

export async function deleteInventoryItem(vendorId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'inventory', vendorId, 'items', itemId))
}
```

- [ ] **Step 7: Add inventory subcollection rules to firestore.rules**

Add inside `match /databases/{database}/documents {` after the reviews block:

```
match /inventory/{vendorId}/items/{itemId} {
  allow read, write: if request.auth != null && request.auth.uid == vendorId;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/utils/inventoryUtils.ts src/utils/inventoryUtils.test.ts src/services/inventory.ts firestore.rules
git commit -m "feat: add InventoryItem type, inventory service, expiry utils, Firestore rules"
```

---

### Task 2: VendorInventoryPage + routing + nav + i18n

**Files:**
- Create: `src/pages/vendor/VendorInventoryPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layouts/VendorLayout.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

**Interfaces:**
- Consumes: `subscribeToInventory`, `addInventoryItem`, `updateInventoryItem`, `deleteInventoryItem` from `../../services/inventory`; `expiryLabel` from `../../utils/inventoryUtils`; `InventoryItem`, `ListingCategory` from `../../types`

- [ ] **Step 1: Add i18n keys to src/locales/en/translation.json**

Inside the `"nav"` object add:
```json
"inventory": "Inventory",
"compose": "Compose"
```

Inside the `"vendor"` object add:
```json
"inventory": "My Inventory",
"edit_item": "Edit Item",
"best_before": "Best before",
"expires_today": "Expires today",
"expires_soon": "Expires soon",
"expired": "Expired",
"unit": "Unit",
"default_qty": "Default qty",
"no_inventory": "No items in your catalog yet",
"go_to_inventory": "Go to Inventory →"
```

- [ ] **Step 2: Add i18n keys to src/locales/vi/translation.json**

Inside `"nav"` add:
```json
"inventory": "Kho hàng",
"compose": "Tạo hộp"
```

Inside `"vendor"` add:
```json
"inventory": "Kho hàng",
"edit_item": "Chỉnh sửa",
"best_before": "Hạn sử dụng",
"expires_today": "Hết hạn hôm nay",
"expires_soon": "Sắp hết hạn",
"expired": "Đã hết hạn",
"unit": "Đơn vị",
"default_qty": "Số lượng mặc định",
"no_inventory": "Chưa có sản phẩm trong kho",
"go_to_inventory": "Đến Kho hàng →"
```

- [ ] **Step 3: Create src/pages/vendor/VendorInventoryPage.tsx**

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import {
  subscribeToInventory, addInventoryItem,
  updateInventoryItem, deleteInventoryItem
} from '../../services/inventory'
import { expiryLabel } from '../../utils/inventoryUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import type { InventoryItem, ListingCategory } from '../../types'

const ALL_CATEGORIES: ListingCategory[] = [
  'bakery', 'fruit', 'vegetables', 'dairy', 'meat',
  'rice', 'noodles', 'drinks', 'snacks', 'other'
]

const CATEGORY_ICONS: Record<ListingCategory, string> = {
  bakery: '🥐', fruit: '🍎', vegetables: '🥬', dairy: '🥛', meat: '🥩',
  rice: '🍚', noodles: '🍜', drinks: '🥤', snacks: '🍿', other: '📦',
}

interface FormState {
  name: string; category: ListingCategory; unitPrice: string
  unit: string; defaultQty: string; bestBefore: string
}

const EMPTY: FormState = {
  name: '', category: 'other', unitPrice: '', unit: 'piece', defaultQty: '1', bestBefore: ''
}

export default function VendorInventoryPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    return subscribeToInventory(currentUser.uid, data => {
      setItems(data); setLoading(false)
    })
  }, [currentUser])

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setShowForm(true) }

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name, category: item.category,
      unitPrice: String(item.unitPrice), unit: item.unit,
      defaultQty: String(item.defaultQty),
      bestBefore: item.bestBefore
        ? new Date(item.bestBefore.seconds * 1000).toISOString().split('T')[0]
        : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!currentUser || !form.name.trim() || !form.unitPrice) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unitPrice: parseInt(form.unitPrice),
        unit: form.unit.trim() || 'piece',
        defaultQty: Math.max(1, parseInt(form.defaultQty) || 1),
        bestBefore: form.bestBefore
          ? Timestamp.fromDate(new Date(form.bestBefore))
          : null,
      }
      if (editingId) {
        await updateInventoryItem(currentUser.uid, editingId, payload)
      } else {
        await addInventoryItem(currentUser.uid, payload)
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentUser || !confirm(t('vendor.delete') + '?')) return
    await deleteInventoryItem(currentUser.uid, id)
  }

  const sorted = [...items].sort((a, b) => {
    const aExp = expiryLabel(a) !== null
    const bExp = expiryLabel(b) !== null
    if (aExp !== bExp) return aExp ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const BADGE: Record<string, { style: string; label: string }> = {
    expired: { style: 'bg-slate-700 text-slate-400', label: t('vendor.expired') },
    today:   { style: 'bg-red-900 text-red-300',     label: t('vendor.expires_today') },
    soon:    { style: 'bg-amber-900 text-amber-300',  label: t('vendor.expires_soon') },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('vendor.inventory')}</h1>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500">
          + {t('vendor.add_item')}
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-indigo-600 rounded-xl p-5 mb-4 space-y-4">
          <h2 className="text-white font-semibold">
            {editingId ? t('vendor.edit_item') : `+ ${t('vendor.add_item')}`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.item_name')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Croissant" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.category')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ListingCategory }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ALL_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-white">
                      {CATEGORY_ICONS[c]} {t(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.item_price')} (VND)</Label>
              <Input value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                type="number" min="1000" className="bg-slate-800 border-slate-700 text-white" placeholder="15000" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.unit')}</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white" placeholder="piece" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.default_qty')}</Label>
              <Input value={form.defaultQty} onChange={e => setForm(f => ({ ...f, defaultQty: e.target.value }))}
                type="number" min="1" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.best_before')} (optional)</Label>
              <Input value={form.bestBefore} onChange={e => setForm(f => ({ ...f, bestBefore: e.target.value }))}
                type="date" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !form.name || !form.unitPrice}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">
              {saving ? t('vendor.saving') : t('vendor.save')}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-300">
              {t('vendor.cancel')}
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-400">{t('browse.loading')}</p>}

      {!loading && items.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg mb-4">{t('vendor.no_inventory')}</p>
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500">
            + {t('vendor.add_item')}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(item => {
          const label = expiryLabel(item)
          return (
            <div key={item.id} className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${
              label === 'today' ? 'border-red-500/60' : label === 'soon' ? 'border-amber-500/60' : 'border-slate-800'
            }`}>
              <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium">{item.name}</p>
                  {label && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[label].style}`}>
                      {BADGE[label].label}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {item.unitPrice.toLocaleString('vi-VN')} đ / {item.unit} · {t('vendor.default_qty')}: {item.defaultQty}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}
                  className="border-slate-700 text-slate-300 hover:text-white">{t('vendor.edit')}</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  {t('vendor.delete')}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add route to src/App.tsx**

Add this import at the top with the other vendor page imports:
```tsx
import VendorInventoryPage from './pages/vendor/VendorInventoryPage'
```

Inside the vendor `<Route>` group, add:
```tsx
<Route path="/vendor/inventory" element={<VendorInventoryPage />} />
```

- [ ] **Step 5: Add nav items to src/components/layouts/VendorLayout.tsx**

Add `Archive` and `Wand2` to the lucide-react import line:
```tsx
import { LayoutDashboard, Package, ShoppingBag, QrCode, LogOut, Archive, Wand2 } from 'lucide-react'
```

In the `navItems` array, add after the listings entry:
```tsx
{ to: '/vendor/inventory', label: t('nav.inventory'), icon: Archive, exact: false },
{ to: '/vendor/compose',   label: t('nav.compose'),   icon: Wand2,    exact: false },
```

- [ ] **Step 6: Smoke test**

Run `npm run dev`. Navigate to `/vendor/inventory`. Verify:
- Empty state message and "+ Add Item" button appear
- Add an item (name, price, optional bestBefore) → item appears in list
- Edit the item → form pre-fills, save updates
- Delete the item → disappears from list
- Add an item with bestBefore = today → amber/red badge appears, item floats to top

- [ ] **Step 7: Commit**

```bash
git add src/pages/vendor/VendorInventoryPage.tsx src/App.tsx src/components/layouts/VendorLayout.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add vendor inventory catalog page with expiry badges"
```

---

### Task 3: Update composeMysteryBox Cloud Function (numBoxes as output)

**Files:**
- Modify: `functions/src/composeMysteryBox.ts`
- Modify: `src/services/ai.ts`

**Interfaces:**
- Produces: `ComposeMysteryBoxResult.numBoxes: number` (new field); removes `numBoxes` from input

- [ ] **Step 1: Replace functions/src/composeMysteryBox.ts**

```ts
import * as functions from 'firebase-functions'
import Groq from 'groq-sdk'

interface Item {
  name: string
  quantity: number
  unitPrice: number
}

interface ComposeMysteryBoxInput {
  items: Item[]
  targetDiscount: number
  storeName: string
}

function calcBoxCount(totalValue: number, targetDiscount: number) {
  const optimalPricePerBox = totalValue * (1 - targetDiscount / 100)
  const numBoxes = Math.max(1, Math.min(20, Math.round(totalValue / optimalPricePerBox)))
  const originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000
  const suggestedPrice = Math.round(originalPrice * (1 - targetDiscount / 100) / 1000) * 1000
  return { numBoxes, originalPrice, suggestedPrice }
}

export const composeMysteryBox = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { items, targetDiscount, storeName } = data as ComposeMysteryBoxInput

  if (!items || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'At least one item is required')
  }
  if (targetDiscount < 20 || targetDiscount > 90) {
    throw new functions.https.HttpsError('invalid-argument', 'targetDiscount must be between 20 and 90')
  }

  const totalValue = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const { numBoxes, originalPrice, suggestedPrice } = calcBoxCount(totalValue, targetDiscount)

  const itemsText = items
    .map(i => `- ${i.name}: ${i.quantity} units x ${i.unitPrice.toLocaleString('vi-VN')}d`)
    .join('\n')

  const prompt = `You are helping a Vietnamese F&B vendor create a mystery box listing for their end-of-day surplus. Store name: "${storeName}".

Today's surplus items:
${itemsText}

They want to sell ${numBoxes} mystery box(es) at ${targetDiscount}% off.
Total value per box before discount: ${originalPrice.toLocaleString('vi-VN')}d.
Suggested sale price: ${suggestedPrice.toLocaleString('vi-VN')}d.

Respond ONLY with valid JSON:
{
  "category": "<one of: bakery|fruit|vegetables|dairy|meat|rice|noodles|drinks|snacks|other>",
  "titleEn": "<English title, max 60 chars>",
  "titleVi": "<Vietnamese title, max 60 chars>",
  "descriptionEn": "<2-3 sentences in English: what the box contains and why it is a deal>",
  "descriptionVi": "<Same in Vietnamese>"
}`

  const groq = new Groq({ apiKey: functions.config().groq.api_key })

  let parsed: {
    category: string; titleEn: string; titleVi: string
    descriptionEn: string; descriptionVi: string
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('composeMysteryBox error:', e)
    throw new functions.https.HttpsError('internal', 'compose_failed')
  }

  return {
    numBoxes,
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

- [ ] **Step 2: Update src/services/ai.ts**

Replace the entire file:

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import type { ListingCategory } from '../types'

interface ComposeMysteryBoxInput {
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number
  storeName: string
}

export interface ComposeMysteryBoxResult {
  numBoxes: number
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}

export interface SuggestPriceResult {
  recommendedDiscount: number
  reason: string
  dataPoints: number
}

interface SuggestPriceInput {
  vendorId: string
  targetDiscount: number
}

export async function composeMysteryBox(input: ComposeMysteryBoxInput): Promise<ComposeMysteryBoxResult> {
  const fn = httpsCallable<ComposeMysteryBoxInput, ComposeMysteryBoxResult>(functions, 'composeMysteryBox')
  const result = await fn(input)
  return result.data
}

export async function suggestPrice(input: SuggestPriceInput): Promise<SuggestPriceResult> {
  const fn = httpsCallable<SuggestPriceInput, SuggestPriceResult>(functions, 'suggestPrice')
  const result = await fn(input)
  return result.data
}
```

- [ ] **Step 3: Commit**

```bash
git add functions/src/composeMysteryBox.ts src/services/ai.ts
git commit -m "feat: composeMysteryBox now calculates numBoxes server-side, adds SuggestPriceResult type"
```

---

### Task 4: suggestPrice Cloud Function

**Files:**
- Create: `functions/src/suggestPrice.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `SuggestPriceResult` shape from Task 3 (matches return value)
- Produces: `suggestPrice` callable Cloud Function returning `{ recommendedDiscount, reason, dataPoints }`

- [ ] **Step 1: Create functions/src/suggestPrice.ts**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Groq from 'groq-sdk'

interface SuggestPriceInput {
  vendorId: string
  targetDiscount: number
}

function heuristicDiscount(targetDiscount: number, hour: number): number {
  let bump = 0
  if (hour >= 15 && hour < 18) bump = 5
  else if (hour >= 18 && hour < 20) bump = 15
  else if (hour >= 20) bump = 25
  return Math.min(90, Math.max(20, targetDiscount + bump))
}

export const suggestPrice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { vendorId, targetDiscount } = data as SuggestPriceInput
  const currentHour = new Date().getHours()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const snapshot = await admin.firestore()
    .collection('orders')
    .where('vendorId', '==', vendorId)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
    .limit(200)
    .get()

  const orders = snapshot.docs
    .map(d => d.data())
    .filter(o => o.status === 'paid' || o.status === 'picked_up')

  const buckets: Record<number, number> = {}
  for (let h = 0; h < 24; h++) buckets[h] = 0
  orders.forEach(o => {
    const h = new Date(o.createdAt.toDate()).getHours()
    buckets[h] = (buckets[h] ?? 0) + 1
  })

  const dataPoints = buckets[currentHour] ?? 0

  if (dataPoints >= 5) {
    try {
      const groq = new Groq({ apiKey: functions.config().groq.api_key })
      const ratesText = Object.entries(buckets)
        .filter(([, count]) => count >= 1)
        .map(([h, count]) => `${h}:00 — ${count} orders`)
        .join('\n')

      const prompt = `Vietnamese F&B vendor. Current time: ${currentHour}:00.
Orders by hour of day (last 30 days):
${ratesText}

Target discount: ${targetDiscount}%. Suggest an optimal discount % (integer 20-90) to maximise sell-through tonight.
Reply ONLY with valid JSON: { "recommendedDiscount": number, "reason": string }`

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
      const recommendedDiscount = Math.min(90, Math.max(20, Math.round(Number(parsed.recommendedDiscount))))
      return { recommendedDiscount, reason: String(parsed.reason ?? ''), dataPoints }
    } catch (e) {
      console.error('suggestPrice Groq error:', e)
    }
  }

  const REASONS: Record<string, string> = {
    early:     'morning hours have lower urgency',
    afternoon: 'afternoon pickup window approaching',
    evening:   'peak clearance window — drive sell-through',
    late:      'last chance to sell — deep discount recommended',
  }
  const key = currentHour < 15 ? 'early' : currentHour < 18 ? 'afternoon' : currentHour < 20 ? 'evening' : 'late'
  return { recommendedDiscount: heuristicDiscount(targetDiscount, currentHour), reason: REASONS[key], dataPoints }
})
```

- [ ] **Step 2: Export from functions/src/index.ts**

Add at the end:
```ts
export { suggestPrice } from './suggestPrice'
```

- [ ] **Step 3: Commit**

```bash
git add functions/src/suggestPrice.ts functions/src/index.ts
git commit -m "feat: add suggestPrice Cloud Function with Groq + heuristic fallback"
```

---

### Task 5: VendorComposePage + routing + i18n

**Files:**
- Create: `src/pages/vendor/VendorComposePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

**Interfaces:**
- Consumes: `subscribeToInventory` from `../../services/inventory`; `composeMysteryBox`, `suggestPrice`, `ComposeMysteryBoxResult`, `SuggestPriceResult` from `../../services/ai`; `createListing` from `../../services/listings`; `expiryLabel` from `../../utils/inventoryUtils`

- [ ] **Step 1: Add i18n keys to src/locales/en/translation.json**

Inside `"vendor"` add:
```json
"compose_page_title": "Compose Mystery Box",
"suggest_price": "Suggest Price",
"price_suggestion": "AI recommends {{discount}}% discount — {{reason}}",
"total_value": "Total value",
"ai_box_count": "AI suggests {{n}} boxes",
"expiry_alert": "{{n}} items expiring soon — create a clearance box now",
"compose_clearance": "Compose Clearance Box →"
```

- [ ] **Step 2: Add i18n keys to src/locales/vi/translation.json**

Inside `"vendor"` add:
```json
"compose_page_title": "Tạo hộp bí ẩn",
"suggest_price": "Gợi ý giá",
"price_suggestion": "AI gợi ý giảm {{discount}}% — {{reason}}",
"total_value": "Tổng giá trị",
"ai_box_count": "AI gợi ý {{n}} hộp",
"expiry_alert": "{{n}} sản phẩm sắp hết hạn — tạo hộp thanh lý ngay",
"compose_clearance": "Tạo hộp thanh lý →"
```

- [ ] **Step 3: Create src/pages/vendor/VendorComposePage.tsx**

```tsx
import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToInventory } from '../../services/inventory'
import { composeMysteryBox, suggestPrice } from '../../services/ai'
import type { ComposeMysteryBoxResult, SuggestPriceResult } from '../../services/ai'
import { createListing } from '../../services/listings'
import { expiryLabel } from '../../utils/inventoryUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InventoryItem, ListingCategory } from '../../types'

const ALL_CATEGORIES: ListingCategory[] = [
  'bakery', 'fruit', 'vegetables', 'dairy', 'meat',
  'rice', 'noodles', 'drinks', 'snacks', 'other'
]

const CATEGORY_ICONS: Record<ListingCategory, string> = {
  bakery: '🥐', fruit: '🍎', vegetables: '🥬', dairy: '🥛', meat: '🥩',
  rice: '🍚', noodles: '🍜', drinks: '🥤', snacks: '🍿', other: '📦',
}

function todayAt(hour: number): string {
  const d = new Date(); d.setHours(hour, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

export default function VendorComposePage() {
  const { t, i18n } = useTranslation()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectApplied = useRef(false)

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Map<string, { item: InventoryItem; qty: number }>>(new Map())

  const [discount, setDiscount] = useState(40)
  const [suggestResult, setSuggestResult] = useState<SuggestPriceResult | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [composerResult, setComposerResult] = useState<ComposeMysteryBoxResult | null>(null)
  const [numBoxes, setNumBoxes] = useState(1)
  const [composerLoading, setComposerLoading] = useState(false)
  const [composerError, setComposerError] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState<ListingCategory>('other')
  const [editPrice, setEditPrice] = useState('')
  const [pickupStart, setPickupStart] = useState(todayAt(17))
  const [pickupEnd, setPickupEnd] = useState(todayAt(21))
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    return subscribeToInventory(currentUser.uid, data => {
      setInventoryItems(data)
      setCatalogLoading(false)
      if (!preselectApplied.current) {
        preselectApplied.current = true
        const ids = new Set((searchParams.get('preselect') ?? '').split(',').filter(Boolean))
        if (ids.size > 0) {
          const preMap = new Map<string, { item: InventoryItem; qty: number }>()
          data.forEach(item => { if (ids.has(item.id)) preMap.set(item.id, { item, qty: item.defaultQty }) })
          if (preMap.size > 0) setSelectedItems(preMap)
        }
      }
    })
  }, [currentUser])

  const totalValue = useMemo(() => {
    let sum = 0
    selectedItems.forEach(({ item, qty }) => { sum += item.unitPrice * qty })
    return sum
  }, [selectedItems])

  const currentOriginalPrice = useMemo(
    () => numBoxes > 0 ? Math.round(totalValue / numBoxes / 1000) * 1000 : 0,
    [totalValue, numBoxes]
  )

  const currentSalePrice = useMemo(
    () => Math.round(currentOriginalPrice * (1 - discount / 100) / 1000) * 1000,
    [currentOriginalPrice, discount]
  )

  useEffect(() => {
    if (composerResult) setEditPrice(String(currentSalePrice))
  }, [currentSalePrice])

  const toggleItem = (item: InventoryItem) => {
    setSelectedItems(prev => {
      const next = new Map(prev)
      if (next.has(item.id)) { next.delete(item.id) }
      else { next.set(item.id, { item, qty: item.defaultQty }) }
      return next
    })
  }

  const setItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => {
      const next = new Map(prev)
      const entry = next.get(itemId)
      if (entry) next.set(itemId, { ...entry, qty: Math.max(1, qty) })
      return next
    })
  }

  const handleSuggestPrice = async () => {
    if (!currentUser) return
    setSuggestLoading(true)
    try {
      const r = await suggestPrice({ vendorId: currentUser.uid, targetDiscount: discount })
      setSuggestResult(r)
    } catch { /* fail silently */ }
    finally { setSuggestLoading(false) }
  }

  const handleCompose = async () => {
    if (!currentUser || selectedItems.size === 0) return
    setComposerLoading(true); setComposerError(''); setComposerResult(null)
    try {
      const items = Array.from(selectedItems.values()).map(({ item, qty }) => ({
        name: item.name, quantity: qty, unitPrice: item.unitPrice,
      }))
      const result = await composeMysteryBox({
        items, targetDiscount: discount,
        storeName: currentUser.displayName ?? 'Store',
      })
      setComposerResult(result)
      setNumBoxes(result.numBoxes)
      setEditCategory(result.category as ListingCategory)
      setEditTitle(i18n.language === 'vi' ? result.titleVi : result.titleEn)
      setEditDescription(i18n.language === 'vi' ? result.descriptionVi : result.descriptionEn)
      setEditPrice(String(result.suggestedPrice))
    } catch { setComposerError(t('vendor.ai_error')) }
    finally { setComposerLoading(false) }
  }

  const handlePublish = async () => {
    if (!currentUser || !composerResult) return
    const price = parseInt(editPrice)
    if (!price || price <= 0) return
    setPublishLoading(true); setPublishError('')
    try {
      await createListing({
        vendorId: currentUser.uid, type: 'mystery_box',
        title: editTitle, description: editDescription, category: editCategory,
        price, originalPrice: currentOriginalPrice,
        quantityTotal: numBoxes, quantityRemaining: numBoxes,
        imageUrl: '',
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        status: 'active',
      })
      navigate('/vendor/listings')
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : t('vendor.ai_error'))
    } finally { setPublishLoading(false) }
  }

  const sortedInventory = [...inventoryItems].sort((a, b) => {
    const aExp = expiryLabel(a) !== null; const bExp = expiryLabel(b) !== null
    if (aExp !== bExp) return aExp ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('vendor.compose_page_title')}</h1>

      {/* ZONE 1: Catalog Browser */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">{t('vendor.inventory')}</h2>
        {catalogLoading && <p className="text-slate-400 text-sm">{t('browse.loading')}</p>}
        {!catalogLoading && inventoryItems.length === 0 && (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-3">{t('vendor.no_inventory')}</p>
            <Button variant="outline" onClick={() => navigate('/vendor/inventory')}
              className="border-slate-700 text-slate-300">{t('vendor.go_to_inventory')}</Button>
          </div>
        )}
        <div className="space-y-2">
          {sortedInventory.map(item => {
            const selected = selectedItems.has(item.id)
            const expiring = expiryLabel(item) === 'today' || expiryLabel(item) === 'soon'
            return (
              <div key={item.id} onClick={() => toggleItem(item)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                  selected ? 'border-indigo-500 bg-indigo-950/40'
                  : expiring ? 'border-amber-500/40 bg-slate-800/60'
                  : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}>
                <input type="checkbox" checked={selected} readOnly
                  className="accent-indigo-500 w-4 h-4 pointer-events-none" />
                <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-slate-400 text-xs">{item.unitPrice.toLocaleString('vi-VN')} đ / {item.unit}</p>
                </div>
                {selected && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) - 1)}
                      className="w-7 h-7 rounded bg-slate-700 text-white font-bold hover:bg-slate-600">−</button>
                    <span className="text-white text-sm w-6 text-center">{selectedItems.get(item.id)?.qty ?? 1}</span>
                    <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) + 1)}
                      className="w-7 h-7 rounded bg-slate-700 text-white font-bold hover:bg-slate-600">+</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {selectedItems.size > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-sm">
            <span className="text-slate-400">{selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected</span>
            <span className="text-white font-medium">{t('vendor.total_value')}: {totalValue.toLocaleString('vi-VN')} đ</span>
          </div>
        )}
      </div>

      {/* ZONE 2: Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-slate-300 text-sm mb-2 block">
            {t('vendor.discount_pct')}: {discount}%
          </Label>
          <input type="range" min="20" max="90" step="5" value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="w-full accent-purple-500" />
          <p className="text-slate-500 text-xs mt-1">
            Boxes sell at {100 - discount}% of original value
          </p>
        </div>

        {suggestResult && (
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-lg p-3 flex items-start justify-between gap-2">
            <p className="text-amber-300 text-sm">
              {t('vendor.price_suggestion', { discount: suggestResult.recommendedDiscount, reason: suggestResult.reason })}
            </p>
            <button
              onClick={() => { setDiscount(suggestResult.recommendedDiscount); setSuggestResult(null) }}
              className="text-amber-400 hover:text-amber-300 text-xs font-medium whitespace-nowrap">
              Apply
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSuggestPrice} disabled={suggestLoading} variant="outline"
            className="border-indigo-600 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40">
            {suggestLoading ? '…' : t('vendor.suggest_price')}
          </Button>
          <Button onClick={handleCompose} disabled={selectedItems.size === 0 || composerLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
            {composerLoading ? t('vendor.ai_composing') : t('vendor.ai_compose_btn')}
          </Button>
        </div>

        {composerError && <p className="text-red-400 text-sm">{composerError}</p>}

        {composerResult && (
          <div className="bg-indigo-950/40 border border-indigo-600/40 rounded-xl p-4 space-y-3">
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide">
              🤖 {t('vendor.ai_box_count', { n: numBoxes })}
            </p>
            <div className="flex items-center justify-center gap-6 py-1">
              <button onClick={() => setNumBoxes(n => Math.max(1, n - 1))}
                className="w-12 h-12 rounded-xl bg-slate-700 text-white font-bold text-xl hover:bg-slate-600 active:scale-95 transition-transform">
                −
              </button>
              <div className="text-center">
                <p className="text-white text-3xl font-bold">{numBoxes}</p>
                <p className="text-slate-400 text-xs">{t('vendor.num_boxes')}</p>
              </div>
              <button onClick={() => setNumBoxes(n => Math.min(20, n + 1))}
                className="w-12 h-12 rounded-xl bg-slate-700 text-white font-bold text-xl hover:bg-slate-600 active:scale-95 transition-transform">
                +
              </button>
            </div>
            <p className="text-center text-sm text-slate-400">
              <span className="text-white font-medium">{currentOriginalPrice.toLocaleString('vi-VN')} đ</span>
              {' → '}
              <span className="text-green-400 font-medium">{currentSalePrice.toLocaleString('vi-VN')} đ</span>
              {' each'}
            </p>
          </div>
        )}
      </div>

      {/* ZONE 3: Editable Result */}
      {composerResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <p className="text-indigo-400 text-xs font-medium uppercase tracking-wide">
            {t('vendor.ai_suggestion')}
          </p>
          <div>
            <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.category')}</Label>
            <Select value={editCategory} onValueChange={v => setEditCategory(v as ListingCategory)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {ALL_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="text-white">{t(`categories.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.title')}</Label>
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.description')}</Label>
            <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
              rows={3} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.price')}</Label>
            <Input value={editPrice} onChange={e => setEditPrice(e.target.value)}
              type="number" min="1000" className="bg-slate-800 border-slate-700 text-white" />
            {parseInt(editPrice) <= 0 && (
              <p className="text-red-400 text-xs mt-1">Price must be &gt; 0</p>
            )}
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.pickup_window')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)}
                type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
              <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)}
                type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
            </div>
          </div>
          {publishError && <p className="text-red-400 text-sm">{publishError}</p>}
          <Button onClick={handlePublish}
            disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">
            {publishLoading ? t('vendor.saving') : t('vendor.publish_listing')}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add route to src/App.tsx**

Add import:
```tsx
import VendorComposePage from './pages/vendor/VendorComposePage'
```

Inside the vendor `<Route>` group add:
```tsx
<Route path="/vendor/compose" element={<VendorComposePage />} />
```

- [ ] **Step 5: Smoke test compose page**

Run `npm run dev`. Navigate to `/vendor/compose`. Verify:
- If no inventory items: empty state + "Go to Inventory →" link
- After adding items in `/vendor/inventory`: items appear as checkbox cards
- Check 2+ items → selection summary bar appears
- Click "Suggest Price" → hint appears with recommended discount %
- Click "Apply" in the hint → discount slider updates
- Click "Compose with AI" → spinner, then AI Suggestion Widget appears with numBoxes
- Click − and + → numBoxes changes, price updates live in Zone 3
- Edit title/description/price → editable
- Click "Publish Listing" → redirects to `/vendor/listings` with new listing

- [ ] **Step 6: Commit**

```bash
git add src/pages/vendor/VendorComposePage.tsx src/App.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add full-page VendorComposePage with catalog browser, AI box count, ± widget"
```

---

### Task 6: ListingsPage cleanup — remove modal, button → Link

**Files:**
- Modify: `src/pages/vendor/ListingsPage.tsx`

- [ ] **Step 1: Replace src/pages/vendor/ListingsPage.tsx**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing } from '../../services/listings'
import { Button } from '@/components/ui/button'
import type { Listing } from '../../types'

export default function ListingsPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    return subscribeToVendorListings(currentUser.uid, data => {
      setListings(data); setLoading(false)
    })
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400', sold_out: 'text-orange-400', expired: 'text-slate-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('vendor.myListings')}</h1>
        <div className="flex gap-2">
          <Link to="/vendor/compose">
            <Button className="bg-purple-600 hover:bg-purple-500">{t('vendor.ai_composer')}</Button>
          </Link>
          <Link to="/vendor/listings/new">
            <Button className="bg-indigo-600 hover:bg-indigo-500">{t('vendor.newListing')}</Button>
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-400">{t('browse.loading')}</p>}
      {!loading && listings.length === 0 && (
        <p className="text-slate-400">{t('vendor.noListings')}</p>
      )}

      <div className="space-y-3">
        {listings.map(l => (
          <div key={l.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {l.imageUrl
                ? <img src={l.imageUrl} className="w-full h-full object-cover rounded-lg" alt={l.title} />
                : '🎁'}
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
                <Button variant="outline" size="sm"
                  className="border-slate-700 text-slate-300 hover:text-white">{t('vendor.edit')}</Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)}>
                {t('vendor.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Smoke test**

Navigate to `/vendor/listings`. Verify:
- "AI Box Composer" button navigates to `/vendor/compose` (no modal opens)
- "+ New Listing" still works
- Edit and Delete still work

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/ListingsPage.tsx
git commit -m "feat: replace AI composer modal with link to /vendor/compose"
```

---

### Task 7: Dashboard expiry alert banner

**Files:**
- Modify: `src/pages/vendor/VendorDashboardPage.tsx`

**Interfaces:**
- Consumes: `subscribeToInventory` from `../../services/inventory`; `getExpiringItems`, `expiryLabel` from `../../utils/inventoryUtils`; `InventoryItem` from `../../types`

- [ ] **Step 1: Update VendorDashboardPage.tsx**

Add these imports at the top of the file (alongside existing imports):
```tsx
import { Link } from 'react-router-dom'
import { subscribeToInventory } from '../../services/inventory'
import { getExpiringItems, expiryLabel } from '../../utils/inventoryUtils'
import type { InventoryItem } from '../../types'
```

Add this state inside `VendorDashboardPage` (after the existing state declarations):
```tsx
const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
const [alertDismissed, setAlertDismissed] = useState(
  () => sessionStorage.getItem(`dismissed_expiry_${new Date().toDateString()}`) === '1'
)
```

In the existing `useEffect` that subscribes to listings and orders, add a third subscription and update the cleanup:
```tsx
useEffect(() => {
  if (!currentUser) return
  const u1 = subscribeToVendorListings(currentUser.uid, setListings)
  const u2 = subscribeToVendorOrders(currentUser.uid, setOrders)
  const u3 = subscribeToInventory(currentUser.uid, setInventoryItems)
  return () => { u1(); u2(); u3() }
}, [currentUser])
```

Add a computed value after the existing computed values (`activeListings`, `pendingOrders`, `revenue`):
```tsx
const expiringItems = getExpiringItems(inventoryItems, 48)
```

Add a dismiss handler inside the component (after `handleBankSave`):
```tsx
const dismissExpiryAlert = () => {
  sessionStorage.setItem(`dismissed_expiry_${new Date().toDateString()}`, '1')
  setAlertDismissed(true)
}
```

In the JSX, inside `{tab === 'overview' && (` and before the `<div className="grid grid-cols-1 sm:grid-cols-3 ...">` stat cards grid, add:
```tsx
{!alertDismissed && expiringItems.length > 0 && (
  <div className={`border rounded-xl p-4 mb-6 ${
    expiringItems.some(i => expiryLabel(i) === 'today' || expiryLabel(i) === 'expired')
      ? 'border-red-500/60 bg-red-950/20'
      : 'border-amber-500/60 bg-amber-950/20'
  }`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-white font-medium mb-2">
          ⚠️ {t('vendor.expiry_alert', { n: expiringItems.length })}
        </p>
        <ul className="space-y-1">
          {expiringItems.slice(0, 3).map(item => {
            const label = expiryLabel(item)
            const labelKey = label === 'expired' ? 'vendor.expired'
              : label === 'today' ? 'vendor.expires_today'
              : 'vendor.expires_soon'
            return (
              <li key={item.id} className="text-slate-300 text-sm">
                · {item.name} ({t(labelKey)})
              </li>
            )
          })}
        </ul>
      </div>
      <button onClick={dismissExpiryAlert} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
    </div>
    <div className="mt-3 flex justify-end">
      <Link
        to={`/vendor/compose?preselect=${expiringItems.map(i => i.id).join(',')}`}
        className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {t('vendor.compose_clearance')}
      </Link>
    </div>
  </div>
)}
```

- [ ] **Step 2: Smoke test**

In `/vendor/inventory`, add an item with bestBefore = today. Navigate to `/vendor` (dashboard). Verify:
- Alert banner appears above stat cards with the item name
- Banner has red border (expires today)
- "Compose Clearance Box →" link navigates to `/vendor/compose?preselect=<itemId>` and the item is pre-checked
- × dismisses the banner (gone until next day's session)

- [ ] **Step 3: Run all tests**

```
npx vitest run
```
Expected: all 9 inventory tests + prior 34 tests = 43 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/pages/vendor/VendorDashboardPage.tsx
git commit -m "feat: add expiry alert banner on vendor dashboard with one-click compose shortcut"
```

---

## Self-Review Checklist

- [x] Spec §3 (inventory page): Task 1 (service/types) + Task 2 (page)
- [x] Spec §4 (compose page, 3 zones): Task 5
- [x] Spec §5 (expiry alert banner): Task 7
- [x] Spec §6 (composeMysteryBox update): Task 3
- [x] Spec §6 (suggestPrice function): Task 4
- [x] Spec §7 (i18n keys): Tasks 2 and 5
- [x] ListingsPage cleanup (modal removal): Task 6
- [x] Firestore rules for inventory subcollection: Task 1
- [x] Pre-selection via URL param: VendorComposePage (Task 5) + dashboard link (Task 7)
- [x] Type consistency: `ComposeMysteryBoxResult.numBoxes` added in Task 3, consumed in Task 5; `SuggestPriceResult` defined in Task 3, consumed in Task 5
- [x] `currentOriginalPrice` used in publish payload (not stale `composerResult.originalPrice`)
- [x] `suggestPrice` returns `recommendedDiscount` (not a price) — consistent across function (Task 4) and UI (Task 5)
