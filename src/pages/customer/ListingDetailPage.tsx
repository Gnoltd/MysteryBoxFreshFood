import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getListing } from '../../services/listings'
import { initiateCheckout } from '../../services/stripe'
import { initiateLocalOrder } from '../../services/localPayment'
import { getUserProfile } from '../../services/auth'
import { Button } from '@/components/ui/button'
import type { Listing, UserProfile } from '../../types'

type PayMethod = 'cod' | 'bank_transfer' | 'stripe'

export default function ListingDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [vendorProfile, setVendorProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [payMethod, setPayMethod] = useState<PayMethod>('cod')
  const [buyLoading, setBuyLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getListing(id).then(async l => {
      setListing(l)
      if (l) {
        try {
          const profile = await getUserProfile(l.vendorId)
          setVendorProfile(profile)
        } catch {
          // vendor profile unreadable — bank transfer info won't show
        }
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleBuy = async () => {
    if (!listing) return
    setBuyLoading(true)
    setError('')
    try {
      if (payMethod === 'stripe') {
        await initiateCheckout(listing.id, 1)
      } else {
        const { orderId } = await initiateLocalOrder(listing.id, 1, payMethod)
        navigate(`/orders/${orderId}`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('listing.checkoutFailed'))
      setBuyLoading(false)
    }
  }

  if (loading) return <p className="text-slate-400 p-8">{t('browse.loading')}</p>
  if (!listing) return <p className="text-slate-400 p-8">Listing not found.</p>

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickupStart = new Date(listing.pickupStart.seconds * 1000).toLocaleString('vi-VN')
  const pickupEnd = new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const isSoldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0

  const payOptions: { method: PayMethod; label: string; icon: string }[] = [
    { method: 'cod', label: t('payment.cod'), icon: '💵' },
    { method: 'bank_transfer', label: t('payment.bankTransfer'), icon: '🏦' },
    { method: 'stripe', label: t('payment.card'), icon: '💳' },
  ]

  const buyLabel = () => {
    if (isSoldOut) return t('listing.soldOut')
    if (buyLoading) return payMethod === 'stripe' ? t('listing.redirecting') : t('payment.processing')
    return `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-4">{t('listing.back')}</button>
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
              <p className="text-slate-400">{t('listing.remaining')}</p>
              <p className="text-white font-medium">{listing.quantityRemaining} boxes</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">{t('listing.pickup')}</p>
              <p className="text-white font-medium">{pickupStart} – {pickupEnd}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">{t('listing.category')}</p>
              <p className="text-white font-medium capitalize">{listing.category}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-400">{t('listing.type')}</p>
              <p className="text-white font-medium">{listing.type === 'mystery_box' ? t('listing.mysteryBox') : t('listing.singleItem')}</p>
            </div>
          </div>

          {!isSoldOut && (
            <div>
              <p className="text-slate-400 text-sm mb-2">{t('payment.selectMethod')}</p>
              <div className="grid grid-cols-3 gap-2">
                {payOptions.map(opt => (
                  <button
                    key={opt.method}
                    onClick={() => setPayMethod(opt.method)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      payMethod === opt.method
                        ? 'border-indigo-500 bg-indigo-950 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {payMethod === 'bank_transfer' && !isSoldOut && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-slate-300 font-medium">{t('payment.bankDetails')}</p>
              {vendorProfile?.bankAccount ? (
                <>
                  {vendorProfile.bankName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('payment.bankName')}</span>
                      <span className="text-white font-medium">{vendorProfile.bankName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('payment.bankAccount')}</span>
                    <span className="text-white font-mono font-bold">{vendorProfile.bankAccount}</span>
                  </div>
                  {vendorProfile.bankAccountName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('payment.bankAccountName')}</span>
                      <span className="text-white font-medium">{vendorProfile.bankAccountName}</span>
                    </div>
                  )}
                  <p className="text-slate-500 text-xs pt-1">{t('payment.bankTransferNote')}</p>
                </>
              ) : (
                <p className="text-yellow-400 text-xs">{t('payment.noBankInfo')}</p>
              )}
            </div>
          )}

          {payMethod === 'cod' && !isSoldOut && (
            <p className="text-slate-500 text-sm">{t('payment.codNote')}</p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            onClick={handleBuy}
            disabled={isSoldOut || buyLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 text-base disabled:opacity-50"
          >
            {buyLabel()}
          </Button>
        </div>
      </div>
    </div>
  )
}
