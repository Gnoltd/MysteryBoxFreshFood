import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { NotificationPanel } from '../shared/NotificationPanel'
import { ParticleBackground } from '../shared/ParticleBackground'
import { Bell, LogOut, ShoppingBag, Package, Star, Menu, X } from 'lucide-react'
import { useUnreadCount } from '../../hooks/useUnreadCount'

export function CustomerLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = useUnreadCount(userProfile?.uid)

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const navItems = [
    { to: '/browse', label: t('nav.browse'), icon: Package },
    { to: '/subscriptions', label: t('nav.subscriptions'), icon: Star },
    { to: '/orders', label: t('nav.myOrders'), icon: ShoppingBag },
  ]

  return (
    <div className="min-h-screen bg-background text-on-surface relative">
      <ParticleBackground count={35} />

      {/* Ambient gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-orb-1 z-0" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none animate-orb-2 z-0" />

      {/* Top Nav */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? 'glass-strong shadow-2xl shadow-black/30'
          : 'bg-transparent'
      }`}>
        {/* Top gradient line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/browse" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-lg glow-primary-sm transition-transform group-hover:scale-110">
              <span className="text-white text-xs font-black">MB</span>
            </div>
            <span className="gradient-text font-black text-base tracking-tight hidden sm:block">
              MysteryBox
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 gradient-bg rounded-full opacity-80 shadow-lg" style={{ boxShadow: '0 0 12px rgba(73,75,214,0.4)' }} />
                  )}
                  <Icon size={14} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              )
            })}
            <a
              href="#how-it-works"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
            >
              {t('nav.howItWorks')}
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language toggle — hidden on mobile (shown in mobile menu) */}
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>

            {/* Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative w-9 h-9 rounded-full glass glow-border flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all hover:scale-105"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full notif-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </>
              )}
            </button>

            {/* Avatar */}
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0 transition-all hover:scale-110 glow-primary-sm"
              >
                {initials}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-11 glass-strong glow-border rounded-2xl shadow-2xl py-2 min-w-[180px] z-50 animate-scale-in">
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <p className="text-on-surface text-sm font-semibold truncate">{userProfile?.displayName}</p>
                    <p className="text-outline text-xs truncate mt-0.5">{userProfile?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface-variant hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <LogOut size={14} /> {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden w-9 h-9 rounded-full glass glow-border flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/5 px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'gradient-bg text-white shadow-lg'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
            >
              {t('nav.howItWorks')}
            </a>
            <div className="pt-2 pb-1 border-t border-white/5 flex items-center px-4">
              <LanguageToggle />
            </div>
          </div>
        )}
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-16 max-w-[1280px] mx-auto px-4 sm:px-6 py-6 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
