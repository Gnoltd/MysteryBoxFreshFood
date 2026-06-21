import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToInventory, updateInventoryItem, deleteInventoryItem } from '../../services/inventory'
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

  const packingGuide = useMemo(() => {
    if (numBoxes < 1) return []
    return Array.from(selectedItems.values()).map(({ item, qty }) => ({
      name: item.name,
      icon: CATEGORY_ICONS[item.category],
      perBox: Math.floor(qty / numBoxes),
      leftover: qty % numBoxes,
    }))
  }, [selectedItems, numBoxes])

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
      const boxContents = packingGuide
        .filter(p => p.perBox > 0)
        .map(p => ({ name: p.name, qty: p.perBox }))

      await createListing({
        vendorId: currentUser.uid, type: 'mystery_box',
        title: editTitle, description: editDescription, category: editCategory,
        price, originalPrice: currentOriginalPrice,
        quantityTotal: numBoxes, quantityRemaining: numBoxes,
        imageUrl: '',
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        status: 'active',
        boxContents,
      })

      // Decrement inventory — delete item if fully used, otherwise reduce qty
      await Promise.all(
        Array.from(selectedItems.values()).map(({ item, qty }) => {
          const remaining = item.defaultQty - qty
          if (remaining <= 0) return deleteInventoryItem(currentUser.uid, item.id)
          return updateInventoryItem(currentUser.uid, item.id, { defaultQty: remaining })
        })
      )

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
            <span className="text-slate-400">
              {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
            </span>
            <span className="text-white font-medium">
              {t('vendor.total_value')}: {totalValue.toLocaleString('vi-VN')} đ
            </span>
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
              {t('vendor.price_suggestion', {
                discount: suggestResult.recommendedDiscount,
                reason: suggestResult.reason,
              })}
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

            {/* Packing guide — vendor only */}
            <div className="mt-3 pt-3 border-t border-indigo-700/40">
              <p className="text-indigo-300 text-xs font-medium mb-2">📦 Packing guide (per box)</p>
              <div className="space-y-1">
                {packingGuide.map(({ name, icon, perBox, leftover }) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{icon} {name}</span>
                    <span className="text-white font-medium">
                      {perBox > 0 ? `×${perBox}` : <span className="text-slate-500">—</span>}
                      {leftover > 0 && (
                        <span className="text-amber-400 text-xs ml-1">+{leftover} leftover</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
