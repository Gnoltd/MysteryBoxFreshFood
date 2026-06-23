import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { LayoutDashboard, Package, ShoppingBag, QrCode, LogOut, Archive, Wand2, ChevronLeft, ChevronRight } from 'lucide-react'

export function VendorLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

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

  const sidebarW = collapsed ? 'w-16' : 'w-60'

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar */}
      <aside className={`${sidebarW} glass-strong border-r border-white/5 flex flex-col py-5 fixed h-full z-40 transition-all duration-300 ease-in-out`}>
        {/* Logo */}
        <div className={`px-3 mb-7 overflow-hidden transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
          {collapsed ? (
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center glow-primary-sm mx-auto">
              <span className="text-white text-xs font-black">MB</span>
            </div>
          ) : (
            <div>
              <p className="gradient-text font-black text-base tracking-tight">MysteryBox</p>
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">{userProfile?.storeName ?? userProfile?.displayName}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'sidebar-active-glow text-white'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 bg-white/60 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 space-y-1 mt-4">
          {!collapsed && <LanguageToggle />}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-on-surface-variant hover:text-red-400 hover:bg-red-500/5 text-sm w-full px-3 py-2.5 rounded-xl transition-all"
            title={collapsed ? t('nav.signOut') : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>{t('nav.signOut')}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface text-sm w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 mt-2 border-t border-white/5 pt-3"
          >
            {collapsed ? <ChevronRight size={16} className="mx-auto" /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${collapsed ? 'ml-16' : 'ml-60'} transition-all duration-300 p-6 sm:p-8 overflow-auto min-h-screen`}>
        {/* Ambient orbs */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[120px] pointer-events-none animate-orb-1 z-0" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
