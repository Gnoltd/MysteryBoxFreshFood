import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToCustomerOrders } from '../../services/orders'
import type { Order } from '../../types'

const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-slate-700 text-slate-300',
  cancelled: 'bg-red-900 text-red-300',
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToCustomerOrders(currentUser.uid, data => { setOrders(data); setLoading(false) })
    return unsub
  }, [currentUser])

  if (loading) return <p className="text-slate-400">{t('browse.loading')}</p>
  if (orders.length === 0) return (
    <div className="text-center mt-16">
      <p className="text-slate-400">{t('order.noOrders')}</p>
      <Link to="/browse" className="text-indigo-400 hover:underline text-sm mt-2 block">Browse listings →</Link>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('order.title')}</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`} className="block">
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl p-4 flex items-center justify-between transition-colors">
              <div>
                <p className="text-white font-medium">{order.listingTitle}</p>
                <p className="text-slate-400 text-sm">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString('vi-VN')} · {order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
