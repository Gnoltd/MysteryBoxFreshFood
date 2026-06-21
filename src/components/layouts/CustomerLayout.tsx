import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { NotificationPanel } from '../shared/NotificationPanel'
import { Bell, Search, ShoppingBag, LogOut } from 'lucide-react'
import { useUnreadCount } from '../../hooks/useUnreadCount'

export function CustomerLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = useUnreadCount(userProfile?.uid)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-outline-variant h-16">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/browse" className="gradient-text font-bold text-headline-md">
            MysteryBox<span className="font-extrabold">FreshFood</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-body-sm">
            <Link to="/browse" className="text-on-surface-variant hover:text-on-surface transition-colors">{t('nav.browse')}</Link>
            <Link to="/subscriptions" className="text-on-surface-variant hover:text-on-surface transition-colors">{t('nav.subscriptions')}</Link>
            <Link to="/orders" className="text-on-surface-variant hover:text-on-surface transition-colors">{t('nav.myOrders')}</Link>
          </nav>

          <div className="flex items-center gap-2 text-on-surface-variant">
            <Link to="/browse" className="p-2 hover:text-on-surface transition-colors" aria-label="Search">
              <Search size={20} />
            </Link>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 hover:text-on-surface transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-token rounded-full" />
              )}
            </button>
            <Link to="/orders" className="p-2 hover:text-on-surface transition-colors md:hidden" aria-label="Orders">
              <ShoppingBag size={20} />
            </Link>
            <LanguageToggle />
            <button onClick={handleSignOut} className="p-2 hover:text-on-surface transition-colors" aria-label="Sign out" title={userProfile?.displayName}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Main Content */}
      <main className="pt-16 max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
