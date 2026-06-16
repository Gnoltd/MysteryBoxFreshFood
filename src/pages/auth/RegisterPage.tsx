import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, displayName, role, role === 'vendor' ? { storeName } : {})
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Create account</CardTitle>
        <CardDescription className="text-slate-400">Join MysteryBox</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['customer', 'vendor'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${role === r ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                {r === 'customer' ? '🛒 Customer' : '🏪 Vendor'}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Display name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {role === 'vendor' && (
            <div className="space-y-1">
              <Label className="text-slate-300">Store name</Label>
              <Input value={storeName} onChange={e => setStoreName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Password</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          Have an account? <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
