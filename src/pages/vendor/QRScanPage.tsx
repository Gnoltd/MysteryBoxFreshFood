import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../contexts/AuthContext'
import { redeemQRCode } from '../../services/orders'
import type { Order } from '../../types'

export default function QRScanPage() {
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
      <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
      <p className="text-slate-400 text-sm mb-6">Point camera at customer's QR code to confirm pickup</p>

      {status === 'scanning' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div id="qr-reader" className="w-full" />
        </div>
      )}

      {status === 'success' && result && (
        <div className="bg-slate-900 border border-green-700 rounded-xl p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white text-xl font-bold">Pickup Confirmed!</h2>
          <p className="text-slate-400 mt-2">{result.listingTitle}</p>
          <p className="text-slate-400 text-sm">
            {result.quantity} box · {result.totalPrice.toLocaleString('vi-VN')} đ
          </p>
          <button
            onClick={handleReset}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Scan another
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-slate-900 border border-red-700 rounded-xl p-8">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-white text-xl font-bold">Invalid QR Code</h2>
          <p className="text-red-400 mt-2">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
