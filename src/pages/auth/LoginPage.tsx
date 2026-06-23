import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { signIn, signInWithGoogle } from '../../services/auth'
import { savePushToken } from '../../services/pushNotifications'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/browse')
      savePushToken().catch(() => {})
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      navigate('/browse')
      savePushToken().catch(() => {})
    } catch {
      setError(t('auth.googleError'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const inputCls = 'w-full bg-surface-container-high/40 border border-white/10 rounded-xl h-12 text-base text-on-surface placeholder:text-outline/60 focus:outline-none input-glow transition-all'

  return (
    <div className="w-full max-w-[420px] animate-fade-in-up">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl glow-primary animate-float">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="gradient-text font-black text-3xl tracking-tight">MysteryBox</h1>
        <p className="text-on-surface-variant text-sm mt-1.5">Fresh Food Surplus Marketplace</p>
      </div>

      {/* Card */}
      <div className="relative glass-strong glow-border rounded-3xl overflow-hidden">
        {/* Gradient top border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-orb-1" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none animate-orb-2" />

        <form onSubmit={handleSubmit} className="relative z-10 p-7 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{t('auth.signIn')}</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">Welcome back! Enter your credentials.</p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${inputCls} pl-10 pr-4`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <span className="text-primary text-xs cursor-pointer hover:text-primary/80 transition-colors">{t('auth.forgot')}</span>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputCls} pl-10 pr-12`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-scale-in">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="gradient-bg-animated text-white rounded-xl h-12 w-full font-bold text-base shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('auth.signingIn')}
              </span>
            ) : t('auth.signIn')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-xs text-outline uppercase tracking-widest">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl h-12 w-full flex items-center justify-center gap-3 text-on-surface font-semibold text-sm transition-all disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? '…' : t('auth.continueWithGoogle')}
          </button>

          <p className="text-center text-on-surface-variant text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">
              {t('auth.register')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
