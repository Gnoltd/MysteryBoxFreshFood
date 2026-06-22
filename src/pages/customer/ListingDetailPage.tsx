import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { initiateCheckout } from '../../services/stripe'
import { initiateLocalOrder } from '../../services/localPayment'
import { GradientButton } from '../../components/shared/GradientButton'
import { GlassNav } from '../../components/shared/GlassNav'
import { StatusChip } from '../../components/shared/StatusChip'
import { StockBadge } from '../../components/shared/StockBadge'
import { TimerBadge } from '../../components/shared/TimerBadge'
import type { Listing } from '../../types'
import { Share2, Heart, CreditCard, Banknote, Truck } from 'lucide-react'

type PayMethod = 'card' | 'cod' | 'bank_transfer'

interface BankInfo { bankName: string; bankAccount: string; bankAccountName: string }

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'listings', id), snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Listing
        setListing(data)
        // fetch vendor bank info
        getDoc(doc(db, 'users', data.vendorId)).then(vSnap => {
          if (vSnap.exists()) {
            const v = vSnap.data()
            if (v.bankAccount) setBankInfo({ bankName: v.bankName ?? '', bankAccount: v.bankAccount, bankAccountName: v.bankAccountName ?? '' })
          }
        })
      }
    })
    return unsub
  }, [id])

  const handleClaim = async () => {
    if (!listing) return
    setLoading(true)
    try {
      if (payMethod === 'card') {
        await initiateCheckout(listing.id, 1)
      } else {
        const { orderId } = await initiateLocalOrder(listing.id, 1, payMethod)
        navigate(`/orders/${orderId}`)
      }
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

  const PAY_OPTIONS: Array<{ key: PayMethod; label: string; icon: React.ElementType }> = [
    { key: 'card',          label: t('payment.card'),        icon: CreditCard },
    { key: 'cod',           label: t('payment.cod'),         icon: Truck },
    { key: 'bank_transfer', label: t('payment.bankTransfer'), icon: Banknote },
  ]

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

            {/* Payment method selector */}
            <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-4 flex flex-col gap-3">
              <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('payment.selectMethod')}</p>
              <div className="grid grid-cols-3 gap-2">
                {PAY_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPayMethod(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-body-sm font-semibold transition-colors ${
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

              {/* Bank transfer details */}
              {payMethod === 'bank_transfer' && (
                <div className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col gap-2">
                  {bankInfo ? (
                    <>
                      <p className="text-label-caps text-on-surface-variant uppercase tracking-wider mb-1">{t('payment.bankDetails')}</p>
                      {[
                        { label: t('payment.bankName'), value: bankInfo.bankName },
                        { label: t('payment.bankAccount'), value: bankInfo.bankAccount },
                        { label: t('payment.bankAccountName'), value: bankInfo.bankAccountName },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-body-sm">
                          <span className="text-on-surface-variant">{label}</span>
                          <span className="text-on-surface font-semibold">{value}</span>
                        </div>
                      ))}
                      <p className="text-xs text-on-surface-variant mt-1">{t('payment.bankTransferNote')}</p>
                    </>
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">{t('payment.noBankInfo')}</p>
                  )}
                </div>
              )}
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
            {soldOut
              ? t('listing.soldOut')
              : loading
              ? t('listing.claiming')
              : `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`}
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
