import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { subscribeToOrder } from '../../services/orders'

export default function CheckoutSuccessPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const orderId = params.get('order_id')
  const navigate = useNavigate()

  useEffect(() => {
    if (!orderId) { navigate('/browse'); return }
    const unsub = subscribeToOrder(orderId, o => {
      if (o?.status === 'paid') navigate(`/orders/${orderId}`, { replace: true })
    })
    return unsub
  }, [orderId])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-4xl mb-4 animate-spin">⏳</div>
      <h2 className="text-white text-xl font-bold">{t('order.confirmingPayment')}</h2>
      <p className="text-slate-400 mt-2">{t('order.confirmingPaymentSub')}</p>
    </div>
  )
}
