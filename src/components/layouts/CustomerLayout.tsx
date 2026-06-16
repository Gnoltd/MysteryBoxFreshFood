import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'

export function CustomerLayout() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/browse" className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            MysteryBox
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/browse" className="text-slate-300 hover:text-white">Browse</Link>
            <Link to="/orders" className="text-slate-300 hover:text-white">My Orders</Link>
            <LanguageToggle />
            <span className="text-slate-500 text-xs">{userProfile?.displayName}</span>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-white text-xs">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
