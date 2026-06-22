import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { initiateCheckout } from '../../services/stripe'
import { GradientButton } from '../../components/shared/GradientButton'
import { GlassNav } from '../../components/shared/GlassNav'
import { StatusChip } from '../../components/shared/StatusChip'
import { StockBadge } from '../../components/shared/StockBadge'
import { TimerBadge } from '../../components/shared/TimerBadge'
import type { Listing } from '../../types'
import { Share2, Heart } from 'lucide-react'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'listings', id), snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() } as Listing)
    })
    return unsub
  }, [id])

  const handleClaim = async () => {
    if (!listing) return
    setLoading(true)
    try {
      await initiateCheckout(listing.id, 1)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts: { seconds: number }) =>
    new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (!listing) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full gradient-bg animate-pulse" />
    </div>
  )

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const soldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0

  return (
    <div className="min-h-screen bg-background pb-32">
      <GlassNav
        backHref="/browse"
        backLabel={t('nav.browse')}
        actions={
          <>
            <button className="p-2 hover:text-on-surface transition-colors"><Share2 size={20} /></button>
            <button className="p-2 hover:text-on-surface transition-colors"><Heart size={20} /></button>
          </>
        }
      />

      <div className="pt-16 max-w-5xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="relative h-64 md:h-[480px] rounded-xl overflow-hidden border border-outline-variant">
            {listing.imageUrl
              ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-surface-container flex items-center justify-center text-6xl">🎁</div>}
            <span className="absolute top-4 left-4 bg-tertiary-container/20 backdrop-blur-sm border border-tertiary/50 text-tertiary text-label-caps font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">{listing.title}</h1>
              <p className="text-on-surface-variant text-body-lg mt-2">{listing.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-primary font-bold text-headline-md">{listing.price.toLocaleString('vi-VN')} đ</span>
              <span className="text-outline text-body-lg line-through mb-0.5">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Timer banner */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <TimerBadge pickupEnd={listing.pickupEnd} />
              </div>
              {listing.packedAt && (
                <span className="text-on-surface-variant text-xs">
                  {t('listing.packedAt')} {formatTime(listing.packedAt)}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('listing.remaining'), value: <StockBadge quantity={listing.quantityRemaining} /> },
                { label: t('listing.pickup'),    value: `${formatTime(listing.pickupStart)} – ${formatTime(listing.pickupEnd)}` },
                { label: t('listing.category'),  value: <StatusChip variant="slate">{listing.category}</StatusChip> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container border border-outline-variant rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
                  <span className="text-mono-stat font-semibold text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <GradientButton
            onClick={handleClaim}
            disabled={soldOut || loading}
            className="w-full"
          >
            {soldOut ? t('listing.soldOut') : loading ? t('listing.claiming') : `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`}
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
