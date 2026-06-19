import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getUserProfile } from '../../services/auth'
import { getActiveListingsByVendor } from '../../services/listings'
import { getAggregateRatingForVendor } from '../../services/reviews'
import { ListingCard } from '../../components/shared/ListingCard'
import { StarRating } from '../../components/shared/StarRating'
import type { UserProfile, Listing } from '../../types'

export default function VendorStorePage() {
  const { t } = useTranslation()
  const { vendorId } = useParams<{ vendorId: string }>()
  const [vendor, setVendor] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendorId) return
    Promise.all([
      getUserProfile(vendorId),
      getActiveListingsByVendor(vendorId),
      getAggregateRatingForVendor(vendorId),
    ]).then(([profile, activeListings, agg]) => {
      setVendor(profile)
      setListings(activeListings)
      setRating(agg)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [vendorId])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">{t('browse.loading')}</p>
    </div>
  )

  if (!vendor) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Store not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/browse" className="text-slate-400 hover:text-white text-sm mb-6 block">
          ← {t('browse.title')}
        </Link>

        {/* Vendor header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{vendor.storeName}</h1>
          {vendor.address && (
            <p className="text-slate-400 text-sm mb-2">📍 {vendor.address}</p>
          )}
          {vendor.storeDescription && (
            <p className="text-slate-300 text-sm mb-3">{vendor.storeDescription}</p>
          )}
          <div className="flex items-center gap-2">
            {rating.count > 0 ? (
              <>
                <StarRating value={Math.round(rating.avg)} size="sm" />
                <span className="text-white text-sm font-medium">{rating.avg}</span>
                <span className="text-slate-500 text-xs">
                  {t('review.out_of_5')} ({rating.count} {t('review.avg_rating')})
                </span>
              </>
            ) : (
              <span className="text-slate-500 text-sm">{t('store.no_rating_yet')}</span>
            )}
          </div>
        </div>

        {/* Active listings */}
        <h2 className="text-white font-semibold mb-4">{t('store.active_listings')}</h2>
        {listings.length === 0 ? (
          <p className="text-slate-500">{t('store.no_listings')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => (
              <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
