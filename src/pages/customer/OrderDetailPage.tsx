import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { subscribeToOrder } from '../../services/orders'
import { getUserProfile } from '../../services/auth'
import { changeOrderPayment } from '../../services/localPayment'
import { vietQRUrl } from '../../constants/banks'
import { getReviewForOrder, submitReview } from '../../services/reviews'
import { useAuth } from '../../contexts/AuthContext'
import { StarRating } from '../../components/shared/StarRating'
import type { Order, UserProfile } from '../../types'

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [vendorProfile, setVendorProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const { currentUser } = useAuth()
  const [hasReview, setHasReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleShareQR = useCallback(async () => {
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const file = new File([blob], 'mysterybox-qr.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'MysteryBox QR' })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mysterybox-qr.png'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [])

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToOrder(id, o => { setOrder(o); setLoading(false) })
    return unsub
  }, [id])

  useEffect(() => {
    if (!order?.vendorId) return
    getUserProfile(order.vendorId).then(setVendorProfile).catch(() => {})
  }, [order?.vendorId])

  useEffect(() => {
    if (!id || !order || order.status !== 'picked_up') return
    getReviewForOrder(id).then(r => setHasReview(r !== null)).catch(() => {})
  }, [id, order?.status])

  const handleSwitchPayment = async (method: 'cod' | 'bank_transfer') => {
    if (!order) return
    setSwitching(true)
    try {
      await changeOrderPayment(order.id, method)
      // order subscription will update the UI automatically
    } catch (err) {
      console.error(err)
    } finally {
      setSwitching(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!order || !currentUser || rating === 0) return
    setReviewSubmitting(true)
    try {
      await submitReview({
        orderId: order.id,
        listingId: order.listingId,
        vendorId: order.vendorId,
        customerId: currentUser.uid,
        rating,
        comment: comment.slice(0, 300),
      })
      setReviewSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return <p className="text-slate-400 p-8">{t('browse.loading')}</p>
  if (!order) return <p className="text-slate-400 p-8">Order not found.</p>

  const isPickedUp = order.status === 'picked_up'
  const isCOD = order.status === 'pending_cod'
  const isBankTransfer = order.status === 'pending_bank_transfer'
  const showQR = ['paid', 'pending_cod', 'pending_bank_transfer'].includes(order.status)
  const canSwitch = isCOD || isBankTransfer

  const hasVietQR = isBankTransfer
    && vendorProfile?.bankBin
    && vendorProfile?.bankAccount

  const qrInstruction = isCOD
    ? t('order.showQRCOD')
    : isBankTransfer
      ? t('order.showQRBank')
      : t('order.showQR')

  return (
    <div className="max-w-sm mx-auto">
      <button onClick={() => navigate('/orders')} className="text-slate-400 hover:text-white text-sm mb-6 block">
        {t('order.backToOrders')}
      </button>

      <div className="space-y-4">
        {/* Order header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white text-xl font-bold">{order.listingTitle}</h2>
          <p className="text-slate-400 text-sm mt-1">{order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ</p>
        </div>

        {/* Bank transfer: VietQR payment card */}
        {isBankTransfer && (
          <div className="bg-slate-900 border border-blue-800 rounded-xl p-5">
            <p className="text-blue-300 font-semibold text-sm mb-4">🏦 {t('order.bankTransferTitle')}</p>

            {hasVietQR ? (
              <div className="text-center mb-4">
                <p className="text-slate-400 text-xs mb-3">{t('order.scanWithBankApp')}</p>
                <div className="bg-white p-3 rounded-xl inline-block">
                  <img
                    src={vietQRUrl(
                      vendorProfile!.bankBin!,
                      vendorProfile!.bankAccount!,
                      order.totalPrice,
                      `MysteryBox ${order.id.slice(0, 8)}`,
                      vendorProfile!.bankAccountName
                    )}
                    alt="VietQR"
                    className="w-52 h-auto"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {t('order.transferRef')}: MysteryBox {order.id.slice(0, 8)}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm mb-3">
                {vendorProfile?.bankName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('payment.bankName')}</span>
                    <span className="text-white font-medium">{vendorProfile.bankName}</span>
                  </div>
                )}
                {vendorProfile?.bankAccount && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('payment.bankAccount')}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(vendorProfile.bankAccount!)}
                      className="text-white font-mono font-bold hover:text-indigo-300"
                      title="Tap to copy"
                    >
                      {vendorProfile.bankAccount} 📋
                    </button>
                  </div>
                )}
                {vendorProfile?.bankAccountName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('payment.bankAccountName')}</span>
                    <span className="text-white font-medium">{vendorProfile.bankAccountName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('order.amount')}</span>
                  <span className="text-white font-bold">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}

            <p className="text-slate-500 text-xs">{t('payment.bankTransferNote')}</p>
          </div>
        )}

        {/* COD notice */}
        {isCOD && (
          <div className="bg-slate-900 border border-orange-800 rounded-xl p-5">
            <p className="text-orange-300 font-semibold text-sm mb-1">💵 {t('order.codTitle')}</p>
            <p className="text-slate-400 text-sm">{t('payment.codNote')}</p>
            <p className="text-slate-400 text-sm font-bold mt-1">{order.totalPrice.toLocaleString('vi-VN')} đ</p>
          </div>
        )}

        {/* Pickup QR */}
        {showQR && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <p className="text-green-400 font-medium text-sm mb-4">{qrInstruction}</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-3">
              <QRCodeSVG value={order.qrCode} size={200} />
            </div>
            <div className="hidden">
              <QRCodeCanvas ref={qrCanvasRef} value={order.qrCode} size={200} />
            </div>
            <p className="text-slate-500 text-xs font-mono break-all">{order.qrCode}</p>
            <button
              onClick={handleShareQR}
              className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              {t('order.share_qr')}
            </button>
            <p className="text-slate-500 text-xs mt-2 italic">{t('order.share_qr_note')}</p>
          </div>
        )}

        {/* Picked up */}
        {isPickedUp && (
          <div className="bg-slate-900 border border-green-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold text-lg">{t('order.pickedUp')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('order.enjoy')}</p>
          </div>
        )}

        {/* Refunded */}
        {order.status === 'refunded' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">💸</div>
            <p className="text-white font-bold text-lg">{t('order.status_refunded')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('order.refund_note')}</p>
          </div>
        )}

        {/* Review form — shown after pickup, once per order */}
        {isPickedUp && !hasReview && !reviewSubmitted && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3">{t('review.leave_review')}</h3>
            <div className="mb-3">
              <p className="text-slate-400 text-sm mb-2">{t('review.rating')}</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={300}
              placeholder={t('review.comment_placeholder')}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-slate-600 text-xs mt-1 text-right">{comment.length}/300</p>
            <button
              onClick={handleSubmitReview}
              disabled={rating === 0 || reviewSubmitting}
              className="mt-3 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {reviewSubmitting ? t('review.submitting') : t('review.submit')}
            </button>
          </div>
        )}

        {/* Thank you after review submitted */}
        {isPickedUp && (hasReview || reviewSubmitted) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <p className="text-green-400 text-sm">⭐ {t('review.thanks')}</p>
          </div>
        )}

        {/* Pending Stripe */}
        {order.status === 'pending' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-yellow-400 text-sm">{t('order.paymentPending')}</p>
          </div>
        )}

        {/* Change payment method */}
        {canSwitch && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm mb-3">{t('order.changePayment')}</p>
            <div className="flex gap-2">
              {isBankTransfer && (
                <button
                  onClick={() => handleSwitchPayment('cod')}
                  disabled={switching}
                  className="flex-1 py-2 rounded-lg border border-orange-700 text-orange-300 text-sm font-medium hover:bg-orange-950 disabled:opacity-50 transition-colors"
                >
                  {switching ? '…' : `💵 ${t('payment.cod')}`}
                </button>
              )}
              {isCOD && (
                <button
                  onClick={() => handleSwitchPayment('bank_transfer')}
                  disabled={switching}
                  className="flex-1 py-2 rounded-lg border border-blue-700 text-blue-300 text-sm font-medium hover:bg-blue-950 disabled:opacity-50 transition-colors"
                >
                  {switching ? '…' : `🏦 ${t('payment.bankTransfer')}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
