import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../contexts/AuthContext'
import { redeemQRCode } from '../../services/orders'
import type { Order } from '../../types'

export default function QRScanPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning')
  const [result, setResult] = useState<Order | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!currentUser) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 } },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        try {
          await scanner.clear()
          const order = await redeemQRCode(decodedText, currentUser.uid)
          setResult(order)
          setStatus('success')
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Invalid QR code')
          setStatus('error')
        }
      },
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [currentUser])

  const handleReset = () => {
    setStatus('scanning')
    setResult(null)
    setErrorMsg('')
    if (scannerRef.current) {
      scannerRef.current.render(async () => {}, () => {})
    }
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-on-surface mb-2">{t('vendor.scanQR')}</h1>
      <p className="text-on-surface-variant text-sm mb-6">{t('vendor.scanInstruction')}</p>

      {status === 'scanning' && (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden relative">
          <div id="qr-reader" className="w-full" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 rounded-xl" style={{
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
              boxShadow: '0 0 0 2px #8083ff, 0 0 20px rgba(128, 131, 255, 0.3)',
            }} />
          </div>
        </div>
      )}

      {status === 'success' && result && (
        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
          <div className="bg-surface-container border border-emerald-500/50 rounded-xl p-6 text-center">
            <img src="/images/icons/success.png" alt="success" className="w-12 h-12 mx-auto mb-4 object-contain" />
            <h2 className="text-on-surface text-xl font-bold">{t('vendor.pickupConfirmed')}</h2>
            <p className="text-on-surface-variant mt-2">{result.listingTitle}</p>
            <p className="text-on-surface-variant text-sm">
              {result.quantity} box · {result.totalPrice.toLocaleString('vi-VN')} đ
            </p>
            <button
              onClick={handleReset}
              className="mt-6 gradient-bg text-on-surface px-6 py-2 rounded-xl text-sm font-medium"
            >
              {t('vendor.scanAnother')}
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 bg-error-container/20 flex items-center justify-center">
          <div className="bg-surface-container border border-error-token/50 rounded-xl p-6 text-center text-error-token">
            <img src="/images/icons/failure.png" alt="failure" className="w-12 h-12 mx-auto mb-4 object-contain" />
            <h2 className="text-on-surface text-xl font-bold">{t('vendor.invalidQR')}</h2>
            <p className="text-red-400 mt-2">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="mt-6 gradient-bg text-on-surface px-6 py-2 rounded-xl text-sm font-medium"
            >
              {t('vendor.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
