import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createListing, getListing, updateListing } from '../../services/listings'
import { uploadListingImage } from '../../services/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timestamp } from 'firebase/firestore'
import type { ListingCategory } from '../../types'

const CATEGORIES: ListingCategory[] = ['bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

export default function ListingFormPage() {
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        status: 'active' as const,
      }

      if (isEdit && id) {
        await updateListing(id, data)
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
      <h1 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Edit Listing' : 'New Listing'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['mystery_box', 'item'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`py-2 rounded-lg border text-sm font-medium ${type === t ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-700 text-slate-400'}`}>
              {t === 'mystery_box' ? '🎁 Mystery Box' : '📦 Single Item'}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="Bánh mì mystery box" />
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="What's inside…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Price (VND)</Label>
            <Input value={price} onChange={e => setPrice(e.target.value)} type="number" required min="1000" className="bg-slate-800 border-slate-700 text-white" placeholder="35000" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Original Price (VND)</Label>
            <Input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} type="number" required min="1000" className="bg-slate-800 border-slate-700 text-white" placeholder="90000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Quantity</Label>
            <Input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" required min="1" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as ListingCategory)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-slate-300">Pickup start</Label>
            <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)} type="datetime-local" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Pickup end</Label>
            <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} type="datetime-local" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300">Image</Label>
          <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="bg-slate-800 border-slate-700 text-white" />
          {existingImageUrl && !imageFile && <img src={existingImageUrl} className="mt-2 h-20 rounded object-cover" alt="Current listing" />}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/vendor/listings')} className="border-slate-700 text-slate-300">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
