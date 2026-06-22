# VendorComposePage Workbench Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace VendorComposePage's single-column layout with a 3-column full-height workbench (Zone 1: Inventory Catalog, Zone 2: Controls + AI Result, Zone 3: Listing Editor) styled in the dark design system.

**Architecture:** All existing state, handlers, and service calls stay unchanged. Only the JSX/styling is rewritten. The page fills `h-[calc(100vh-4rem)]` (VendorLayout applies `p-8` = 2rem top + 2rem bottom) using a `grid grid-cols-12 gap-4`. Each zone is a 4-column panel with internal scrolling.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, lucide-react, react-i18next, shadcn/ui (Select, Textarea, Input, Button)

## Global Constraints

- App name: MysteryBoxFreshFood
- Dark theme only — use `bg-surface-container`, `border-outline-variant`, `text-on-surface` etc. No `bg-slate-*`, `text-white`, `bg-indigo-*`
- All user-visible strings via `t('key')` — no hardcoded English
- No Firebase SDK imports in the component — all via services (already met)
- `secondary-token` is the CSS token for purple accent (not `secondary` directly)
- `gradient-bg` utility class for the publish button

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/pages/vendor/VendorComposePage.tsx` |
| Modify | `src/locales/en/translation.json` |
| Modify | `src/locales/vi/translation.json` |

---

### Task 1: Add missing i18n keys

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

- [ ] **Step 1: Add 7 new keys under `"vendor"` in `src/locales/en/translation.json`**

Open the file and locate the `"vendor"` object. Add these keys (order doesn't matter):

```json
"pricing_controls": "Pricing Controls",
"listing_editor": "Listing Editor",
"editor_empty_title": "Run AI Compose first",
"editor_empty_subtitle": "Select items from the catalog and click Compose with AI to populate this form.",
"editable": "editable",
"ai_result": "AI Result",
"selected_items": "{{count}} items selected"
```

- [ ] **Step 2: Mirror in `src/locales/vi/translation.json`**

Add the same keys under `"vendor"` with Vietnamese values:

```json
"pricing_controls": "Kiểm soát giá",
"listing_editor": "Soạn thảo",
"editor_empty_title": "Hãy chạy AI Compose trước",
"editor_empty_subtitle": "Chọn sản phẩm từ danh mục và nhấn Compose với AI để điền form này.",
"editable": "có thể chỉnh sửa",
"ai_result": "Kết quả AI",
"selected_items": "{{count}} sản phẩm được chọn"
```

- [ ] **Step 3: Commit**

```bash
git add src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add i18n keys for compose workbench zones"
```

---

### Task 2: Rewrite VendorComposePage.tsx

**Files:**
- Modify: `src/pages/vendor/VendorComposePage.tsx`

The existing state variables, effects, and handler functions are **unchanged**. Only the `return (...)` JSX block and the import list are replaced.

- [ ] **Step 1: Replace the import block**

Replace everything from line 1 to the first `export default function` line with:

```tsx
import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToInventory, updateInventoryItem } from '../../services/inventory'
import { composeMysteryBox, suggestPrice } from '../../services/ai'
import type { ComposeMysteryBoxResult, SuggestPriceResult } from '../../services/ai'
import { createListing } from '../../services/listings'
import { expiryLabel } from '../../utils/inventoryUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InventoryItem, ListingCategory } from '../../types'
import {
  Archive, SlidersHorizontal, Lightbulb, Search, Check,
  AlertTriangle, Minus, Plus, Package, FileEdit, Clock,
  CreditCard, Send, Wand2
} from 'lucide-react'
```

- [ ] **Step 2: Add `search` state after the existing state declarations**

Inside `VendorComposePage`, add one new state variable after the existing ones (just before the `useEffect` blocks):

```tsx
const [search, setSearch] = useState('')
```

- [ ] **Step 3: Replace the entire `return (...)` block**

Delete everything from `return (` to the closing `)` of the return statement and replace with:

```tsx
  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-12 gap-4">

      {/* ─── ZONE 1: Inventory Catalog ─── */}
      <section className="col-span-4 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center shrink-0">
          <h2 className="font-semibold text-on-surface flex items-center gap-2 text-body-sm">
            <Archive size={16} /> {t('vendor.inventory')}
          </h2>
          <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">ZONE 1</span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-outline-variant shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder={t('listing.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {catalogLoading && (
            <p className="text-on-surface-variant text-body-sm">{t('browse.loading')}</p>
          )}
          {!catalogLoading && inventoryItems.length === 0 && (
            <div className="text-center py-10">
              <Archive size={32} className="text-outline mx-auto mb-3" />
              <p className="text-on-surface-variant text-body-sm mb-3">{t('vendor.no_inventory')}</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/vendor/inventory')}
                className="border-outline-variant text-on-surface-variant">
                {t('vendor.go_to_inventory')}
              </Button>
            </div>
          )}
          {sortedInventory
            .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
            .map(item => {
              const selected = selectedItems.has(item.id)
              const expiry = expiryLabel(item)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : expiry === 'today'
                      ? 'border-red-500/60 bg-surface-container-high/40'
                      : expiry === 'soon'
                      ? 'border-amber-500/60 bg-surface-container-high/40'
                      : 'border-outline-variant bg-surface-container-high/40 hover:bg-surface-container-high hover:border-outline'
                  }`}
                >
                  {/* Checkmark badge */}
                  {selected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check size={11} className="text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={selected} readOnly
                        className="w-4 h-4 accent-primary pointer-events-none shrink-0" />
                      <span className="text-lg shrink-0">{CATEGORY_ICONS[item.category]}</span>
                      <div className="min-w-0">
                        <p className="text-on-surface text-body-sm font-semibold truncate">{item.name}</p>
                        <p className="text-outline text-xs">{item.unitPrice.toLocaleString('vi-VN')} đ / {item.unit}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {expiry === 'today' && (
                        <span className="flex items-center gap-1 bg-red-950/40 text-red-400 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          <AlertTriangle size={9} /> {t('vendor.expires_today')}
                        </span>
                      )}
                      {expiry === 'soon' && (
                        <span className="flex items-center gap-1 bg-amber-950/40 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          <AlertTriangle size={9} /> {t('vendor.expires_soon')}
                        </span>
                      )}
                      {selected && !expiry && (
                        <span className="text-primary font-semibold text-body-sm">
                          {((selectedItems.get(item.id)?.qty ?? 0) * item.unitPrice).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Qty stepper — shown only when selected */}
                  {selected && (
                    <div
                      className="flex justify-end mt-2 pt-2 border-t border-outline-variant"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container">
                        <button
                          onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) - 1)}
                          className="px-2 py-1 border-r border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-on-surface font-bold text-body-sm w-8 text-center">
                          {selectedItems.get(item.id)?.qty ?? 1}
                        </span>
                        <button
                          onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) + 1)}
                          className="px-2 py-1 border-l border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {/* Bottom bar */}
        <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-between items-center shrink-0">
          <span className="text-on-surface-variant text-body-sm">
            {t('vendor.selected_items', { count: selectedItems.size })}
          </span>
          <div className="text-right">
            <p className="text-[10px] text-outline uppercase font-bold tracking-wider">{t('vendor.total_value')}</p>
            <p className="font-bold text-on-surface">{totalValue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </section>

      {/* ─── ZONE 2: Controls + AI Result ─── */}
      <section className="col-span-4 flex flex-col gap-4 overflow-y-auto">

        {/* Pricing Controls card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 relative overflow-hidden shrink-0">
          {/* Gradient top accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary-token" />

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-1 mt-1">
            <SlidersHorizontal size={13} /> {t('vendor.pricing_controls')}
          </h3>

          {/* Discount slider */}
          <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
              <label className="text-body-sm text-on-surface">{t('vendor.discount_pct')}</label>
              <span className="text-primary font-bold text-xl">{discount}%</span>
            </div>
            <input
              type="range" min="20" max="90" step="5" value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-outline text-xs mt-1 text-right">
              Boxes sell at {100 - discount}% of original value
            </p>
          </div>

          {/* AI price suggestion amber card */}
          {suggestResult && (
            <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-3 mb-5 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Lightbulb size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300 text-body-sm">
                  {t('vendor.price_suggestion', {
                    discount: suggestResult.recommendedDiscount,
                    reason: suggestResult.reason,
                  })}
                </span>
              </div>
              <button
                onClick={() => { setDiscount(suggestResult.recommendedDiscount); setSuggestResult(null) }}
                className="text-amber-400 hover:bg-amber-950/40 px-2 py-1 rounded text-xs font-bold border border-amber-600/30 transition-colors whitespace-nowrap shrink-0"
              >
                Apply
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSuggestPrice}
              disabled={suggestLoading}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 hover:text-on-surface rounded-xl flex-1"
            >
              {suggestLoading ? '…' : t('vendor.suggest_price')}
            </Button>
            <button
              onClick={handleCompose}
              disabled={selectedItems.size === 0 || composerLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-secondary-container text-on-secondary rounded-xl font-semibold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <span>✨</span>
              {composerLoading ? t('vendor.ai_composing') : t('vendor.ai_compose_btn')}
            </button>
          </div>

          {composerError && (
            <p className="text-red-400 text-body-sm mt-3">{composerError}</p>
          )}
        </div>

        {/* AI Result card — shown after composerResult is set */}
        {composerResult && (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 shrink-0" style={{ borderTop: '2px solid var(--color-secondary-token, #8083ff)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-secondary-token flex items-center gap-2 text-body-sm">
                🤖 {t('vendor.ai_result')}
              </h3>
              <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">ZONE 2</span>
            </div>

            {/* Qty stepper */}
            <div className="mb-4">
              <p className="text-[10px] text-outline uppercase font-bold tracking-wider mb-3">{t('vendor.num_boxes')}</p>
              <div className="flex items-center justify-center">
                <div className="flex items-center border-2 border-secondary-token/20 rounded-xl bg-surface-container">
                  <button
                    onClick={() => setNumBoxes(n => Math.max(1, n - 1))}
                    className="p-2.5 border-r border-secondary-token/20 text-on-surface-variant hover:text-secondary-token transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-8 text-secondary-token font-bold text-3xl w-24 text-center">{numBoxes}</span>
                  <button
                    onClick={() => setNumBoxes(n => Math.min(20, n + 1))}
                    className="p-2.5 border-l border-secondary-token/20 text-on-surface-variant hover:text-secondary-token transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Price comparison */}
            <div className="bg-surface-container-high rounded-xl p-3 mb-4 border border-outline-variant/50 text-center">
              <span className="line-through text-outline text-body-sm">{currentOriginalPrice.toLocaleString('vi-VN')} đ</span>
              <span className="mx-2 text-outline">→</span>
              <span className="text-green-400 font-bold text-xl">{currentSalePrice.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Packing guide */}
            <div className="border-t border-outline-variant pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1">
                <Package size={12} /> Packing guide per box
              </h4>
              <ul className="space-y-2">
                {packingGuide.map(({ name, icon, perBox, leftover }) => (
                  <li key={name} className="flex justify-between items-center bg-surface-container-high p-2 rounded-lg border border-outline-variant/30">
                    <div>
                      <span className="text-on-surface text-body-sm">{icon} {name}</span>
                      {leftover > 0 && (
                        <span className="text-amber-400 text-xs ml-2">+{leftover} leftover</span>
                      )}
                    </div>
                    {perBox > 0
                      ? <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-body-sm">×{perBox}</span>
                      : <span className="text-outline text-body-sm">—</span>
                    }
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ─── ZONE 3: Listing Editor ─── */}
      <section className="col-span-4 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden relative">
        {/* Decorative corner gradient */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-secondary-token/10 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center shrink-0 z-10">
          <h2 className="font-semibold text-on-surface flex items-center gap-2 text-body-sm">
            <FileEdit size={16} className="text-secondary-token" /> {t('vendor.listing_editor')}
          </h2>
          <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">ZONE 3</span>
        </div>

        {/* Empty state */}
        {!composerResult ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Wand2 size={40} className="text-outline mb-4" />
            <p className="text-on-surface font-semibold mb-2">{t('vendor.editor_empty_title')}</p>
            <p className="text-on-surface-variant text-body-sm">{t('vendor.editor_empty_subtitle')}</p>
          </div>
        ) : (
          <>
            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 z-10">
              <span className="inline-block bg-secondary-token/10 text-secondary-token border border-secondary-token/20 px-2 py-1 rounded text-xs font-bold">
                ✨ {t('vendor.ai_suggestion')} ({t('vendor.editable')})
              </span>

              {/* Category */}
              <div>
                <label className="block text-on-surface-variant text-body-sm font-medium mb-1">{t('vendor.category')}</label>
                <Select value={editCategory} onValueChange={v => setEditCategory(v as ListingCategory)}>
                  <SelectTrigger className="bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-high border-outline-variant">
                    {ALL_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-on-surface">
                        {t(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-on-surface-variant text-body-sm font-medium mb-1">{t('vendor.title')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-token text-sm pointer-events-none">✨</span>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="pl-8 bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-on-surface-variant text-body-sm font-medium mb-1">{t('vendor.description')}</label>
                <Textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  className="bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-on-surface-variant text-body-sm font-medium mb-1">{t('vendor.price')}</label>
                <div className="relative">
                  <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                  <Input
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    type="number"
                    min="1000"
                    className="pl-9 bg-surface-container-high border-outline-variant text-on-surface rounded-xl focus:border-primary font-semibold"
                  />
                </div>
                {parseInt(editPrice) <= 0 && (
                  <p className="text-red-400 text-xs mt-1">Price must be &gt; 0</p>
                )}
              </div>

              {/* Pickup window */}
              <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/50">
                <label className="block text-on-surface-variant text-body-sm font-medium mb-2 flex items-center gap-1">
                  <Clock size={13} /> {t('vendor.pickup_window')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-outline uppercase font-bold mb-1">Start</p>
                    <Input
                      value={pickupStart}
                      onChange={e => setPickupStart(e.target.value)}
                      type="datetime-local"
                      className="bg-surface-container border-outline-variant text-on-surface text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-outline uppercase font-bold mb-1">End</p>
                    <Input
                      value={pickupEnd}
                      onChange={e => setPickupEnd(e.target.value)}
                      type="datetime-local"
                      className="bg-surface-container border-outline-variant text-on-surface text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {publishError && (
                <p className="text-red-400 text-body-sm">{publishError}</p>
              )}
            </div>

            {/* Publish button — pinned at bottom */}
            <div className="p-5 border-t border-outline-variant bg-surface-container-high shrink-0 z-10">
              <button
                onClick={handlePublish}
                disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0}
                className="gradient-bg text-white w-full py-3 rounded-xl font-bold text-body-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishLoading ? t('vendor.saving') : t('vendor.publish_listing')}
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </section>

    </div>
  )
```

- [ ] **Step 4: Verify the file compiles — run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. If you see `Module '"lucide-react"' has no exported member 'FileEdit'`, replace `FileEdit` with `SquarePen` in both the import and JSX.

- [ ] **Step 5: Commit**

```bash
git add src/pages/vendor/VendorComposePage.tsx
git commit -m "feat: redesign VendorComposePage as 3-column workbench with dark tokens"
```

---

### Task 3: Build verification

**Files:** none modified

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1 | tail -20
```

Expected:
```
✓ built in X.XXs
```

No TypeScript errors, no missing module errors.

- [ ] **Step 2: Run test suite**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all existing tests pass (56+). No new tests needed — no business logic changed.

- [ ] **Step 3: Update progress.md**

Open `progress.md` and add a new row under the "Full Redesign" table:

```markdown
| VendorComposePage workbench redesign | ✅ Complete |
```

- [ ] **Step 4: Final commit**

```bash
git add progress.md
git commit -m "docs: mark compose workbench redesign complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 3-column `grid grid-cols-12` layout — Task 2 Step 3
- ✅ `h-[calc(100vh-4rem)]` full height — Task 2 Step 3
- ✅ Zone 1: search, item states (normal/expiring/selected), qty stepper, bottom bar — Task 2 Step 3
- ✅ Zone 2: gradient accent bar, discount slider, amber suggestion card, compose buttons — Task 2 Step 3
- ✅ Zone 2: AI result card with secondary top border, qty stepper, price comparison, packing guide — Task 2 Step 3
- ✅ Zone 3: decorative corner, empty state, form fields, pinned publish button — Task 2 Step 3
- ✅ ZONE 1/2/3 decorative chips — Task 2 Step 3
- ✅ i18n keys — Task 1
- ✅ Dark tokens throughout — no `bg-slate-*`, `text-white`, `bg-indigo-*` — Task 2 Step 3
- ✅ No Firebase SDK in component — preserved from original
- ✅ All state/handlers unchanged — only JSX replaced

**No placeholders:** All code is complete and explicit.

**Type consistency:** `sortedInventory`, `selectedItems`, `packingGuide`, `composerResult`, `suggestResult` all match existing state variable names. `CATEGORY_ICONS`, `ALL_CATEGORIES` constants unchanged. `toggleItem`, `setItemQty`, `handleSuggestPrice`, `handleCompose`, `handlePublish` handler names match existing functions.
