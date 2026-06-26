import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createListing, getListing, updateListing } from '../../services/listings'
import { uploadListingImage } from '../../services/storage'
import { GradientButton } from '../../components/shared/GradientButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Timestamp } from 'firebase/firestore'
import type { ListingCategory } from '../../types'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { distributeBoxes } from '../../utils/boxDistribution'

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const CATEGORIES: ListingCategory[] = ['bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'drinks', 'other']

export default function ListingFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

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
  const [boxItems, setBoxItems] = useState<{ name: string; qty: number; unit: string; unitPrice: number }[]>([{ name: '', qty: 1, unit: '', unitPrice: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

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
        // Expired listing — pre-fill a fresh pickup window (local time) so vendor can renew
        setPickupStart(toLocalDatetime(new Date(Date.now() + 30 * 60 * 1000)))
        setPickupEnd(toLocalDatetime(new Date(Date.now() + 4 * 60 * 60 * 1000)))
      } else {
        setPickupStart(toLocalDatetime(new Date(l.pickupStart.seconds * 1000)))
        setPickupEnd(toLocalDatetime(new Date(l.pickupEnd.seconds * 1000)))
      }
      if (l.packedAt) setPackedAt(toLocalDatetime(new Date(l.packedAt.seconds * 1000)))
    })
  }, [id])

  const maxPickupEnd = toLocalDatetime(new Date(Date.now() + 24 * 60 * 60 * 1000))

  const addBoxItem = () => setBoxItems(prev => [...prev, { name: '', qty: 1, unit: '', unitPrice: 0 }])
  const removeBoxItem = (i: number) => setBoxItems(prev => prev.filter((_, idx) => idx !== i))
  const updateBoxItem = (i: number, field: 'name' | 'qty' | 'unit' | 'unitPrice', val: string | number) =>
    setBoxItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setError('')

    // Enforce fresh-food rule: pickup window must end within 24 h from now
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
      if (imageFile) {
        imageUrl = await uploadListingImage(currentUser.uid, imageFile)
      }

      const filledBoxItems = boxItems.filter(i => i.name.trim())
      const numBoxes = parseInt(quantity)

      const boxPlans = type === 'mystery_box' && filledBoxItems.length > 0
        ? distributeBoxes(
            filledBoxItems.map((i, idx) => ({
              id: String(idx),
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
        ...(type === 'mystery_box' && filledBoxItems.length > 0
          ? { boxContents, boxPlans }
          : {}),
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
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-on-surface mb-6">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              min={toLocalDatetime(new Date())}
              max={maxPickupEnd}
              className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-on-surface-variant">Pickup end</Label>
            <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" required
              min={toLocalDatetime(new Date())}
              max={maxPickupEnd}
              className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          </div>
        </div>
        <p className="text-xs text-on-surface-variant -mt-2">
          ⏱ Pickup window must end within <span className="text-primary font-semibold">24 hours</span> from now — keeping boxes fresh.
        </p>

        <div className="space-y-1">
          <Label className="text-on-surface-variant">Packed at (optional)</Label>
          <Input
            value={packedAt}
            onChange={e => setPackedAt(e.target.value)}
            type="datetime-local"
            className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl"
          />
        </div>

        {type === 'mystery_box' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-on-surface-variant">Box contents</Label>
              <button
                type="button"
                onClick={addBoxItem}
                className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
              >
                <Plus size={13} /> Add item
              </button>
            </div>
            <div className="space-y-2 p-3 bg-surface-container-high border border-outline-variant rounded-xl">
              <div className="grid grid-cols-[1fr_3rem_4rem_4rem_auto] gap-1.5 pb-1">
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Name</span>
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Qty</span>
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Unit</span>
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Price</span>
                <span />
              </div>
              {boxItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_3rem_4rem_4rem_auto] items-center gap-1.5">
                  <Input
                    value={item.name}
                    onChange={e => updateBoxItem(i, 'name', e.target.value)}
                    placeholder="Bánh mì"
                    className="bg-surface-container border-outline-variant text-on-surface rounded-lg text-sm h-9"
                  />
                  <Input
                    value={item.qty}
                    onChange={e => updateBoxItem(i, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                    type="number"
                    min="1"
                    className="bg-surface-container border-outline-variant text-on-surface rounded-lg text-sm h-9 text-center px-1"
                  />
                  <Input
                    value={item.unit}
                    onChange={e => updateBoxItem(i, 'unit', e.target.value)}
                    placeholder="loaf"
                    className="bg-surface-container border-outline-variant text-on-surface rounded-lg text-sm h-9 px-2"
                  />
                  <Input
                    value={item.unitPrice || ''}
                    onChange={e => updateBoxItem(i, 'unitPrice', parseInt(e.target.value) || 0)}
                    type="number"
                    min="0"
                    placeholder="opt."
                    className="bg-surface-container border-outline-variant text-on-surface rounded-lg text-sm h-9 px-2"
                  />
                  {boxItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBoxItem(i)}
                      className="p-1.5 text-on-surface-variant hover:text-error-token transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-outline pt-1">Qty = total across all boxes. Price (optional) improves value balancing between boxes.</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-on-surface-variant">Image</Label>
          <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          {(previewUrl || (existingImageUrl && !imageFile)) && (
            <img
              src={previewUrl ?? existingImageUrl}
              className="mt-2 h-32 w-full rounded-xl object-cover"
              alt="Listing preview"
            />
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <GradientButton type="submit" disabled={loading} className="w-full">
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
