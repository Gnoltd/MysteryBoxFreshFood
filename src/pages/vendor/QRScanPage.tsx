import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '../../contexts/AuthContext'
import { redeemQRCode } from '../../services/orders'
import type { Order } from '../../types'

type ScanStatus = 'scanning' | 'success' | 'error'

export default function QRScanPage() {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [result, setResult] = useState<Order | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const particlesRef = useRef<HTMLDivElement>(null)
  const errorCardRef = useRef<HTMLDivElement>(null)

  // Camera scanner — uses Html5Qrcode (no UI buttons) so camera starts immediately
  useEffect(() => {
    if (!currentUser || status !== 'scanning') return

    const qrcode = new Html5Qrcode('qr-reader')
    scannerRef.current = qrcode
    let done = false

    qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      async (decodedText) => {
        if (done) return
        done = true
        try {
          await qrcode.stop()
          const order = await redeemQRCode(decodedText, currentUser.uid)
          setResult(order)
          setStatus('success')
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Invalid QR code')
          setStatus('error')
        }
      },
      () => {}
    ).catch((err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : 'Could not access camera')
      setStatus('error')
    })

    return () => {
      if (!done) qrcode.stop().catch(() => {})
    }
  }, [currentUser, status])

  // Floating particles on success
  useEffect(() => {
    if (status !== 'success' || !particlesRef.current) return
    const el = particlesRef.current
    const create = () => {
      const p = document.createElement('div')
      const size = Math.random() * 4 + 2
      p.style.cssText = [
        `position:absolute`,
        `width:${size}px`,
        `height:${size}px`,
        `background:rgba(16,185,129,0.6)`,
        `border-radius:50%`,
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 50 + 50}%`,
        `animation:qr-float-up ${Math.random() * 3 + 2}s ${Math.random() * 2}s linear forwards`,
        `pointer-events:none`,
      ].join(';')
      p.addEventListener('animationend', () => { p.remove(); if (el.isConnected) create() })
      el.appendChild(p)
    }
    for (let i = 0; i < 40; i++) create()
    return () => { el.innerHTML = '' }
  }, [status])

  // Shake card on error entry
  useEffect(() => {
    if (status !== 'error' || !errorCardRef.current) return
    const el = errorCardRef.current
    el.classList.add('qr-shake')
    const timer = setTimeout(() => el.classList.remove('qr-shake'), 600)
    return () => clearTimeout(timer)
  }, [status])

  const reset = () => {
    setStatus('scanning')
    setResult(null)
    setErrorMsg('')
    setShowManual(false)
    setManualCode('')
    setManualLoading(false)
  }

  const submitManual = async () => {
    if (!manualCode.trim() || !currentUser) return
    setManualLoading(true)
    try {
      const order = await redeemQRCode(manualCode.trim(), currentUser.uid)
      setResult(order)
      setStatus('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid QR code')
      setManualLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col overflow-hidden relative">

      {/* ── SCANNING ── */}
      {status === 'scanning' && (
        <>
          <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-4 bg-surface/60 backdrop-blur-md border-b border-outline-variant">
            <span className="material-symbols-outlined text-[#c0c1ff]">qr_code_scanner</span>
            <h1 className="font-bold text-xl text-[#c0c1ff] tracking-tight">{t('vendor.scanQR')}</h1>
            <div className="w-10" />
          </header>

          <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pt-20 pb-28 md:pb-8">
            {/* Viewfinder */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0">
              <div className="absolute inset-0 bg-surface-container/40 backdrop-blur-md rounded-2xl border border-outline-variant overflow-hidden shadow-2xl qr-grid-bg">
                <div id="qr-reader" className="w-full h-full" />
                {/* Scanning line */}
                <div className="qr-scan-line absolute top-0 left-0 w-full h-full flex flex-col pointer-events-none z-20">
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#e1e0ff] to-transparent blur-[0.5px]" />
                  <div className="h-24 w-full bg-gradient-to-b from-[#c0c1ff]/20 to-transparent" />
                </div>
              </div>
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[3px] border-l-[3px] border-[#c0c1ff] rounded-tl-2xl z-30"
                style={{ boxShadow: '0 0 8px #c0c1ff, inset 0 0 8px #c0c1ff' }} />
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[3px] border-r-[3px] border-[#ddb7ff] rounded-tr-2xl z-30"
                style={{ boxShadow: '0 0 8px #ddb7ff, inset 0 0 8px #ddb7ff' }} />
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[3px] border-l-[3px] border-[#ddb7ff] rounded-bl-2xl z-30"
                style={{ boxShadow: '0 0 8px #ddb7ff, inset 0 0 8px #ddb7ff' }} />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[3px] border-r-[3px] border-[#c0c1ff] rounded-br-2xl z-30"
                style={{ boxShadow: '0 0 8px #c0c1ff, inset 0 0 8px #c0c1ff' }} />
              {/* Center reticle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-outline/30 rounded-full flex items-center justify-center z-10">
                <div className="w-1 h-1 bg-outline/50 rounded-full" />
              </div>
            </div>

            {/* Scanning pill */}
            <div className="flex items-center gap-3 px-6 py-3 bg-surface-container-high/90 backdrop-blur-xl rounded-full border border-[#c0c1ff]/40 shadow-[0_4px_24px_rgba(192,193,255,0.15)] animate-pulse">
              <span className="material-symbols-outlined text-[#c0c1ff] animate-spin" style={{ fontSize: 20 }}>autorenew</span>
              <span className="text-xs font-bold text-[#c0c1ff] tracking-widest uppercase">
                {t('vendor.scanning', 'Scanning...')}
              </span>
            </div>

            <p className="text-sm text-on-surface-variant text-center max-w-[260px]">
              {t('vendor.scanInstruction')}
            </p>
          </main>
        </>
      )}

      {/* ── SUCCESS ── */}
      {status === 'success' && result && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 md:pb-8 relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle at 50% 25%, rgba(16,185,129,0.25) 0%, rgba(12,19,36,0) 70%)' }} />
          <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-0" />

          <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
            {/* Animated checkmark */}
            <div className="relative flex items-center justify-center w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-[rgba(16,185,129,0.3)] qr-pulse-ring" />
              <div className="absolute inset-4 rounded-full bg-[rgba(16,185,129,0.15)] backdrop-blur-sm flex items-center justify-center"
                style={{ boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
                <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
                  <circle className="qr-circle-draw" cx="50" cy="50" r="45"
                    stroke="rgb(16,185,129)" strokeWidth="5" strokeLinecap="round" />
                  <path className="qr-check-draw" d="M30 50 L45 65 L70 35"
                    stroke="rgb(16,185,129)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-on-surface mb-8 text-center tracking-tight drop-shadow-md">
              {t('vendor.pickupConfirmed')}
            </h1>

            {/* Order card */}
            <div className="w-full bg-surface-container/60 backdrop-blur-xl border border-outline-variant rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[rgba(16,185,129,0.5)] to-transparent" />
              <div className="flex items-start gap-4 border-b border-outline-variant/50 pb-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center shrink-0 border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">takeout_dining</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-xl text-on-surface leading-tight">{result.listingTitle}</h2>
                  <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[rgb(16,185,129)] animate-pulse inline-block" />
                    {t('vendor.claimed', 'Claimed')}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {t('vendor.quantity', 'Quantity')}
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-on-surface">{result.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {t('vendor.total', 'Total')}
                  </span>
                  <span className="text-xl font-semibold tabular-nums text-[rgb(16,185,129)]"
                    style={{ textShadow: '0 0 8px rgba(16,185,129,0.4)' }}>
                    {result.totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform gradient-bg"
              style={{ boxShadow: '0 4px 20px rgba(111,0,190,0.3)' }}
            >
              <span className="material-symbols-outlined">qr_code_scanner</span>
              {t('vendor.scanAnother')}
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 md:pb-8 relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 qr-error-glow"
            style={{ background: 'radial-gradient(circle at center, rgba(147,0,10,0.4) 0%, rgba(12,19,36,1) 70%)' }} />

          <div className="relative z-10 w-full max-w-sm">
            <div
              ref={errorCardRef}
              className="w-full rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
              style={{
                background: 'rgba(147,0,10,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,180,171,0.2)',
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-error-token rounded-t-2xl" />

              {/* Error icon */}
              <div className="w-32 h-32 rounded-full bg-error-container/30 border border-error-token/50 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-2 border-error-token/20 animate-ping opacity-75" />
                <span
                  className="material-symbols-outlined text-[64px] text-error-token"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >cancel</span>
              </div>

              <h1 className="text-2xl font-bold text-error-token mb-3">{t('vendor.invalidQR')}</h1>
              <p className="text-base text-on-error-container/80 mb-8 max-w-[240px]">
                {errorMsg || t('vendor.invalidQRDesc', 'This code has already been scanned or is unrecognized by the system.')}
              </p>

              {/* Manual entry form */}
              {showManual && (
                <div className="w-full mb-4">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitManual()}
                    placeholder={t('vendor.enterQRCode', 'Paste QR code here...')}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-[#8083ff] mb-2"
                    autoFocus
                  />
                  <button
                    onClick={submitManual}
                    disabled={manualLoading || !manualCode.trim()}
                    className="w-full gradient-bg text-white font-bold text-xs tracking-widest uppercase py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    {manualLoading
                      ? <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                      : <span className="material-symbols-outlined text-sm">check_circle</span>}
                    {t('vendor.submit', 'Submit')}
                  </button>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full gradient-bg text-white font-bold text-xs tracking-widest uppercase py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform mb-3"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                {t('vendor.tryAgain')}
              </button>

              {!showManual && (
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full border border-outline-variant text-on-surface font-bold text-xs tracking-widest uppercase py-4 rounded-xl flex items-center justify-center hover:bg-surface-variant/20 active:scale-95 transition-all"
                >
                  {t('vendor.manualEntry', 'Manual Entry')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 h-20 flex justify-around items-center px-4 bg-surface-container/80 backdrop-blur-xl border-t border-outline-variant rounded-t-xl md:hidden">
        <Link
          to="/vendor/scan"
          className="flex flex-col items-center justify-center rounded-full px-5 py-2 active:scale-90 transition-transform min-w-[72px] text-[#0d0096]"
          style={{ background: '#8083ff' }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>filter_center_focus</span>
          <span className="text-xs font-bold mt-1 tracking-widest">{t('nav.scanner', 'Scanner')}</span>
        </Link>
        <Link
          to="/vendor/orders"
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-[#c0c1ff] transition-colors active:scale-90 min-w-[72px]"
        >
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-xs font-bold mt-1">{t('nav.orders', 'Orders')}</span>
        </Link>
        <Link
          to="/vendor"
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-[#c0c1ff] transition-colors active:scale-90 min-w-[72px]"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-xs font-bold mt-1">{t('nav.dashboard', 'Dashboard')}</span>
        </Link>
      </nav>
    </div>
  )
}
