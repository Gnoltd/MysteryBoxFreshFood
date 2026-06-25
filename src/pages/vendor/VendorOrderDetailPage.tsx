import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToOrder } from '../../services/orders'
import { TimerBadge } from '../../components/shared/TimerBadge'
import { formatBoxItem } from '../../utils/boxDistribution'
import { ArrowLeft, Package, QrCode } from 'lucide-react'
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
  pending: 'PENDING', paid: 'PAID', picked_up: 'PICKED UP',
  cancelled: 'CANCELLED', pending_cod: 'COD',
  pending_bank_transfer: 'BANK', pending_vnpay: 'VNPAY', refunded: 'REFUNDED',
}

export default function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    return subscribeToOrder(id, o => {
      if (o && o.vendorId !== currentUser?.uid) {
        navigate('/vendor/orders')
        return
      }
      setOrder(o)
      setLoading(false)
    })
  }, [id, currentUser])

  if (loading) return <p className="text-on-surface-variant">{t('browse.loading')}</p>
  if (!order) return <p className="text-on-surface-variant">{t('vendor.orderNotFound')}</p>

  const createdAt = new Date(order.createdAt.seconds * 1000).toLocaleString('vi-VN')

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-8">
      {/* Back link */}
      <Link
        to="/vendor/orders"
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
      >
        <ArrowLeft size={16} /> {t('vendor.orders')}
      </Link>

      {/* Order header */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-on-surface font-bold text-lg">{order.listingTitle}</h1>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="text-on-surface-variant text-sm">{createdAt}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-on-surface-variant">
          <span>{order.quantity} {t('vendor.box_unit')}</span>
          <span>·</span>
          <span>{order.totalPrice.toLocaleString('vi-VN')} đ</span>
          {order.paymentMethod && (
            <>
              <span>·</span>
              <span className="uppercase text-outline">{order.paymentMethod.replace('_', ' ')}</span>
            </>
          )}
          {order.boxNumber != null && (
            <>
              <span>·</span>
              <span className="text-primary font-medium">{t('vendor.box_number', { n: order.boxNumber })}</span>
            </>
          )}
        </div>
      </div>

      {/* What to prepare */}
      {order.boxContents && order.boxContents.length > 0 && (
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-1">
            <Package size={13} /> {t('vendor.prepareTitle')}
          </h2>

          {order.boxNumber != null ? (
            <div>
              <p className="text-on-surface font-semibold mb-3">
                {t('vendor.box_number', { n: order.boxNumber })}
              </p>
              <ul className="space-y-2">
                {order.boxContents.map(item => (
                  <li
                    key={item.name}
                    className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5"
                  >
                    <span className="text-on-surface text-sm">{formatBoxItem(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-2">
              {order.boxContents.map(item => (
                <li
                  key={item.name}
                  className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 rounded-lg p-2.5"
                >
                  <span className="text-on-surface text-sm">{formatBoxItem(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pickup info */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-5">
        <div className="flex items-center justify-between">
          {order.pickupEnd
            ? <TimerBadge pickupEnd={order.pickupEnd} />
            : <span className="text-on-surface-variant text-sm">—</span>}
          {order.status === 'paid' && (
            <span className="text-green-400 text-sm">{t('vendor.qrReady')}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <Link
        to="/vendor/scan"
        className="gradient-bg text-white w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <QrCode size={16} /> {t('vendor.scanQR')}
      </Link>
    </div>
  )
}
