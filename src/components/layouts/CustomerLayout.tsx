import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { NotificationPanel } from '../shared/NotificationPanel'
import { Bell, LogOut } from 'lucide-react'
import { useUnreadCount } from '../../hooks/useUnreadCount'

export function CustomerLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = useUnreadCount(userProfile?.uid)

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`pb-0.5 transition-colors text-body-sm ${
        location.pathname === to
          ? 'text-primary font-bold border-b-2 border-primary'
          : 'text-on-surface-variant hover:text-primary'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant h-16">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/browse" className="gradient-text font-bold text-headline-md shrink-0">
            MysteryBox Fresh Food
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLink('/browse', t('nav.browse'))}
            {navLink('/subscriptions', t('nav.subscriptions'))}
            {navLink('/orders', t('nav.myOrders'))}
            <a
              href="#how-it-works"
              className="pb-0.5 transition-colors text-body-sm text-on-surface-variant hover:text-primary"
            >
              {t('nav.howItWorks')}
            </a>
          </nav>

          <div className="flex items-center gap-3 text-on-surface-variant">
            <LanguageToggle />
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 hover:text-on-surface transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-token rounded-full" />
              )}
            </button>
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0"
              >
                {initials}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 bg-surface-container border border-outline-variant rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                  <div className="px-3 py-2 border-b border-outline-variant">
                    <p className="text-on-surface text-body-sm font-semibold truncate">{userProfile?.displayName}</p>
                    <p className="text-outline text-xs truncate">{userProfile?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <LogOut size={14} /> {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-16 max-w-[1280px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
