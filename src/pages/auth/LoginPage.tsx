import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signIn, signInWithGoogle } from '../../services/auth'
import { savePushToken } from '../../services/pushNotifications'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const inputClass =
    'w-full bg-[#020617] border border-[#1e293b] rounded h-12 px-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

  return (
    <div className="w-full max-w-[448px]">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">MysteryBox Fresh Food</h1>
        <p className="text-on-surface-variant text-body-sm mt-1">F&amp;B Surplus Marketplace</p>
      </div>

      {/* Card */}
      <div className="relative bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden gradient-border-top">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative z-10 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-error-token text-body-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="gradient-bg text-white rounded-lg h-12 w-full font-semibold text-body-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e293b]" />
            <span className="text-label-caps text-outline uppercase tracking-wider">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-[#1e293b]" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="bg-transparent border border-[#1e293b] hover:bg-surface-variant/50 rounded-lg h-12 w-full flex items-center justify-center gap-3 text-on-surface font-semibold transition-colors disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? '…' : t('auth.continueWithGoogle')}
          </button>

          <p className="text-center text-on-surface-variant text-body-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              {t('auth.register')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
