import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { LayoutDashboard, Package, ShoppingBag, QrCode, LogOut, Archive, Wand2 } from 'lucide-react'

export function VendorLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { to: '/vendor',           label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/vendor/listings',  label: t('nav.listings'),  icon: Package,         exact: false },
    { to: '/vendor/orders',    label: t('nav.orders'),    icon: ShoppingBag,     exact: false },
    { to: '/vendor/scan',      label: t('nav.scanQR'),    icon: QrCode,          exact: false },
    { to: '/vendor/inventory', label: t('nav.inventory'), icon: Archive,         exact: false },
    { to: '/vendor/compose',   label: t('nav.compose'),   icon: Wand2,           exact: false },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-container border-r border-outline-variant flex flex-col py-6 px-3 fixed h-full">
        <div className="px-3 mb-8">
          <p className="gradient-text font-bold text-headline-md">MysteryBox</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{userProfile?.storeName ?? userProfile?.displayName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm transition-colors ${active ? 'gradient-bg text-white' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 space-y-2">
          <LanguageToggle />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-body-sm w-full px-3 py-2 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <LogOut size={16} /> {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
