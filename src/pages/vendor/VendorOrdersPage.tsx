import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorOrders } from '../../services/orders'
import type { Order, OrderStatus } from '../../types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-slate-700 text-slate-300',
  cancelled: 'bg-red-900 text-red-300',
}

export default function VendorOrdersPage() {
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

  if (loading) return <p className="text-slate-400">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <Link
          to="/vendor/scan"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Scan QR →
        </Link>
      </div>

      {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}

      <div className="space-y-3">
        {orders.map(o => (
          <div
            key={o.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-white font-medium">{o.listingTitle}</p>
              <p className="text-slate-400 text-sm">
                {new Date(o.createdAt.seconds * 1000).toLocaleString('vi-VN')} · {o.quantity} box ·{' '}
                {o.totalPrice.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status]}`}>
              {o.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
