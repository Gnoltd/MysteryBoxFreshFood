import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Sign in</CardTitle>
        <CardDescription className="text-slate-400">Welcome back</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Password</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="text-slate-400 text-sm text-center mt-4">
          No account? <Link to="/register" className="text-indigo-400 hover:underline">Register</Link>
        </p>
      </CardContent>
    </Card>
  )
}
