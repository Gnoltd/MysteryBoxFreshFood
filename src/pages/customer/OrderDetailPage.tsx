import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { GlassNav } from '../../components/shared/GlassNav'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const STATUS_STEPS: Array<{ key: string; labelKey: string }> = [
  { key: 'paid',      labelKey: 'order.statusPaid' },
  { key: 'picked_up', labelKey: 'order.statusPickedUp' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [order, setOrder] = useState<Order | null>(null)

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

  const statusVariant = order.status === 'picked_up' ? 'emerald' : order.status === 'paid' ? 'primary' : 'rose'

  return (
    <div className="min-h-screen bg-background pb-8">
      <GlassNav backHref="/orders" backLabel={t('nav.myOrders')} />
      <div className="pt-20 max-w-md mx-auto px-6 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
            <QRCodeSVG value={order.qrCode} size={200} bgColor="transparent" fgColor="#dce1fb" />
          </div>
          <StatusChip variant={statusVariant}>{t(`order.status_${order.status}`)}</StatusChip>
        </div>

        {/* Live status bar */}
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

        {/* Info */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
          {[
            { label: t('order.box'),     value: order.listingTitle },
            { label: t('order.amount'),  value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
            { label: t('order.orderId'), value: order.id.slice(0, 8).toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-on-surface-variant text-body-sm">{label}</span>
              <span className="text-on-surface text-body-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
