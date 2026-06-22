import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { createGoogleUserProfile } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function GoogleSetupPage() {
  const { t } = useTranslation()
  const { currentUser, userProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) navigate('/login', { replace: true })
    else if (userProfile) navigate('/', { replace: true })
  }, [currentUser, userProfile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setError('')
    setLoading(true)
    try {
      await createGoogleUserProfile(
        currentUser.uid,
        currentUser.displayName ?? '',
        currentUser.email ?? '',
        role,
        role === 'vendor' ? { storeName } : {}
      )
      await refreshProfile()
      navigate(role === 'vendor' ? '/vendor' : '/browse', { replace: true })
    } catch {
      setError(t('auth.setupError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">{t('auth.setupTitle')}</CardTitle>
        <CardDescription className="text-slate-400">{t('auth.setupDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['customer', 'vendor'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  role === r
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <img src={r === 'customer' ? '/images/icons/customer.png' : '/images/icons/vendor.png'} alt="" className="w-4 h-4 object-contain" />
                  {r === 'customer' ? t('auth.customer') : t('auth.vendor')}
                </span>
              </button>
            ))}
          </div>
          {role === 'vendor' && (
            <div className="space-y-1">
              <Label className="text-slate-300">{t('auth.storeName')}</Label>
              <Input
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={loading || (role === 'vendor' && !storeName.trim())}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? t('auth.setupLoading') : t('auth.setupSubmit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
