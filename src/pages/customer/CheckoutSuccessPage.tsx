import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../contexts/AuthContext'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const STATUS_STEPS = ['paid', 'picked_up'] as const
const STEP_LABELS: Record<string, string> = { paid: 'order.statusPaid', picked_up: 'order.statusPickedUp' }

export default function CheckoutSuccessPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!userProfile || !sessionId) return
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', userProfile.uid),
      where('stripeSessionId', '==', sessionId),
      limit(1)
    )
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order)
    })
    return unsub
  }, [userProfile, sessionId])

  return (
    <div className="max-w-[480px] mx-auto py-12 flex flex-col items-center gap-6 text-center">
      <p className="text-primary text-headline-lg-mobile font-bold">MysteryBox Fresh Food</p>

      <div className="relative w-full bg-surface-container-low border border-outline-variant rounded-xl gradient-border-top p-8 shadow-2xl overflow-hidden flex flex-col items-center gap-6">
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="relative w-24 h-24 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-5xl">
          ✅
        </div>

        <div>
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.paymentSuccessful')}</h1>
          <p className="text-on-surface-variant text-body-lg mt-2">{t('order.qrReady')}</p>
        </div>

        {order ? (
          <>
            {/* QR code with white background */}
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={order.qrCode} size={180} bgColor="#ffffff" fgColor="#000000" />
            </div>

            {/* Live status tracker */}
            <div className="w-full flex items-center gap-2">
              {STATUS_STEPS.map((step) => {
                const done = order.status === step || (step === 'paid' && order.status === 'picked_up')
                const active = order.status === step
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-3 h-3 rounded-full transition-all ${done ? 'gradient-bg' : 'bg-outline-variant'} ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} />
                    <span className="text-xs text-on-surface-variant">{t(STEP_LABELS[step])}</span>
                  </div>
                )
              })}
            </div>

            <StatusChip variant={order.status === 'picked_up' ? 'emerald' : 'primary'}>
              {t(`order.status_${order.status}`)}
            </StatusChip>
          </>
        ) : (
          <div className="w-48 h-48 bg-surface-container rounded-xl animate-pulse" />
        )}

        {order ? (
          <Link to={`/orders/${order.id}`} className="w-full">
            <button className="w-full gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              {t('order.viewMyOrder')}
            </button>
          </Link>
        ) : (
          <Link to="/orders" className="w-full">
            <button className="w-full gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              {t('order.viewAll')}
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
