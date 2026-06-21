import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signUp } from '../../services/auth'
import { GradientButton } from '../../components/shared/GradientButton'

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

  const inputClass = 'bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors'

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">
          MysteryBox<span className="font-extrabold">FreshFood</span>
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-2">{t('auth.joinMysteryBox')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.displayName')}</label>
          <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.email')}</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.password')}</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
        </div>

        {/* Role toggle */}
        <div className="flex gap-3">
          {(['customer', 'vendor'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-body-sm transition-colors ${role === r ? 'gradient-bg text-white border-transparent' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
            >
              {t(`auth.${r}`)}
            </button>
          ))}
        </div>

        {role === 'vendor' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.storeName')}</label>
            <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClass} />
          </div>
        )}

        {error && <p className="text-error-token text-body-sm">{error}</p>}

        <GradientButton type="submit" disabled={loading} className="w-full mt-2">
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </GradientButton>

        <p className="text-center text-on-surface-variant text-body-sm">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">{t('auth.signIn')}</Link>
        </p>
      </form>
    </div>
  )
}
