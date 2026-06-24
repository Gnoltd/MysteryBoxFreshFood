import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorOrders } from '../../services/orders'
import { TimerBadge } from '../../components/shared/TimerBadge'
import type { Order, OrderStatus } from '../../types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-surface-container text-on-surface-variant',
  cancelled: 'bg-red-900 text-red-300',
  pending_cod: 'bg-orange-900 text-orange-300',
  pending_bank_transfer: 'bg-blue-900 text-blue-300',
  pending_vnpay: 'bg-purple-900 text-purple-300',
  refunded: 'bg-surface-container text-on-surface-variant',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'PENDING',
  paid: 'PAID',
  picked_up: 'PICKED UP',
  cancelled: 'CANCELLED',
  pending_cod: 'COD',
  pending_bank_transfer: 'BANK',
  pending_vnpay: 'VNPAY',
  refunded: 'REFUNDED',
}

export default function VendorOrdersPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToVendorOrders(currentUser.uid, data => {
      setOrders(data)
      setLoading(false)
    })
    return unsub
  }, [currentUser])

  if (loading) return <p className="text-on-surface-variant">{t('browse.loading')}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('vendor.orders')}</h1>
        <Link
          to="/vendor/scan"
          className="gradient-bg text-on-surface text-sm font-medium px-4 py-2 rounded-xl"
        >
          {t('vendor.scanQRArrow')}
        </Link>
      </div>

      {orders.length === 0 && <p className="text-on-surface-variant">{t('vendor.noOrders')}</p>}

      <div className="space-y-3">
        {orders.map(o => (
          <div
            key={o.id}
            className="bg-surface-container border border-outline-variant rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-on-surface font-medium">{o.listingTitle}</p>
                <p className="text-on-surface-variant text-sm">
                  {new Date(o.createdAt.seconds * 1000).toLocaleString('vi-VN')} · {o.quantity} box ·{' '}
                  {o.totalPrice.toLocaleString('vi-VN')} đ
                  {o.paymentMethod && (
                    <span className="ml-1 text-outline">· {o.paymentMethod.replace('_', ' ')}</span>
                  )}
                </p>
                {o.boxContents && o.boxContents.length > 0 && (
                  <p className="text-outline text-xs mt-1">
                    <img src="/images/icons/single-item.png" alt="" className="w-3 h-3 object-contain inline mr-1" />{t('vendor.each_box')}: {o.boxContents.map(b => `${b.qty}× ${b.name}`).join(', ')}
                  </p>
                )}
                <div className="mt-1 hidden md:block">
                  {o.pickupEnd
                    ? <TimerBadge pickupEnd={o.pickupEnd} />
                    : <span className="text-on-surface-variant text-xs">—</span>}
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[o.status]}`}>
                {STATUS_LABEL[o.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
