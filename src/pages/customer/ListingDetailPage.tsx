import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing } from '../../services/listings'
import { initiateCheckout } from '../../services/stripe'
import { Button } from '@/components/ui/button'
import type { Listing } from '../../types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getListing(id).then(l => { setListing(l); setLoading(false) })
  }, [id])

  const handleBuy = async () => {
    if (!listing) return
    setCheckoutLoading(true)
    setError('')
    try {
      await initiateCheckout(listing.id, 1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setCheckoutLoading(false)
    }
  }

  if (loading) return <p className="text-slate-400 p-8">Loading…</p>
  if (!listing) return <p className="text-slate-400 p-8">Listing not found.</p>

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickupStart = new Date(listing.pickupStart.seconds * 1000).toLocaleString('vi-VN')
  const pickupEnd = new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const isSoldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-4">← Back</button>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="relative h-64 bg-slate-800">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>}
          <span className="absolute top-3 right-3 bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
            <p className="text-slate-400 mt-2">{listing.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-indigo-400">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-slate-500 text-lg line-through">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Remaining</p>
              <p className="text-white font-medium">{listing.quantityRemaining} boxes</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Pickup window</p>
              <p className="text-white font-medium">{pickupStart} – {pickupEnd}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Category</p>
              <p className="text-white font-medium capitalize">{listing.category}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">Type</p>
              <p className="text-white font-medium">{listing.type === 'mystery_box' ? '🎁 Mystery Box' : 'Single Item'}</p>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            onClick={handleBuy}
            disabled={isSoldOut || checkoutLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 text-base disabled:opacity-50"
          >
            {isSoldOut ? 'Sold Out' : checkoutLoading ? 'Redirecting to checkout…' : `Buy Now — ${listing.price.toLocaleString('vi-VN')} đ`}
          </Button>
        </div>
      </div>
    </div>
  )
}
