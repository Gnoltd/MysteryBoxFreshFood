import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../contexts/AuthContext'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'
import { CheckCircle } from 'lucide-react'

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
    <div className="max-w-md mx-auto py-12 flex flex-col items-center gap-8 text-center">
      <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center">
        <CheckCircle size={40} className="text-white" />
      </div>

      <div>
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.confirmed')}</h1>
        <p className="text-on-surface-variant text-body-lg mt-2">{t('order.showQR')}</p>
      </div>

      {order ? (
        <>
          <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
            <QRCodeSVG value={order.qrCode} size={200} bgColor="transparent" fgColor="#dce1fb" />
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

      <Link to="/orders"><GhostButton>{t('order.viewAll')}</GhostButton></Link>
    </div>
  )
}
