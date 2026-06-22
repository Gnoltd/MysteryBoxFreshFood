import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Mail, Lock, Store } from 'lucide-react'
import { signUp } from '../../services/auth'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, displayName, role, role === 'vendor' ? { storeName } : undefined)
      navigate(role === 'vendor' ? '/vendor' : '/browse')
    } catch {
      setError(t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative">
      {/* Background blobs */}
      <div className="blob w-64 h-64 bg-inverse-primary/20 -top-16 -right-16" />
      <div className="blob w-48 h-48 bg-secondary-container/20 -bottom-8 -left-12" />

      {/* Brand */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">MysteryBox Fresh Food</h1>
        <p className="text-on-surface-variant text-body-sm mt-1">F&amp;B Surplus Marketplace</p>
      </div>

      {/* Card */}
      <div className="relative z-10 bg-surface-container/60 backdrop-blur-xl border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
        {/* Top gradient accent line */}
        <div className="h-[1px] w-full gradient-bg" />

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Icon + heading */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-surface-variant border border-outline-variant rounded-lg flex items-center justify-center text-2xl">
              🍱
            </div>
            <div>
              <h2 className="text-headline-md font-bold text-on-surface">{t('auth.createAccount')}</h2>
              <p className="text-body-sm text-on-surface-variant">{t('auth.joinMysteryBox')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t('auth.displayName')}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Role toggle */}
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-1 flex gap-1">
            {(['customer', 'vendor'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-body-sm font-semibold transition-colors ${
                  role === r
                    ? 'bg-surface-variant text-on-surface border border-outline'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t(`auth.${r}`)}
              </button>
            ))}
          </div>

          {role === 'vendor' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
                {t('auth.storeName')}
              </label>
              <div className="relative">
                <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          )}

          {error && <p className="text-error-token text-body-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="gradient-bg text-white rounded-lg h-12 w-full font-semibold text-body-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </button>

          <p className="text-center text-on-surface-variant text-body-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              {t('auth.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
