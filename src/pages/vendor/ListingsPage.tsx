import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing, createListing } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { suggestQuantity } from '../../utils/quickCreate'
import type { Volume } from '../../utils/quickCreate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Listing, ListingCategory, Order } from '../../types'

const CATEGORIES: ListingCategory[] = ['bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

function todayAt(hour: number, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().slice(0, 16)
}

export default function ListingsPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // Quick Create state
  const [showQC, setShowQC] = useState(false)
  const [qcCategory, setQcCategory] = useState<ListingCategory>('bakery')
  const [qcVolume, setQcVolume] = useState<Volume | null>(null)
  const [qcQty, setQcQty] = useState(1)
  const [qcPrice, setQcPrice] = useState('')
  const [qcPickupStart, setQcPickupStart] = useState(todayAt(17))
  const [qcPickupEnd, setQcPickupEnd] = useState(todayAt(21))
  const [qcOrders, setQcOrders] = useState<Order[]>([])
  const [qcLoading, setQcLoading] = useState(false)
  const [qcError, setQcError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorListings(currentUser.uid, data => { setListings(data); setLoading(false) })
    return unsub
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const openQuickCreate = async () => {
    if (!currentUser) return
    setQcError('')
    setQcVolume(null)
    setQcQty(1)
    setQcPickupStart(todayAt(17))
    setQcPickupEnd(todayAt(21))
    // Pre-fill price from most recent listing of default category
    const recent = listings.find(l => l.category === qcCategory)
    setQcPrice(recent ? String(recent.price) : '')
    // Fetch orders for qty estimation
    const orders = await getVendorOrders(currentUser.uid)
    setQcOrders(orders)
    setShowQC(true)
  }

  const handleQcCategory = (cat: ListingCategory) => {
    setQcCategory(cat)
    const recent = listings.find(l => l.category === cat)
    if (recent) setQcPrice(String(recent.price))
    if (qcVolume) setQcQty(suggestQuantity(qcOrders, qcVolume))
  }

  const handleQcVolume = (vol: Volume) => {
    setQcVolume(vol)
    setQcQty(suggestQuantity(qcOrders, vol))
  }

  const handleQcSubmit = async () => {
    if (!currentUser || !qcVolume) return
    setQcLoading(true)
    setQcError('')
    try {
      const categoryLabel = t(`categories.${qcCategory}`)
      const storeName = currentUser.displayName ?? 'Store'
      const title = t('vendor.auto_title', { store: storeName, category: categoryLabel })
      await createListing({
        vendorId: currentUser.uid,
        type: 'mystery_box',
        title,
        description: '',
        price: parseInt(qcPrice) || 0,
        originalPrice: Math.round((parseInt(qcPrice) || 0) * 1.5),
        quantityTotal: qcQty,
        quantityRemaining: qcQty,
        category: qcCategory,
        imageUrl: '',
        pickupStart: Timestamp.fromDate(new Date(qcPickupStart)),
        pickupEnd: Timestamp.fromDate(new Date(qcPickupEnd)),
        status: 'active',
      })
      setShowQC(false)
    } catch (err: unknown) {
      setQcError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setQcLoading(false)
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
          <Button
            onClick={openQuickCreate}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {t('vendor.quick_create')}
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
              {l.imageUrl ? <img src={l.imageUrl} className="w-full h-full object-cover rounded-lg" /> : '🎁'}
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

      {/* Quick Create Modal */}
      {showQC && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{t('vendor.quick_create_modal')}</h2>
              <button onClick={() => setShowQC(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>

            {/* Category */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Category</Label>
              <div className="grid grid-cols-3 gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleQcCategory(cat)}
                    className={`py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
                      qcCategory === cat
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t(`categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Surplus volume</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as Volume[]).map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => handleQcVolume(vol)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      qcVolume === vol
                        ? 'border-purple-500 bg-purple-600/20 text-purple-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t(`vendor.volume_${vol}`)}
                  </button>
                ))}
              </div>
              {qcVolume && (
                <p className="text-indigo-400 text-xs mt-1">
                  {t('vendor.suggested_qty', { count: suggestQuantity(qcOrders, qcVolume) })}
                </p>
              )}
            </div>

            {/* Qty adjust */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQcQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >−</button>
                <span className="text-white font-bold text-lg w-8 text-center">{qcQty}</span>
                <button
                  type="button"
                  onClick={() => setQcQty(q => q + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                >+</button>
              </div>
            </div>

            {/* Price */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">Price (VND)</Label>
              <Input
                value={qcPrice}
                onChange={e => setQcPrice(e.target.value)}
                type="number"
                min="1000"
                placeholder="35000"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Pickup window */}
            <div>
              <Label className="text-slate-300 text-sm mb-1 block">{t('vendor.pickup_window')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={qcPickupStart} onChange={e => setQcPickupStart(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
                <Input value={qcPickupEnd} onChange={e => setQcPickupEnd(e.target.value)} type="datetime-local" className="bg-slate-800 border-slate-700 text-white text-xs" />
              </div>
            </div>

            {qcError && <p className="text-red-400 text-xs">{qcError}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleQcSubmit}
                disabled={qcLoading || !qcVolume || !qcPrice}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                {qcLoading ? t('vendor.saving') : t('vendor.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQC(false)}
                className="border-slate-700 text-slate-300"
              >
                {t('vendor.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
