import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorOrders } from '../../services/orders'
import type { Order, OrderStatus } from '../../types'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  paid: 'bg-green-900 text-green-300',
  picked_up: 'bg-slate-700 text-slate-300',
  cancelled: 'bg-red-900 text-red-300',
  pending_cod: 'bg-orange-900 text-orange-300',
  pending_bank_transfer: 'bg-blue-900 text-blue-300',
  refunded: 'bg-slate-700 text-slate-400',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'PENDING',
  paid: 'PAID',
  picked_up: 'PICKED UP',
  cancelled: 'CANCELLED',
  pending_cod: 'COD',
  pending_bank_transfer: 'BANK',
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

  if (loading) return <p className="text-slate-400">{t('browse.loading')}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('vendor.orders')}</h1>
        <Link
          to="/vendor/scan"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {t('vendor.scanQRArrow')}
        </Link>
      </div>

      {orders.length === 0 && <p className="text-slate-400">{t('vendor.noOrders')}</p>}

      <div className="space-y-3">
        {orders.map(o => (
          <div
            key={o.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-medium">{o.listingTitle}</p>
                <p className="text-slate-400 text-sm">
                  {new Date(o.createdAt.seconds * 1000).toLocaleString('vi-VN')} · {o.quantity} box ·{' '}
                  {o.totalPrice.toLocaleString('vi-VN')} đ
                  {o.paymentMethod && (
                    <span className="ml-1 text-slate-500">· {o.paymentMethod.replace('_', ' ')}</span>
                  )}
                </p>
                {o.boxContents && o.boxContents.length > 0 && (
                  <p className="text-slate-500 text-xs mt-1">
                    📦 {t('vendor.each_box')}: {o.boxContents.map(b => `${b.qty}× ${b.name}`).join(', ')}
                  </p>
                )}
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
