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
      <h1 className="text-headline-md font-bold text-on-surface mb-6">{t('nav.myOrders')}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-body-lg">{t('order.noOrders')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="relative group bg-surface-container-low border border-surface-container-highest rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-200 flex items-center p-4 gap-4"
            >
              {/* Gradient top accent on hover */}
              <div className="absolute top-0 left-0 w-full h-[2px] gradient-bg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-xl shrink-0">🎁</div>
              <div className="flex-1 min-w-0">
                <p className="text-on-surface font-semibold text-body-sm truncate">{order.listingTitle}</p>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-primary font-bold text-body-sm">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                <StatusChip variant={statusVariant(order.status)}>
                  {t(`order.status_${order.status}`)}
                </StatusChip>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
