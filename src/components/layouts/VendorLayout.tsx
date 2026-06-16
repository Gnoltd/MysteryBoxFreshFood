import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { LayoutDashboard, Package, ShoppingBag, QrCode, LogOut } from 'lucide-react'

export function VendorLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { to: '/vendor', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/vendor/listings', label: t('nav.listings'), icon: Package, exact: false },
    { to: '/vendor/orders', label: t('nav.orders'), icon: ShoppingBag, exact: false },
    { to: '/vendor/scan', label: t('nav.scanQR'), icon: QrCode, exact: false },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col py-6 px-3">
        <div className="px-3 mb-8">
          <p className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MysteryBox</p>
          <p className="text-xs text-slate-500 mt-0.5">{userProfile?.storeName ?? userProfile?.displayName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 space-y-2">
          <LanguageToggle />
          <button onClick={handleSignOut} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-slate-800">
            <LogOut size={16} /> {t('nav.signOut')}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
