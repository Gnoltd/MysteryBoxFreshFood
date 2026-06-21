import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signIn } from '../../services/auth'
import { savePushToken } from '../../services/pushNotifications'
import { GradientButton } from '../../components/shared/GradientButton'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">
          MysteryBox<span className="font-extrabold">FreshFood</span>
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-2">{t('auth.welcomeBack')}</p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.password')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-error-token text-body-sm">{error}</p>}

        <GradientButton type="submit" disabled={loading} className="w-full mt-2">
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </GradientButton>

        <p className="text-center text-on-surface-variant text-body-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary hover:underline">{t('auth.register')}</Link>
        </p>
      </form>
    </div>
  )
}
