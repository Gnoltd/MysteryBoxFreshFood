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
