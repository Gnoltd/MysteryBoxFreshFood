import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing } from '../../services/listings'
import { Button } from '@/components/ui/button'
import type { Listing } from '../../types'

export default function ListingsPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorListings(currentUser.uid, data => { setListings(data); setLoading(false) })
    return unsub
  }, [currentUser])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await deleteListing(id)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400', sold_out: 'text-orange-400', expired: 'text-slate-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('vendor.myListings')}</h1>
        <Link to="/vendor/listings/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500">{t('vendor.newListing')}</Button>
        </Link>
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
    </div>
  )
}
