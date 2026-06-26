import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createListing, getListing, updateListing } from '../../services/listings'
import { uploadListingImage } from '../../services/storage'
import { subscribeToInventory } from '../../services/inventory'
import { GradientButton } from '../../components/shared/GradientButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Timestamp } from 'firebase/firestore'
import type { InventoryItem, ListingCategory } from '../../types'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, Minus, Package, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { distributeBoxes, formatBoxItem } from '../../utils/boxDistribution'

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CATEGORIES: ListingCategory[] = ['bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'drinks', 'other']

interface BoxEntry {
  inventoryId?: string   // set when sourced from inventory
  name: string
  qty: number
  unit: string
  unitPrice: number
}

export default function ListingFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Listing fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [category, setCategory] = useState<ListingCategory>('bakery')
  const [type, setType] = useState<'mystery_box' | 'item'>('mystery_box')
  const [pickupStart, setPickupStart] = useState('')
  const [pickupEnd, setPickupEnd] = useState('')
  const [packedAt, setPackedAt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Box contents
  const [boxItems, setBoxItems] = useState<BoxEntry[]>([])
  const [invSearch, setInvSearch] = useState('')

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  useEffect(() => {
    if (!currentUser) return
    return subscribeToInventory(currentUser.uid, setInventory)
  }, [currentUser])

  // Image preview
  useEffect(() => {
    if (!imageFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  // Load existing listing for edit
  useEffect(() => {
    if (!id) return
    getListing(id).then(l => {
      if (!l) return
      setTitle(l.title)
      setDescription(l.description)
      setPrice(String(l.price))
      setOriginalPrice(String(l.originalPrice))
      setQuantity(String(l.quantityTotal))
      setCategory(l.category)
      setType(l.type)
      setExistingImageUrl(l.imageUrl)
      if (l.boxContents && l.boxContents.length > 0) {
        setBoxItems(l.boxContents.map(i => ({ name: i.name, qty: i.qty, unit: i.unit ?? '', unitPrice: 0 })))
      }
      const pickupEndMs = l.pickupEnd.seconds * 1000
      if (pickupEndMs < Date.now()) {
        setPickupStart(toLocalDatetime(new Date(Date.now() + 30 * 60 * 1000)))
        setPickupEnd(toLocalDatetime(new Date(Date.now() + 4 * 60 * 60 * 1000)))
      } else {
        setPickupStart(toLocalDatetime(new Date(l.pickupStart.seconds * 1000)))
        setPickupEnd(toLocalDatetime(new Date(l.pickupEnd.seconds * 1000)))
      }
      if (l.packedAt) setPackedAt(toLocalDatetime(new Date(l.packedAt.seconds * 1000)))
    })
  }, [id])

  // Sync unitPrice from inventory when inventory loads (edit mode may have 0 prices)
  useEffect(() => {
    if (inventory.length === 0) return
    setBoxItems(prev => prev.map(entry => {
      if (entry.inventoryId) {
        const inv = inventory.find(i => i.id === entry.inventoryId)
        if (inv && entry.unitPrice === 0) return { ...entry, unitPrice: inv.unitPrice }
      }
      return entry
    }))
  }, [inventory])

  const maxPickupEnd = toLocalDatetime(new Date(Date.now() + 24 * 60 * 60 * 1000))

  // Inventory picker helpers
  const selectedInvIds = new Set(boxItems.map(e => e.inventoryId).filter(Boolean) as string[])

  const toggleInventoryItem = (inv: InventoryItem) => {
    if (selectedInvIds.has(inv.id)) {
      setBoxItems(prev => prev.filter(e => e.inventoryId !== inv.id))
    } else {
      setBoxItems(prev => [...prev, {
        inventoryId: inv.id,
        name: inv.name,
        qty: inv.defaultQty > 0 ? inv.defaultQty : 1,
        unit: inv.unit,
        unitPrice: inv.unitPrice,
      }])
    }
  }

  const setEntryQty = (i: number, val: number) =>
    setBoxItems(prev => prev.map((e, idx) => idx === i ? { ...e, qty: Math.max(1, val) } : e))

  const removeEntry = (i: number) =>
    setBoxItems(prev => prev.filter((_, idx) => idx !== i))

  const addManualItem = () =>
    setBoxItems(prev => [...prev, { name: '', qty: 1, unit: '', unitPrice: 0 }])

  const updateManualField = (i: number, field: 'name' | 'unit' | 'unitPrice', val: string | number) =>
    setBoxItems(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))

  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(invSearch.toLowerCase())
  )

  // Live box preview
  const [seed, setSeed] = useState(0)
  const previewPlans = useMemo(() => {
    const numBoxes = parseInt(quantity) || 0
    const filled = boxItems.filter(i => i.name.trim())
    if (type !== 'mystery_box' || numBoxes < 1 || filled.length === 0) return []
    return distributeBoxes(
      filled.map((i, idx) => ({
        id: i.inventoryId ?? String(idx),
        name: i.name.trim(),
        unitPrice: i.unitPrice > 0 ? i.unitPrice : 1,
        qty: i.qty,
        unit: i.unit.trim(),
      })),
      numBoxes,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxItems, quantity, type, seed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setError('')

    const endDate = new Date(pickupEnd)
    const maxEnd = new Date(Date.now() + 24 * 60 * 60 * 1000)
    if (endDate > maxEnd) {
      setError('Pickup end must be within 24 hours from now to ensure freshness.')
      return
    }
    if (new Date(pickupStart) >= endDate) {
      setError('Pickup start must be before pickup end.')
      return
    }

    setLoading(true)
    try {
      let imageUrl = existingImageUrl
      if (imageFile) imageUrl = await uploadListingImage(currentUser.uid, imageFile)

      const filledBoxItems = boxItems.filter(i => i.name.trim())
      const numBoxes = parseInt(quantity)

      const boxPlans = type === 'mystery_box' && filledBoxItems.length > 0
        ? distributeBoxes(
            filledBoxItems.map((i, idx) => ({
              id: i.inventoryId ?? String(idx),
              name: i.name.trim(),
              unitPrice: i.unitPrice > 0 ? i.unitPrice : 1,
              qty: i.qty,
              unit: i.unit.trim(),
            })),
            numBoxes,
          )
        : []

      const boxContents = boxPlans.length > 0
        ? (boxPlans[0]?.items ?? [])
        : filledBoxItems.map(i => ({ name: i.name.trim(), qty: i.qty, ...(i.unit.trim() ? { unit: i.unit.trim() } : {}) }))

      const data = {
        vendorId: currentUser.uid,
        type,
        title,
        description,
        price: parseInt(price),
        originalPrice: parseInt(originalPrice),
        quantityTotal: numBoxes,
        category,
        imageUrl,
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        ...(packedAt ? { packedAt: Timestamp.fromDate(new Date(packedAt)) } : {}),
        status: 'active' as const,
        ...(type === 'mystery_box' && filledBoxItems.length > 0 ? { boxContents, boxPlans } : {}),
      }

      if (isEdit && id) {
        await updateListing(id, { ...data, quantityRemaining: parseInt(quantity) })
      } else {
        await createListing({ ...data, quantityRemaining: parseInt(quantity) })
      }
      navigate('/vendor/listings')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <h1 className="text-2xl font-bold text-on-surface mb-6">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
      <form onSubmit={handleSubmit}>
        <div className={`grid gap-6 items-start ${type === 'mystery_box' ? 'grid-cols-3' : 'grid-cols-1 max-w-xl'}`}>

          {/* ── LEFT COLUMN — Form fields ── */}
          <div className="space-y-4">

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(['mystery_box', 'item'] as const).map(tp => (
                <button key={tp} type="button" onClick={() => setType(tp)}
                  className={`py-2 rounded-xl border text-sm font-medium ${type === tp ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant'}`}>
                  {tp === 'mystery_box'
                    ? <span className="flex items-center justify-center gap-1.5"><img src="/images/icons/mystery-box.png" alt="" className="w-4 h-4 object-contain" /> {t('vendor.mysteryBox')}</span>
                    : <span className="flex items-center justify-center gap-1.5"><img src="/images/icons/single-item.png" alt="" className="w-4 h-4 object-contain" /> {t('vendor.singleItem')}</span>}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label className="text-on-surface-variant">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="Bánh mì mystery box" />
            </div>

            <div className="space-y-1">
              <Label className="text-on-surface-variant">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="What's inside…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Price (VND)</Label>
                <Input value={price} onChange={e => setPrice(e.target.value)} type="number" required min="1000" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="35000" />
              </div>
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Original Price (VND)</Label>
                <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} type="number" required min="1000" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="90000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Quantity {isEdit && <span className="text-outline text-xs">(sets available stock)</span>}</Label>
                <Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" required min="1" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Category</Label>
                <Select value={category} onValueChange={v => setCategory(v as ListingCategory)}>
                  <SelectTrigger className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-high border-outline-variant">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-on-surface capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Pickup start</Label>
                <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)} type="datetime-local" required
                  min={toLocalDatetime(new Date())} max={maxPickupEnd}
                  className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-on-surface-variant">Pickup end</Label>
                <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" required
                  min={toLocalDatetime(new Date())} max={maxPickupEnd}
                  className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant -mt-2">
              ⏱ Pickup window must end within <span className="text-primary font-semibold">24 hours</span> from now — keeping boxes fresh.
            </p>

            <div className="space-y-1">
              <Label className="text-on-surface-variant">Packed at (optional)</Label>
              <Input value={packedAt} onChange={e => setPackedAt(e.target.value)} type="datetime-local"
                className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
            </div>

            {/* Image */}
            <div className="space-y-1">
              <Label className="text-on-surface-variant">Image</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
              {(previewUrl || (existingImageUrl && !imageFile)) && (
                <img src={previewUrl ?? existingImageUrl} className="mt-2 h-32 w-full rounded-xl object-cover" alt="Listing preview" />
              )}
            </div>
          </div>

          {/* ── MIDDLE COLUMN — Inventory picker ── */}
          {type === 'mystery_box' && (
            <div className="space-y-3">
              <Label className="text-on-surface-variant">Box contents</Label>

              {inventory.length > 0 && (
                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  <div className="p-2.5 border-b border-outline-variant bg-surface-container-high">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                      <input
                        type="text"
                        value={invSearch}
                        onChange={e => setInvSearch(e.target.value)}
                        placeholder="Search inventory…"
                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/40">
                    {filteredInventory.map(inv => {
                      const selected = selectedInvIds.has(inv.id)
                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => toggleInventoryItem(inv)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-surface-container-high'}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                              {selected && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-on-surface text-sm truncate">{inv.name}</span>
                            <span className="text-outline text-xs shrink-0">{inv.unit}</span>
                          </div>
                          <span className="text-primary text-xs font-semibold shrink-0 ml-2">
                            {inv.unitPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </button>
                      )
                    })}
                    {filteredInventory.length === 0 && (
                      <p className="px-3 py-3 text-outline text-sm">No items match</p>
                    )}
                  </div>
                </div>
              )}

              <button type="button" onClick={addManualItem}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
                <Plus size={13} /> Add item manually
              </button>
            </div>
          )}

          {/* ── RIGHT COLUMN — Selected items + box preview ── */}
          {type === 'mystery_box' && (
            <div className="space-y-3">
              {boxItems.length > 0 ? (
                <>
                  <p className="text-xs text-outline uppercase font-bold tracking-wider">
                    Selected ({boxItems.length}) — qty = total across all boxes
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {boxItems.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-surface-container-high border border-outline-variant rounded-xl">
                        <div className="flex-1 min-w-0">
                          {entry.inventoryId ? (
                            <div>
                              <p className="text-on-surface text-sm font-medium truncate">{entry.name}</p>
                              <p className="text-outline text-xs">{entry.unitPrice.toLocaleString('vi-VN')} đ / {entry.unit || 'unit'}</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Input
                                value={entry.name}
                                onChange={e => updateManualField(i, 'name', e.target.value)}
                                placeholder="Item name"
                                className="bg-surface-container border-outline-variant text-on-surface rounded-lg text-sm h-8"
                              />
                              <div className="flex gap-1">
                                <Input
                                  value={entry.unit}
                                  onChange={e => updateManualField(i, 'unit', e.target.value)}
                                  placeholder="unit"
                                  className="w-20 bg-surface-container border-outline-variant text-on-surface rounded-lg text-xs h-7 px-2"
                                />
                                <Input
                                  value={entry.unitPrice || ''}
                                  onChange={e => updateManualField(i, 'unitPrice', parseInt(e.target.value) || 0)}
                                  type="number" min="0" placeholder="price (đ)"
                                  className="flex-1 bg-surface-container border-outline-variant text-on-surface rounded-lg text-xs h-7 px-2"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container shrink-0">
                          <button type="button" onClick={() => setEntryQty(i, entry.qty - 1)}
                            className="px-2 py-1 border-r border-outline-variant text-on-surface-variant hover:text-primary transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="px-2.5 text-on-surface font-bold text-sm w-8 text-center">{entry.qty}</span>
                          <button type="button" onClick={() => setEntryQty(i, entry.qty + 1)}
                            className="px-2 py-1 border-l border-outline-variant text-on-surface-variant hover:text-primary transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>

                        <button type="button" onClick={() => removeEntry(i)}
                          className="p-1.5 text-on-surface-variant hover:text-error-token transition-colors shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed border-outline-variant rounded-xl text-outline text-sm gap-2">
                  <Package size={20} className="opacity-40" />
                  <span>Select items from the inventory</span>
                </div>
              )}

              {/* Live box preview */}
              {previewPlans.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-outline-variant">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-sm font-medium flex items-center gap-1.5">
                      <Package size={14} /> Box preview ({previewPlans.length} boxes)
                    </span>
                    <button type="button" onClick={() => setSeed(s => s + 1)}
                      className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors">
                      <RefreshCw size={11} /> Re-randomize
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {previewPlans.map(plan => (
                      <div key={plan.boxNumber}
                        className={`p-3 rounded-xl border text-sm ${plan.belowAverage ? 'border-amber-500/40 bg-amber-950/20' : 'border-outline-variant bg-surface-container-high'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-on-surface">Box {plan.boxNumber}</span>
                          {plan.value > 1 && (
                            <span className="text-xs text-outline">~{plan.value.toLocaleString('vi-VN')} đ</span>
                          )}
                        </div>
                        {plan.belowAverage && (
                          <p className="text-amber-400 text-xs mb-1.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> Below average — customer gets 10% discount
                          </p>
                        )}
                        <ul className="space-y-0.5">
                          {plan.items.map(item => (
                            <li key={item.name} className="text-on-surface-variant text-xs">{formatBoxItem(item)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom bar — full width ── */}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        <div className="flex gap-3 pt-6 mt-6 border-t border-outline-variant">
          <GradientButton type="submit" disabled={loading} className="w-full max-w-xs">
            {loading ? t('listing.saving') : t('listing.save')}
          </GradientButton>
          <Button type="button" variant="outline" onClick={() => navigate('/vendor/listings')} className="border-outline-variant text-on-surface-variant">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
