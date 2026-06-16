import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { subscribeToOrder } from '../../services/orders'
import type { Order } from '../../types'

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToOrder(id, o => { setOrder(o); setLoading(false) })
    return unsub
  }, [id])

  if (loading) return <p className="text-slate-400 p-8">{t('browse.loading')}</p>
  if (!order) return <p className="text-slate-400 p-8">Order not found.</p>

  const isPickedUp = order.status === 'picked_up'
  const isPaid = order.status === 'paid'

  return (
    <div className="max-w-sm mx-auto text-center">
      <button onClick={() => navigate('/orders')} className="text-slate-400 hover:text-white text-sm mb-6 block text-left">{t('order.backToOrders')}</button>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white text-xl font-bold mb-1">{order.listingTitle}</h2>
        <p className="text-slate-400 text-sm mb-6">{order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ</p>

        {isPaid && (
          <>
            <p className="text-green-400 font-medium text-sm mb-4">{t('order.showQR')}</p>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4">
              <QRCodeSVG value={order.qrCode} size={200} />
            </div>
            <p className="text-slate-500 text-xs font-mono break-all">{order.qrCode}</p>
          </>
        )}

        {isPickedUp && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold">{t('order.pickedUp')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('order.enjoy')}</p>
          </div>
        )}

        {order.status === 'pending' && (
          <p className="text-yellow-400 text-sm">{t('order.paymentPending')}</p>
        )}
      </div>
    </div>
  )
}
