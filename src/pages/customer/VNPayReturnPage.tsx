import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { StatusChip } from '../../components/shared/StatusChip'
import { CheckCircle, XCircle } from 'lucide-react'
import type { Order } from '../../types'

export default function VNPayReturnPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('vnp_TxnRef')
  const responseCode = searchParams.get('vnp_ResponseCode')
  const transactionStatus = searchParams.get('vnp_TransactionStatus')
  const success = responseCode === '00' && transactionStatus === '00'

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    const unsub = onSnapshot(doc(db, 'orders', orderId), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order)
    })
    return unsub
  }, [orderId])

  return (
    <div className="max-w-[480px] mx-auto py-12 flex flex-col items-center gap-6 text-center">
      <p className="text-primary text-headline-lg-mobile font-bold">MysteryBox Fresh Food</p>

      <div className="relative w-full bg-surface-container-low border border-outline-variant rounded-xl gradient-border-top p-8 shadow-2xl overflow-hidden flex flex-col items-center gap-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none" />

        {success ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.paymentSuccessful')}</h1>
              <p className="text-on-surface-variant text-body-lg mt-2">{t('order.qrReady')}</p>
            </div>

            {order?.status === 'paid' ? (
              <>
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={order.qrCode} size={180} bgColor="#ffffff" fgColor="#000000" />
                </div>
                <StatusChip variant="primary">{t('order.status_paid')}</StatusChip>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-40 h-40 bg-surface-container rounded-xl animate-pulse" />
                <p className="text-on-surface-variant text-body-sm">{t('order.waitingConfirm', 'Waiting for payment confirmation…')}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <XCircle size={40} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.vnpayFailed', 'Payment failed')}</h1>
              <p className="text-on-surface-variant text-body-lg mt-2">{t('order.vnpayFailedSub', 'Your payment was not completed. No charge was made.')}</p>
            </div>
          </>
        )}

        {orderId && (
          <Link to={`/orders/${orderId}`} className="w-full">
            <button className="w-full gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              {t('order.viewMyOrder')}
            </button>
          </Link>
        )}
        <Link to="/browse" className="text-primary text-body-sm hover:underline">
          {t('nav.browse')} →
        </Link>
      </div>
    </div>
  )
}
