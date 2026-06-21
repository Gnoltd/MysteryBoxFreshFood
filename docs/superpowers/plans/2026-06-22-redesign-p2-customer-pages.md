# MysteryBoxFreshFood — Redesign Part 2: Customer Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Part 1 (design-system plan) must be complete — GradientButton, GhostButton, MysteryCard, GlassNav, StatusChip, StockBadge, TimerBadge must exist.

**Goal:** Redesign all customer-facing pages with the new dark design system, add real-time stock via onSnapshot on BrowsePage, and add live order status tracker on Success/OrderDetail pages.

**Architecture:** Layouts updated first (CustomerLayout gets GlassNav + notification bell), then pages redesigned one by one consuming shared components. onSnapshot for stock is managed at BrowsePage level and passed as props to MysteryCard.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Firebase Firestore onSnapshot, react-i18next, React Router v6

## Global Constraints

- App name: **MysteryBoxFreshFood** — never "SAVOR"
- All text via `t('key')` — no hardcoded strings in components
- No Firebase SDK imports in components — only via `src/services/`
- Live stock: `BrowsePage` holds the `onSnapshot` subscription; passes `quantityRemaining` as prop
- Order live tracker: `onSnapshot` in `OrderDetailPage` and `CheckoutSuccessPage` only

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/components/layouts/AuthLayout.tsx` |
| Modify | `src/components/layouts/CustomerLayout.tsx` |
| Modify | `src/components/layouts/VendorLayout.tsx` |
| Modify | `src/pages/auth/LoginPage.tsx` |
| Modify | `src/pages/auth/RegisterPage.tsx` |
| Modify | `src/pages/customer/BrowsePage.tsx` |
| Modify | `src/pages/customer/ListingDetailPage.tsx` |
| Modify | `src/pages/customer/CheckoutSuccessPage.tsx` |
| Modify | `src/pages/customer/CheckoutCancelPage.tsx` |
| Modify | `src/pages/customer/OrdersPage.tsx` |
| Modify | `src/pages/customer/OrderDetailPage.tsx` |

---

### Task 5: Auth Layout + Login + Register Pages

**Files:**
- Modify: `src/components/layouts/AuthLayout.tsx`
- Modify: `src/pages/auth/LoginPage.tsx`
- Modify: `src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Update `src/components/layouts/AuthLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/pages/auth/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signIn } from '../../services/auth'
import { GradientButton } from '../../components/shared/GradientButton'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/browse')
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">
          MysteryBox<span className="font-extrabold">FreshFood</span>
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-2">{t('auth.welcomeBack')}</p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.password')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-error-token text-body-sm">{error}</p>}

        <GradientButton type="submit" disabled={loading} className="w-full mt-2">
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </GradientButton>

        <p className="text-center text-on-surface-variant text-body-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary hover:underline">{t('auth.register')}</Link>
        </p>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `src/pages/auth/RegisterPage.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register } from '../../services/auth'
import { GradientButton } from '../../components/shared/GradientButton'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ email, password, displayName, role, storeName: role === 'vendor' ? storeName : undefined })
      navigate(role === 'vendor' ? '/vendor' : '/browse')
    } catch {
      setError(t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors'

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="gradient-text font-bold text-headline-lg-mobile">
          MysteryBox<span className="font-extrabold">FreshFood</span>
        </h1>
        <p className="text-on-surface-variant text-body-sm mt-2">{t('auth.joinMysteryBox')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.displayName')}</label>
          <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.email')}</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.password')}</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
        </div>

        {/* Role toggle */}
        <div className="flex gap-3">
          {(['customer', 'vendor'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-body-sm transition-colors ${role === r ? 'gradient-bg text-white border-transparent' : 'border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
            >
              {t(`auth.${r}`)}
            </button>
          ))}
        </div>

        {role === 'vendor' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('auth.storeName')}</label>
            <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClass} />
          </div>
        )}

        {error && <p className="text-error-token text-body-sm">{error}</p>}

        <GradientButton type="submit" disabled={loading} className="w-full mt-2">
          {loading ? t('auth.creating') : t('auth.createAccount')}
        </GradientButton>

        <p className="text-center text-on-surface-variant text-body-sm">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">{t('auth.signIn')}</Link>
        </p>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/AuthLayout.tsx src/pages/auth/LoginPage.tsx src/pages/auth/RegisterPage.tsx
git commit -m "feat: redesign auth pages with new dark design tokens"
```

---

### Task 6: Customer + Vendor Layouts

**Files:**
- Modify: `src/components/layouts/CustomerLayout.tsx`
- Modify: `src/components/layouts/VendorLayout.tsx`

- [ ] **Step 1: Rewrite `src/components/layouts/CustomerLayout.tsx`**

```tsx
import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { NotificationPanel } from '../shared/NotificationPanel'
import { Bell, Search, ShoppingBag, LogOut, User } from 'lucide-react'
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
```

- [ ] **Step 2: Create `src/hooks/useUnreadCount.ts`**

```ts
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useUnreadCount(uid: string | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'notifications', uid, 'items'),
      where('read', '==', false)
    )
    const unsub = onSnapshot(q, snap => setCount(snap.size), () => setCount(0))
    return unsub
  }, [uid])

  return count
}
```

- [ ] **Step 3: Rewrite `src/components/layouts/VendorLayout.tsx`**

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/CustomerLayout.tsx src/components/layouts/VendorLayout.tsx src/hooks/useUnreadCount.ts
git commit -m "feat: update layouts with GlassNav, notification bell, new dark tokens"
```

---

### Task 7: BrowsePage Redesign (real-time stock)

**Files:**
- Modify: `src/pages/customer/BrowsePage.tsx`

**Key behaviour:** `subscribeToActiveListings` (already uses `onSnapshot`) feeds listings. `MysteryCard` receives `listing` and passes `quantityRemaining` — no per-card subscription.

- [ ] **Step 1: Rewrite `src/pages/customer/BrowsePage.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToActiveListings } from '../../services/listings'
import { MysteryCard } from '../../components/shared/MysteryCard'
import type { Listing, ListingCategory } from '../../types'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'bakery',     label: '🥐 Bakery' },
  { value: 'fruit',      label: '🍎 Fruit' },
  { value: 'vegetables', label: '🥦 Vegetables' },
  { value: 'dairy',      label: '🧀 Dairy' },
  { value: 'meat',       label: '🥩 Meat' },
  { value: 'rice',       label: '🍚 Rice' },
  { value: 'noodles',    label: '🍜 Noodles' },
  { value: 'drinks',     label: '🧃 Drinks' },
  { value: 'snacks',     label: '🍿 Snacks' },
  { value: 'other',      label: '📦 Other' },
]

export default function BrowsePage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(
    () => category === 'all' ? listings : listings.filter(l => l.category === category),
    [listings, category]
  )

  return (
    <div>
      {/* Hero greeting */}
      <div className="mb-6">
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">
          {t('browse.greeting', { name: userProfile?.displayName?.split(' ')[0] ?? '' })}
        </h1>
        <p className="text-on-surface-variant text-body-lg mt-1">{t('browse.subtitle')}</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-body-sm font-semibold border transition-colors ${
              category === cat.value
                ? 'gradient-bg text-white border-transparent'
                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-body-lg">{t('browse.noListings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <MysteryCard
              key={listing.id}
              listing={listing}
              onClick={() => navigate(`/listing/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add missing i18n keys to `src/locales/en/translation.json`**

Under `"browse"`:
```json
"greeting": "Hey, {{name}} 👋",
"subtitle": "What's fresh tonight?",
```

Under `"browse"` in `src/locales/vi/translation.json`:
```json
"greeting": "Xin chào, {{name}} 👋",
"subtitle": "Hôm nay có gì mới?",
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/customer/BrowsePage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign BrowsePage with MysteryCard, category chips, real-time stock"
```

---

### Task 8: ListingDetailPage Redesign

**Files:**
- Modify: `src/pages/customer/ListingDetailPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/customer/ListingDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { createCheckoutSession } from '../../services/stripe'
import { GradientButton } from '../../components/shared/GradientButton'
import { GlassNav } from '../../components/shared/GlassNav'
import { StatusChip } from '../../components/shared/StatusChip'
import { StockBadge } from '../../components/shared/StockBadge'
import { TimerBadge } from '../../components/shared/TimerBadge'
import type { Listing } from '../../types'
import { Share2, Heart } from 'lucide-react'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'listings', id), snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() } as Listing)
    })
    return unsub
  }, [id])

  const handleClaim = async () => {
    if (!listing) return
    setLoading(true)
    try {
      const url = await createCheckoutSession(listing.id)
      window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts: { seconds: number }) =>
    new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (!listing) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full gradient-bg animate-pulse" />
    </div>
  )

  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const soldOut = listing.status === 'sold_out' || listing.quantityRemaining === 0

  return (
    <div className="min-h-screen bg-background pb-32">
      <GlassNav
        backHref="/browse"
        backLabel={t('nav.browse')}
        actions={
          <>
            <button className="p-2 hover:text-on-surface transition-colors"><Share2 size={20} /></button>
            <button className="p-2 hover:text-on-surface transition-colors"><Heart size={20} /></button>
          </>
        }
      />

      <div className="pt-16 max-w-5xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="relative h-64 md:h-[480px] rounded-xl overflow-hidden border border-outline-variant">
            {listing.imageUrl
              ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-surface-container flex items-center justify-center text-6xl">🎁</div>}
            <span className="absolute top-4 left-4 bg-tertiary-container/20 backdrop-blur-sm border border-tertiary/50 text-tertiary text-label-caps font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">{listing.title}</h1>
              <p className="text-on-surface-variant text-body-lg mt-2">{listing.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-primary font-bold text-headline-md">{listing.price.toLocaleString('vi-VN')} đ</span>
              <span className="text-outline text-body-lg line-through mb-0.5">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>

            {/* Timer banner */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <TimerBadge pickupEnd={listing.pickupEnd} />
              </div>
              {listing.packedAt && (
                <span className="text-on-surface-variant text-xs">
                  {t('listing.packedAt')} {formatTime(listing.packedAt)}
                </span>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('listing.remaining'), value: <StockBadge quantity={listing.quantityRemaining} /> },
                { label: t('listing.pickup'),    value: `${formatTime(listing.pickupStart)} – ${formatTime(listing.pickupEnd)}` },
                { label: t('listing.category'),  value: <StatusChip variant="slate">{listing.category}</StatusChip> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container border border-outline-variant rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
                  <span className="text-mono-stat font-semibold text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <GradientButton
            onClick={handleClaim}
            disabled={soldOut || loading}
            className="w-full"
          >
            {soldOut ? t('listing.soldOut') : loading ? t('listing.claiming') : `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`}
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add missing i18n keys**

In `src/locales/en/translation.json` under `"listing"`:
```json
"packedAt": "Packed at",
"claiming": "Redirecting…"
```

In `src/locales/vi/translation.json` under `"listing"`:
```json
"packedAt": "Đóng gói lúc",
"claiming": "Đang chuyển hướng…"
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/customer/ListingDetailPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign ListingDetailPage — 2-col layout, live stock, timer banner, sticky CTA"
```

---

### Task 9: Order Pages Redesign + Live Tracker

**Files:**
- Modify: `src/pages/customer/CheckoutSuccessPage.tsx`
- Modify: `src/pages/customer/CheckoutCancelPage.tsx`
- Modify: `src/pages/customer/OrdersPage.tsx`
- Modify: `src/pages/customer/OrderDetailPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/customer/CheckoutSuccessPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../contexts/AuthContext'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'
import { CheckCircle } from 'lucide-react'

const STATUS_STEPS = ['paid', 'picked_up'] as const
const STEP_LABELS: Record<string, string> = { paid: 'order.statusPaid', picked_up: 'order.statusPickedUp' }

export default function CheckoutSuccessPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!userProfile || !sessionId) return
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', userProfile.uid),
      where('stripeSessionId', '==', sessionId),
      limit(1)
    )
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order)
    })
    return unsub
  }, [userProfile, sessionId])

  return (
    <div className="max-w-md mx-auto py-12 flex flex-col items-center gap-8 text-center">
      <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center">
        <CheckCircle size={40} className="text-white" />
      </div>

      <div>
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.confirmed')}</h1>
        <p className="text-on-surface-variant text-body-lg mt-2">{t('order.showQR')}</p>
      </div>

      {order ? (
        <>
          <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
            <QRCodeSVG value={order.qrCode} size={200} bgColor="transparent" fgColor="#dce1fb" />
          </div>

          {/* Live status tracker */}
          <div className="w-full flex items-center gap-2">
            {STATUS_STEPS.map((step, i) => {
              const done = order.status === step || (step === 'paid' && order.status === 'picked_up')
              const active = order.status === step
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full transition-all ${done ? 'gradient-bg' : 'bg-outline-variant'} ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} />
                  <span className="text-xs text-on-surface-variant">{t(STEP_LABELS[step])}</span>
                  {i < STATUS_STEPS.length - 1 && <div className={`absolute h-0.5 w-full ${done ? 'gradient-bg' : 'bg-outline-variant'}`} />}
                </div>
              )
            })}
          </div>

          <StatusChip variant={order.status === 'picked_up' ? 'emerald' : 'primary'}>
            {t(`order.status_${order.status}`)}
          </StatusChip>
        </>
      ) : (
        <div className="w-48 h-48 bg-surface-container rounded-xl animate-pulse" />
      )}

      <Link to="/orders"><GhostButton>{t('order.viewAll')}</GhostButton></Link>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/pages/customer/CheckoutCancelPage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GradientButton } from '../../components/shared/GradientButton'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-error-container/20 border border-error-token/30 flex items-center justify-center">
        <XCircle size={40} className="text-error-token" />
      </div>
      <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.cancelled')}</h1>
      <p className="text-on-surface-variant text-body-lg">{t('order.cancelledMsg')}</p>
      <Link to="/browse"><GradientButton>{t('browse.title')}</GradientButton></Link>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `src/pages/customer/OrdersPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getCustomerOrders } from '../../services/orders'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const statusVariant = (s: string) => {
  if (s === 'paid') return 'primary'
  if (s === 'picked_up') return 'emerald'
  if (s === 'refunded' || s === 'cancelled') return 'rose'
  return 'slate'
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile) return
    getCustomerOrders(userProfile.uid).then(data => { setOrders(data); setLoading(false) })
  }, [userProfile])

  if (loading) return <div className="py-20 text-center text-on-surface-variant">{t('browse.loading')}</div>

  return (
    <div>
      <h1 className="text-headline-md font-bold text-on-surface mb-6">{t('nav.myOrders')}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-body-lg">{t('order.noOrders')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-xl shrink-0">🎁</div>
              <div className="flex-1 min-w-0">
                <p className="text-on-surface font-semibold text-body-sm truncate">{order.listingTitle}</p>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-primary font-bold text-body-sm">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                <StatusChip variant={statusVariant(order.status) as 'primary'|'emerald'|'rose'|'slate'}>
                  {t(`order.status_${order.status}`)}
                </StatusChip>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `src/pages/customer/OrderDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { GlassNav } from '../../components/shared/GlassNav'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const STATUS_STEPS: Array<{ key: string; labelKey: string }> = [
  { key: 'paid',      labelKey: 'order.statusPaid' },
  { key: 'picked_up', labelKey: 'order.statusPickedUp' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'orders', id), snap => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order)
    })
    return unsub
  }, [id])

  if (!order) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full gradient-bg animate-pulse" />
    </div>
  )

  const statusVariant = order.status === 'picked_up' ? 'emerald' : order.status === 'paid' ? 'primary' : 'rose'

  return (
    <div className="min-h-screen bg-background pb-8">
      <GlassNav backHref="/orders" backLabel={t('nav.myOrders')} />
      <div className="pt-20 max-w-md mx-auto px-6 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
            <QRCodeSVG value={order.qrCode} size={200} bgColor="transparent" fgColor="#dce1fb" />
          </div>
          <StatusChip variant={statusVariant}>{t(`order.status_${order.status}`)}</StatusChip>
        </div>

        {/* Live status bar */}
        <div className="flex items-center gap-3">
          {STATUS_STEPS.map((step, i) => {
            const done = order.status === 'picked_up' || step.key === 'paid'
            const active = order.status === step.key
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${done ? 'gradient-bg' : 'bg-outline-variant'} ${active ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`} />
                <span className="text-xs text-on-surface-variant text-center">{t(step.labelKey)}</span>
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
          {[
            { label: t('order.box'),     value: order.listingTitle },
            { label: t('order.amount'),  value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
            { label: t('order.orderId'), value: order.id.slice(0, 8).toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-on-surface-variant text-body-sm">{label}</span>
              <span className="text-on-surface text-body-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add i18n keys to both locale files**

In `src/locales/en/translation.json` under `"order"`:
```json
"confirmed": "Order Confirmed!",
"showQR": "Show this QR code to the vendor at pickup.",
"statusPaid": "Paid",
"statusPickedUp": "Picked Up",
"status_paid": "Paid",
"status_picked_up": "Picked Up",
"status_pending": "Pending",
"status_cancelled": "Cancelled",
"status_refunded": "Refunded",
"status_pending_cod": "COD Pending",
"status_pending_bank_transfer": "Transfer Pending",
"viewAll": "View All Orders",
"cancelled": "Payment Cancelled",
"cancelledMsg": "Your box is still available — go back and try again.",
"noOrders": "No orders yet — start browsing!",
"box": "Box",
"amount": "Amount",
"orderId": "Order ID"
```

In `src/locales/vi/translation.json`, mirror with Vietnamese translations.

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/CheckoutSuccessPage.tsx src/pages/customer/CheckoutCancelPage.tsx src/pages/customer/OrdersPage.tsx src/pages/customer/OrderDetailPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign order pages with live status tracker and new dark theme"
```
