import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { initiateCheckout } from '../../services/stripe'
import { initiateLocalOrder } from '../../services/localPayment'
import { initiateVNPayOrder } from '../../services/vnpay'
import { GradientButton } from '../../components/shared/GradientButton'
import { StatusChip } from '../../components/shared/StatusChip'
import { StockBadge } from '../../components/shared/StockBadge'
import { TimerBadge } from '../../components/shared/TimerBadge'
import type { Listing, ListingCategory } from '../../types'

const CATEGORY_IMAGE: Record<ListingCategory, string> = {
  bakery: '/images/categories/bakery.jpg',
  fruit: '/images/categories/fruit.jpg',
  vegetables: '/images/categories/vegetables.jpg',
  dairy: '/images/categories/dairy.jpg',
  meat: '/images/categories/meat.jpg',
  drinks: '/images/categories/drinks.jpg',
  other: '/images/categories/other.jpg',
}
import { ReviewsCarousel } from '../../components/shared/ReviewsCarousel'
import { ArrowLeft, Share2, Heart, CreditCard, Truck, Building2 } from 'lucide-react'

type PayMethod = 'card' | 'cod' | 'vnpay'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'listings', id), snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() } as Listing)
    })
    return unsub
  }, [id])

  const handlePayMethod = (key: PayMethod) => {
    setPayMethod(key)
    if (key === 'cod') setSelectedBox(null)
  }

  const handleClaim = async () => {
    if (!listing) return
    setLoading(true)
    try {
      if (payMethod === 'card') {
        await initiateCheckout(listing.id, 1, selectedBox ?? undefined)
      } else if (payMethod === 'vnpay') {
        const { url } = await initiateVNPayOrder(listing.id, 1, selectedBox ?? undefined)
        window.location.href = url
      } else {
        const { orderId } = await initiateLocalOrder(listing.id, 1, payMethod as 'cod' | 'bank_transfer')
        navigate(`/orders/${orderId}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts: { seconds: number }) =>
    new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (!listing) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-12 h-12 rounded-full gradient-bg animate-pulse" />
    </div>
  )

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const soldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0
  const hasBoxPlans = (listing.boxPlans?.length ?? 0) > 0
  const availableBoxes = listing.boxPlans?.filter(p => !p.takenByOrderId) ?? []
  const boxSelectionRequired = hasBoxPlans && (payMethod === 'card' || payMethod === 'vnpay')
  const boxNotSelected = boxSelectionRequired && selectedBox === null

  const PAY_OPTIONS: Array<{ key: PayMethod; label: string; icon: React.ElementType }> = [
    { key: 'card',  label: t('payment.card'),   icon: CreditCard },
    { key: 'vnpay', label: t('payment.vnpay'),  icon: Building2 },
    { key: 'cod',   label: t('payment.cod'),    icon: Truck },
  ]

  return (
    <div className="pb-28">
      {/* Inline back nav — no fixed positioning, sits naturally after layout header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate('/browse')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-medium">{t('nav.browse')}</span>
        </button>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <button className="p-2 rounded-full hover:bg-white/5 hover:text-on-surface transition-all"><Share2 size={18} /></button>
          <button className="p-2 rounded-full hover:bg-white/5 hover:text-on-surface transition-all"><Heart size={18} /></button>
        </div>
      </div>

      {/* Two-column grid on md+, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Image */}
        <div className="relative h-64 sm:h-80 md:h-[480px] rounded-xl overflow-hidden border border-outline-variant">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : (
              <div className="relative w-full h-full overflow-hidden">
                <img src={CATEGORY_IMAGE[listing.category]} alt={listing.category} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold tracking-widest uppercase">Mystery Box</span>
              </div>
            )}
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-tertiary-container/20 backdrop-blur-sm border border-tertiary/50 text-tertiary text-label-caps font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-headline-lg font-bold text-on-surface">{listing.title}</h1>
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
              {
                label: t('listing.category'),
                value: (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusChip variant="slate">{listing.category}</StatusChip>
                    {hasBoxPlans && availableBoxes.map(p => (
                      <button
                        key={p.boxNumber}
                        onClick={() => setSelectedBox(prev => prev === p.boxNumber ? null : p.boxNumber)}
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${
                          selectedBox === p.boxNumber
                            ? 'bg-primary text-white border-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                        }`}
                      >
                        {t('listing.box_number', { n: p.boxNumber })}
                      </button>
                    ))}
                  </div>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-container border border-outline-variant rounded-xl p-3 flex flex-col gap-1">
                <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
                <span className="text-mono-stat font-semibold text-on-surface">{value}</span>
              </div>
            ))}
          </div>

          {/* Reviews */}
          <ReviewsCarousel listingId={listing.id} />

          {/* Payment method selector */}
          <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-4 flex flex-col gap-3">
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('payment.selectMethod')}</p>
            <div className="grid grid-cols-3 gap-2">
              {PAY_OPTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handlePayMethod(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs sm:text-body-sm font-semibold transition-colors ${
                    payMethod === key
                      ? 'border-primary text-primary bg-surface-container'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            {/* COD note */}
            {payMethod === 'cod' && (
              <div className="bg-surface-container border border-outline-variant rounded-lg p-3 text-body-sm text-on-surface-variant">
                {t('payment.codNote')}
              </div>
            )}

            {/* Box selection not available for COD */}
            {payMethod === 'cod' && hasBoxPlans && (
              <div className="bg-surface-container border border-outline-variant rounded-lg p-3 text-body-sm text-on-surface-variant mt-2">
                {t('listing.boxSelectionCashOnly')}
              </div>
            )}

            {/* VNPAY note */}
            {payMethod === 'vnpay' && (
              <div className="bg-surface-container border border-outline-variant rounded-lg p-3 text-body-sm text-on-surface-variant">
                {t('payment.vnpayNote', 'You will be redirected to VNPAY to complete payment via bank transfer, MoMo, ZaloPay, or card.')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant px-4 sm:px-6 py-4 z-40">
        <div className="max-w-5xl mx-auto">
          <GradientButton
            onClick={handleClaim}
            disabled={soldOut || loading || boxNotSelected}
            className="w-full"
          >
            {soldOut
              ? t('listing.soldOut')
              : loading
              ? t('listing.claiming')
              : boxNotSelected
              ? t('listing.selectBoxFirst')
              : `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`}
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
