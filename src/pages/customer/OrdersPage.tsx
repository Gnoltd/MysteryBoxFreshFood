import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToCustomerOrders } from '../../services/orders'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const statusVariant = (s: string): 'primary' | 'emerald' | 'rose' | 'slate' => {
  if (s === 'paid') return 'primary'
  if (s === 'picked_up') return 'slate'
  if (s === 'refunded' || s === 'cancelled') return 'rose'
  return 'slate'
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile) return
    const unsub = subscribeToCustomerOrders(userProfile.uid, data => {
      setOrders(data)
      setLoading(false)
    })
    return unsub
  }, [userProfile])

  if (loading) return <div className="py-20 text-center text-on-surface-variant">{t('browse.loading')}</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('nav.myOrders')}</h1>
        <p className="text-on-surface-variant text-body-lg mt-1">{t('order.ordersSubtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-body-lg">{t('order.noOrders')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const pickedUp = order.status === 'picked_up'
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col gap-3 hover:border-primary transition-colors"
              >
                {/* Header: name + status chip */}
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-body-sm text-on-surface ${pickedUp ? 'line-through text-on-surface-variant' : ''}`}>
                    {order.listingTitle}
                  </p>
                  <StatusChip variant={statusVariant(order.status)}>
                    {t(`order.status_${order.status}`)}
                  </StatusChip>
                </div>

                {/* Date */}
                <p className="text-on-surface-variant text-xs">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                </p>

                {/* Divider */}
                <div className="border-t border-outline-variant" />

                {/* Footer: boxes + price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
                    <span>📦</span>
                    <span>×{order.quantity} {t('order.boxes')}</span>
                  </div>
                  <span className="text-primary font-bold text-body-sm">
                    {order.totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
