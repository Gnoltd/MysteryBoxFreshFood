import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeCanvas } from 'qrcode.react'
import { StatusChip } from '../../components/shared/StatusChip'
import { useAuth } from '../../contexts/AuthContext'
import { submitReview, getReviewForOrder } from '../../services/reviews'
import { ArrowLeft, Share2, Download, Star, CheckCircle } from 'lucide-react'
import type { Order } from '../../types'

const STATUS_STEPS: Array<{ key: string; labelKey: string }> = [
  { key: 'paid',      labelKey: 'order.statusPaid' },
  { key: 'picked_up', labelKey: 'order.statusPickedUp' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { currentUser, userProfile } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'orders', id), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order)
    })
    return unsub
  }, [id])

  if (!order) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full gradient-bg animate-pulse" />
    </div>
  )

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const statusVariant = order.status === 'picked_up' ? 'emerald' : order.status === 'paid' ? 'primary' : 'rose'
  const orderRef = '#SVR-' + order.id.slice(0, 6).toUpperCase()

  const pickupTime = order.pickupEnd
    ? new Date(order.pickupEnd.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const canRate = order.status === 'picked_up'

  // Check if already reviewed
  useEffect(() => {
    if (!order || !canRate) return
    getReviewForOrder(order.id).then(r => { if (r) { setRating(r.rating); setComment(r.comment); setSubmitted(true) } })
  }, [order?.id, canRate])

  const handleSubmitRating = async () => {
    if (!order || !currentUser || rating === 0 || submitting || submitted) return
    setSubmitting(true)
    try {
      await submitReview({
        orderId: order.id,
        listingId: order.listingId,
        vendorId: order.vendorId,
        customerId: currentUser.uid,
        rating,
        comment,
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: order.listingTitle, text: `Order ${orderRef}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveQR = () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${order.id.slice(0, 8)}.png`
    a.click()
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 max-w-lg mx-auto">
        <Link to="/orders" className="flex items-center gap-1 text-on-surface-variant text-body-sm hover:text-on-surface transition-colors">
          <ArrowLeft size={16} /> {t('nav.myOrders')}
        </Link>
        <p className="gradient-text font-bold text-body-sm">MysteryBox</p>
        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 flex flex-col gap-5 mt-2">
        {/* Status + order ref */}
        <div className="flex flex-col items-center gap-2 text-center">
          <StatusChip variant={statusVariant}>{t(`order.status_${order.status}`)}</StatusChip>
          <p className="text-on-surface-variant text-body-sm">{orderRef}</p>
        </div>

        {/* Title + subtitle */}
        <div className="text-center">
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">{order.listingTitle}</h1>
          {pickupTime && (
            <p className="text-on-surface-variant text-body-sm mt-1">
              {t('order.pickupToday', { time: pickupTime })}
            </p>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t('order.items'), value: String(order.quantity) },
            { label: t('order.total'), value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col gap-1">
              <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
              <span className="text-mono-stat font-semibold text-on-surface">{value}</span>
            </div>
          ))}
        </div>

        {/* Live status tracker */}
        <div className="flex items-center gap-3">
          {STATUS_STEPS.map((step) => {
            const done = order.status === 'picked_up' || step.key === 'paid'
            const active = order.status === step.key
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${done ? 'gradient-bg' : 'bg-outline-variant'} ${active ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`} />
                <span className="text-xs text-on-surface-variant text-center">{t(step.labelKey)}</span>
              </div>
            )
          })}
        </div>

        {/* QR section */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col items-center gap-4">
          <div>
            <p className="text-on-surface font-semibold text-center">{t('order.pickupQR')}</p>
            <p className="text-on-surface-variant text-body-sm text-center mt-1">{t('order.showVendor')}</p>
          </div>

          {/* QR code on white bg */}
          <div ref={qrRef} className="bg-white p-4 rounded-xl">
            <QRCodeCanvas value={order.qrCode} size={180} bgColor="#ffffff" fgColor="#000000" />
          </div>

          <p className="text-primary font-mono text-body-sm tracking-wider">{order.qrCode.slice(0, 16).toUpperCase()}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant rounded-lg py-2.5 text-body-sm hover:border-primary hover:text-on-surface transition-colors"
            >
              <Share2 size={15} /> {copied ? t('order.copied', 'Copied!') : t('order.share')}
            </button>
            <button
              onClick={handleSaveQR}
              className="flex-1 flex items-center justify-center gap-2 gradient-bg text-white rounded-lg py-2.5 text-body-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Download size={15} /> {t('order.saveQR')}
            </button>
          </div>
        </div>

        {/* Payment details */}
        {order.paymentMethod && (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
            <p className="text-on-surface font-semibold">{t('order.paymentDetails')}</p>
            <div className="flex flex-col gap-2">
              {[
                { label: t('order.method'), value: t(`payment.${order.paymentMethod}`) },
                { label: t('order.orderId'), value: order.id.slice(0, 8).toUpperCase() },
                { label: t('order.amount'), value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-on-surface-variant text-body-sm">{label}</span>
                  <span className="text-on-surface text-body-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate experience */}
        <div className={`bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-4 ${!canRate ? 'opacity-50' : ''}`}>
          <p className="text-on-surface font-semibold">{t('order.rateExperience')}</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                disabled={!canRate}
                onClick={() => canRate && setRating(star)}
                onMouseEnter={() => canRate && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
              >
                <Star
                  size={28}
                  className={star <= (hoverRating || rating) ? 'text-tertiary fill-tertiary' : 'text-outline'}
                />
              </button>
            ))}
          </div>
          <textarea
            disabled={!canRate}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('order.ratePlaceholder')}
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:cursor-not-allowed resize-none"
          />
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-[rgb(16,185,129)] text-body-sm font-semibold py-2">
              <CheckCircle size={16} />
              {t('order.ratingSubmitted', 'Review submitted — thank you!')}
            </div>
          ) : (
            <button
              onClick={handleSubmitRating}
              disabled={!canRate || rating === 0 || submitting}
              className="gradient-bg text-white rounded-lg py-2.5 font-semibold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? t('order.submitting', 'Submitting…') : t('order.submitRating')}
            </button>
          )}
          {!canRate && (
            <p className="text-on-surface-variant text-xs text-center">{t('order.rateAfterPickup')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
