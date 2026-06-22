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

function localDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nowPlusHours(h: number): string {
  return localDatetime(new Date(Date.now() + h * 3600_000))
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
  const [pickupStart, setPickupStart] = useState(nowPlusHours(0))
  const [pickupEnd, setPickupEnd] = useState(nowPlusHours(3))
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
          return updateInventoryItem(currentUser.uid, item.id, { defaultQty: Math.max(0, remaining) })
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
      <h1 className="text-2xl font-bold text-on-surface">{t('vendor.compose_page_title')}</h1>

      {/* ZONE 1: Catalog Browser */}
      <div className="bg-surface-container-highest border border-secondary-token/30 rounded-xl p-5">
        <h2 className="text-on-surface font-semibold mb-4">{t('vendor.inventory')}</h2>
        {catalogLoading && <p className="text-on-surface-variant text-sm">{t('browse.loading')}</p>}
        {!catalogLoading && inventoryItems.length === 0 && (
          <div className="text-center py-6">
            <p className="text-on-surface-variant mb-3">{t('vendor.no_inventory')}</p>
            <Button variant="outline" onClick={() => navigate('/vendor/inventory')}
              className="border-outline-variant text-on-surface-variant">{t('vendor.go_to_inventory')}</Button>
          </div>
        )}
        <div className="space-y-2">
          {sortedInventory.map(item => {
            const selected = selectedItems.has(item.id)
            const expiring = expiryLabel(item) === 'today' || expiryLabel(item) === 'soon'
            return (
              <div key={item.id} onClick={() => toggleItem(item)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                  selected ? 'border-primary bg-primary/10'
                  : expiring ? 'border-amber-500/40 bg-surface-container-high/60'
                  : 'border-outline-variant bg-surface-container-high/40 hover:bg-surface-container-high'
                }`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-token">✨</span>
                  <input type="checkbox" checked={selected} readOnly
                    className="accent-indigo-500 w-4 h-4 pointer-events-none" />
                </div>
                <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-medium">{item.name}</p>
                  <p className="text-on-surface-variant text-xs">{item.unitPrice.toLocaleString('vi-VN')} đ / {item.unit}</p>
                </div>
                {selected && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) - 1)}
                      className="w-7 h-7 rounded bg-surface-container text-on-surface font-bold hover:bg-surface-container-high">−</button>
                    <span className="text-on-surface text-sm w-6 text-center">{selectedItems.get(item.id)?.qty ?? 1}</span>
                    <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) + 1)}
                      className="w-7 h-7 rounded bg-surface-container text-on-surface font-bold hover:bg-surface-container-high">+</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {selectedItems.size > 0 && (
          <div className="mt-3 pt-3 border-t border-outline-variant flex justify-between text-sm">
            <span className="text-on-surface-variant">
              {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected
            </span>
            <span className="text-on-surface font-medium">
              {t('vendor.total_value')}: {totalValue.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}
      </div>

      {/* ZONE 2: Controls */}
      <div className="bg-surface-container-highest border border-secondary-token/30 rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-on-surface-variant text-sm mb-2 block">
            {t('vendor.discount_pct')}: {discount}%
          </Label>
          <input type="range" min="20" max="90" step="5" value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="w-full accent-purple-500" />
          <p className="text-outline text-xs mt-1">
            Boxes sell at {100 - discount}% of original value
          </p>
        </div>

        {suggestResult && (
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start justify-between gap-2">
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
            className="border-primary text-primary hover:text-on-surface hover:bg-primary/10">
            {suggestLoading ? '…' : t('vendor.suggest_price')}
          </Button>
          <button
            onClick={handleCompose}
            disabled={selectedItems.size === 0 || composerLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary-container text-on-secondary font-semibold hover:opacity-90 transition-opacity flex-1 justify-center disabled:opacity-50">
            {composerLoading ? t('vendor.ai_composing') : t('vendor.ai_compose_btn')}
          </button>
        </div>

        {composerError && <p className="text-red-400 text-sm">{composerError}</p>}

        {composerResult && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
            <p className="text-primary text-xs font-medium uppercase tracking-wide">
              🤖 {t('vendor.ai_box_count', { n: numBoxes })}
            </p>
            <div className="flex items-center justify-center gap-6 py-1">
              <button onClick={() => setNumBoxes(n => Math.max(1, n - 1))}
                className="w-12 h-12 rounded-xl bg-surface-container text-on-surface font-bold text-xl hover:bg-surface-container-high active:scale-95 transition-transform">
                −
              </button>
              <div className="text-center">
                <p className="text-on-surface text-3xl font-bold">{numBoxes}</p>
                <p className="text-on-surface-variant text-xs">{t('vendor.num_boxes')}</p>
              </div>
              <button onClick={() => setNumBoxes(n => Math.min(20, n + 1))}
                className="w-12 h-12 rounded-xl bg-surface-container text-on-surface font-bold text-xl hover:bg-surface-container-high active:scale-95 transition-transform">
                +
              </button>
            </div>
            <p className="text-center text-sm text-on-surface-variant">
              <span className="text-on-surface font-medium">{currentOriginalPrice.toLocaleString('vi-VN')} đ</span>
              {' → '}
              <span className="text-green-400 font-medium">{currentSalePrice.toLocaleString('vi-VN')} đ</span>
              {' each'}
            </p>

            {/* Packing guide — vendor only */}
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-primary text-xs font-medium mb-2">📦 Packing guide (per box)</p>
              <div className="space-y-1">
                {packingGuide.map(({ name, icon, perBox, leftover }) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{icon} {name}</span>
                    <span className="text-on-surface font-medium">
                      {perBox > 0 ? `×${perBox}` : <span className="text-outline">—</span>}
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
        <div className="bg-surface-container-highest border border-secondary-token/30 rounded-xl p-5 space-y-4">
          <p className="text-primary text-xs font-medium uppercase tracking-wide">
            {t('vendor.ai_suggestion')}
          </p>
          <div>
            <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.category')}</Label>
            <Select value={editCategory} onValueChange={v => setEditCategory(v as ListingCategory)}>
              <SelectTrigger className="bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-surface-container-high border-outline-variant">
                {ALL_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="text-on-surface">{t(`categories.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.title')}</Label>
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-surface-container-lowest border border-secondary-token/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-secondary-token transition-colors" />
          </div>
          <div>
            <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.description')}</Label>
            <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
              rows={3} className="bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token" />
          </div>
          <div>
            <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.price')}</Label>
            <Input value={editPrice} onChange={e => setEditPrice(e.target.value)}
              type="number" min="1000" className="bg-surface-container-high border-secondary-token/30 text-on-surface rounded-xl focus:border-secondary-token" />
            {parseInt(editPrice) <= 0 && (
              <p className="text-red-400 text-xs mt-1">Price must be &gt; 0</p>
            )}
          </div>
          <div>
            <Label className="text-on-surface-variant text-sm mb-1 block">{t('vendor.pickup_window')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)}
                type="datetime-local" className="bg-surface-container-high border-secondary-token/30 text-on-surface text-xs rounded-xl focus:border-secondary-token" />
              <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)}
                type="datetime-local" className="bg-surface-container-high border-secondary-token/30 text-on-surface text-xs rounded-xl focus:border-secondary-token" />
            </div>
          </div>
          {publishError && <p className="text-red-400 text-sm">{publishError}</p>}
          <button
            onClick={handlePublish}
            disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary-container text-on-secondary font-semibold hover:opacity-90 transition-opacity w-full justify-center disabled:opacity-50">
            {publishLoading ? t('vendor.saving') : t('vendor.publish_listing')}
          </button>
        </div>
      )}
    </div>
  )
}
