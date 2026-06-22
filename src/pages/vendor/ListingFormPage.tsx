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

const CATEGORIES: ListingCategory[] = ['bakery', 'fruit', 'vegetables', 'dairy', 'meat', 'rice', 'noodles', 'drinks', 'snacks', 'other']

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
      const toDatetimeLocal = (ts: Timestamp) => {
        const d = new Date(ts.seconds * 1000)
        return d.toISOString().slice(0, 16)
      }
      setPickupStart(toDatetimeLocal(l.pickupStart))
      setPickupEnd(toDatetimeLocal(l.pickupEnd))
      if (l.packedAt) setPackedAt(toDatetimeLocal(l.packedAt))
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setLoading(true)
    setError('')
    try {
      let imageUrl = existingImageUrl
      if (imageFile) {
        imageUrl = await uploadListingImage(currentUser.uid, imageFile)
      }

      const data = {
        vendorId: currentUser.uid,
        type,
        title,
        description,
        price: parseInt(price),
        originalPrice: parseInt(originalPrice),
        quantityTotal: parseInt(quantity),
        category,
        imageUrl,
        pickupStart: Timestamp.fromDate(new Date(pickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(pickupEnd)),
        ...(packedAt ? { packedAt: Timestamp.fromDate(new Date(packedAt)) } : {}),
        status: 'active' as const,
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
              className={`py-2 rounded-xl border text-sm font-medium ${type === tp ? 'border-primary bg-indigo-600/20 text-indigo-300' : 'border-outline-variant text-on-surface-variant'}`}>
              {tp === 'mystery_box' ? '🎁 Mystery Box' : '📦 Single Item'}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="Bánh mì mystery box" />
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="What's inside…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Price (VND)</Label>
            <Input value={price} onChange={e => setPrice(e.target.value)} type="number" required min="1000" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="35000" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Original Price (VND)</Label>
            <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} type="number" required min="1000" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" placeholder="90000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Quantity {isEdit && <span className="text-outline text-xs">(sets available stock)</span>}</Label>
            <Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" required min="1" className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Category</Label>
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
            <Label className="text-slate-300">Pickup start</Label>
            <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)} type="datetime-local" required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Pickup end</Label>
            <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" required className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Packed at (optional)</Label>
          <Input
            value={packedAt}
            onChange={e => setPackedAt(e.target.value)}
            type="datetime-local"
            className="bg-surface-container-high border-outline-variant text-on-surface rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Image</Label>
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
