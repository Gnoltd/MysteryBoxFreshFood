import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { subscribeToOrder } from '../../services/orders'
import { getUserProfile } from '../../services/auth'
import { changeOrderPayment } from '../../services/localPayment'
import { vietQRUrl } from '../../constants/banks'
import type { Order, UserProfile } from '../../types'

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [vendorProfile, setVendorProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = subscribeToOrder(id, o => { setOrder(o); setLoading(false) })
    return unsub
  }, [id])

  useEffect(() => {
    if (!order?.vendorId) return
    getUserProfile(order.vendorId).then(setVendorProfile).catch(() => {})
  }, [order?.vendorId])

  const handleSwitchPayment = async (method: 'cod' | 'bank_transfer') => {
    if (!order) return
    setSwitching(true)
    try {
      await changeOrderPayment(order.id, method)
      // order subscription will update the UI automatically
    } catch (err) {
      console.error(err)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) return <p className="text-slate-400 p-8">{t('browse.loading')}</p>
  if (!order) return <p className="text-slate-400 p-8">Order not found.</p>

  const isPickedUp = order.status === 'picked_up'
  const isCOD = order.status === 'pending_cod'
  const isBankTransfer = order.status === 'pending_bank_transfer'
  const showQR = ['paid', 'pending_cod', 'pending_bank_transfer'].includes(order.status)
  const canSwitch = isCOD || isBankTransfer

  const hasVietQR = isBankTransfer
    && vendorProfile?.bankBin
    && vendorProfile?.bankAccount

  const qrInstruction = isCOD
    ? t('order.showQRCOD')
    : isBankTransfer
      ? t('order.showQRBank')
      : t('order.showQR')

  return (
    <div className="max-w-sm mx-auto">
      <button onClick={() => navigate('/orders')} className="text-slate-400 hover:text-white text-sm mb-6 block">
        {t('order.backToOrders')}
      </button>

      <div className="space-y-4">
        {/* Order header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white text-xl font-bold">{order.listingTitle}</h2>
          <p className="text-slate-400 text-sm mt-1">{order.quantity} box · {order.totalPrice.toLocaleString('vi-VN')} đ</p>
        </div>

        {/* Bank transfer: VietQR payment card */}
        {isBankTransfer && (
          <div className="bg-slate-900 border border-blue-800 rounded-xl p-5">
            <p className="text-blue-300 font-semibold text-sm mb-4">🏦 {t('order.bankTransferTitle')}</p>

            {hasVietQR ? (
              <div className="text-center mb-4">
                <p className="text-slate-400 text-xs mb-3">{t('order.scanWithBankApp')}</p>
                <div className="bg-white p-3 rounded-xl inline-block">
                  <img
                    src={vietQRUrl(
                      vendorProfile!.bankBin!,
                      vendorProfile!.bankAccount!,
                      order.totalPrice,
                      `MysteryBox ${order.id.slice(0, 8)}`,
                      vendorProfile!.bankAccountName
                    )}
                    alt="VietQR"
                    className="w-52 h-auto"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {t('order.transferRef')}: MysteryBox {order.id.slice(0, 8)}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm mb-3">
                {vendorProfile?.bankName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('payment.bankName')}</span>
                    <span className="text-white font-medium">{vendorProfile.bankName}</span>
                  </div>
                )}
                {vendorProfile?.bankAccount && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('payment.bankAccount')}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(vendorProfile.bankAccount!)}
                      className="text-white font-mono font-bold hover:text-indigo-300"
                      title="Tap to copy"
                    >
                      {vendorProfile.bankAccount} 📋
                    </button>
                  </div>
                )}
                {vendorProfile?.bankAccountName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('payment.bankAccountName')}</span>
                    <span className="text-white font-medium">{vendorProfile.bankAccountName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('order.amount')}</span>
                  <span className="text-white font-bold">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}

            <p className="text-slate-500 text-xs">{t('payment.bankTransferNote')}</p>
          </div>
        )}

        {/* COD notice */}
        {isCOD && (
          <div className="bg-slate-900 border border-orange-800 rounded-xl p-5">
            <p className="text-orange-300 font-semibold text-sm mb-1">💵 {t('order.codTitle')}</p>
            <p className="text-slate-400 text-sm">{t('payment.codNote')}</p>
            <p className="text-slate-400 text-sm font-bold mt-1">{order.totalPrice.toLocaleString('vi-VN')} đ</p>
          </div>
        )}

        {/* Pickup QR */}
        {showQR && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <p className="text-green-400 font-medium text-sm mb-4">{qrInstruction}</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-3">
              <QRCodeSVG value={order.qrCode} size={200} />
            </div>
            <p className="text-slate-500 text-xs font-mono break-all">{order.qrCode}</p>
          </div>
        )}

        {/* Picked up */}
        {isPickedUp && (
          <div className="bg-slate-900 border border-green-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold text-lg">{t('order.pickedUp')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('order.enjoy')}</p>
          </div>
        )}

        {/* Pending Stripe */}
        {order.status === 'pending' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-yellow-400 text-sm">{t('order.paymentPending')}</p>
          </div>
        )}

        {/* Change payment method */}
        {canSwitch && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm mb-3">{t('order.changePayment')}</p>
            <div className="flex gap-2">
              {isBankTransfer && (
                <button
                  onClick={() => handleSwitchPayment('cod')}
                  disabled={switching}
                  className="flex-1 py-2 rounded-lg border border-orange-700 text-orange-300 text-sm font-medium hover:bg-orange-950 disabled:opacity-50 transition-colors"
                >
                  {switching ? '…' : `💵 ${t('payment.cod')}`}
                </button>
              )}
              {isCOD && (
                <button
                  onClick={() => handleSwitchPayment('bank_transfer')}
                  disabled={switching}
                  className="flex-1 py-2 rounded-lg border border-blue-700 text-blue-300 text-sm font-medium hover:bg-blue-950 disabled:opacity-50 transition-colors"
                >
                  {switching ? '…' : `🏦 ${t('payment.bankTransfer')}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
