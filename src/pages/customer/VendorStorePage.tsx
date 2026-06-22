import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getUserProfile } from '../../services/auth'
import { getActiveListingsByVendor } from '../../services/listings'
import { getAggregateRatingForVendor } from '../../services/reviews'
import { followVendor, unfollowVendor, getFollow } from '../../services/follows'
import { MysteryCard } from '../../components/shared/MysteryCard'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { StarRating } from '../../components/shared/StarRating'
import type { UserProfile, Listing, Follow } from '../../types'
import { Bell, BellOff } from 'lucide-react'

export default function VendorStorePage() {
  const { t } = useTranslation()
  const { vendorId } = useParams<{ vendorId: string }>()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [follow, setFollow] = useState<Follow | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

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

  useEffect(() => {
    if (!userProfile || !vendorId) return
    getFollow(userProfile.uid, vendorId).then(setFollow)
  }, [userProfile, vendorId])

  const handleFollow = async () => {
    if (!userProfile || !vendorId) return
    setFollowLoading(true)
    if (follow) {
      await unfollowVendor(follow.id)
      setFollow(null)
    } else {
      const id = await followVendor(userProfile.uid, vendorId)
      setFollow({ id, customerId: userProfile.uid, vendorId, notificationsEnabled: true, createdAt: null as any })
    }
    setFollowLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-on-surface-variant">{t('browse.loading')}</p>
    </div>
  )

  if (!vendor) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-on-surface-variant">Store not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/browse" className="text-on-surface-variant hover:text-on-surface text-body-sm mb-6 block">
          ← {t('browse.title')}
        </Link>

        {/* Vendor header */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 mb-6">
          <h1 className="text-headline-md font-bold text-on-surface mb-1">{vendor.storeName}</h1>
          {vendor.address && (
            <p className="text-on-surface-variant text-body-sm mb-2 flex items-center gap-1"><img src="/images/icons/location.png" alt="" className="w-4 h-4 object-contain" /> {vendor.address}</p>
          )}
          {vendor.storeDescription && (
            <p className="text-on-surface-variant text-body-sm mb-3">{vendor.storeDescription}</p>
          )}
          <div className="flex items-center gap-2 mb-4">
            {rating.count > 0 ? (
              <>
                <StarRating value={Math.round(rating.avg)} size="sm" />
                <span className="text-on-surface text-body-sm font-medium">{rating.avg}</span>
                <span className="text-outline text-xs">
                  {t('review.out_of_5')} ({rating.count} {t('review.avg_rating')})
                </span>
              </>
            ) : (
              <span className="text-outline text-body-sm">{t('store.no_rating_yet')}</span>
            )}
          </div>

          {/* Follow button */}
          {userProfile && (
            <div className="flex items-center gap-3">
              {follow ? (
                <GhostButton onClick={handleFollow} disabled={followLoading}>
                  <BellOff size={16} /> {t('vendor.unfollow')}
                </GhostButton>
              ) : (
                <GradientButton onClick={handleFollow} disabled={followLoading}>
                  <Bell size={16} /> {t('vendor.follow')}
                </GradientButton>
              )}
            </div>
          )}
        </div>

        {/* Active listings */}
        <h2 className="text-on-surface font-semibold mb-4">{t('store.active_listings')}</h2>
        {listings.length === 0 ? (
          <p className="text-on-surface-variant">{t('store.no_listings')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => (
              <MysteryCard key={l.id} listing={l} onClick={() => navigate(`/listing/${l.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
