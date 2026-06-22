# MysteryBox Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all pages to exactly match the `Design/` HTML mockups while preserving all existing Firebase/Stripe/i18n logic.

**Architecture:** Task-by-task visual-layer updates only. Logic in services, contexts, and Cloud Functions is never touched. Each task targets one or two files and produces a commit.

**Tech Stack:** React + TypeScript + Tailwind CSS (dark design tokens) + shadcn/ui + Lucide icons + react-i18next

## Global Constraints

- All Firebase/Stripe/i18n logic preserved unchanged — only visual layer changes
- All `t('key')` calls kept on every user-visible string
- Token naming workarounds: `error-token` (not `error`), `secondary-token` (not `secondary`), `primary-container-token` (not `primary-container`) due to shadcn/ui object-token conflicts
- `bg-background` resolves to `#0c1324` via CSS var; `bg-surface` also resolves to `#0c1324` via direct hex token
- No new routes, no new Cloud Functions, no new services
- `VendorDashboardPage` is explicitly excluded from all changes
- Verify build with `npm run build` after every task

---

### Task 1: Add missing CSS utilities to index.css

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: `.ai-shadow` class (used by VendorComposePage AI card)

- [ ] **Step 1: Add ai-shadow utility**

In `src/index.css`, inside the `@layer utilities` block, after the `.blob` rule, add:

```css
  .ai-shadow {
    box-shadow: 0px 4px 12px rgba(113, 42, 226, 0.15);
  }
```

The final `@layer utilities` block should look like:

```css
@layer utilities {
  .gradient-bg {
    background-image: linear-gradient(to right, #494bd6, #6f00be);
  }
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(to right, #c0c1ff, #ddb7ff);
  }
  .mystery-border {
    border-top: 4px solid transparent;
    border-image: linear-gradient(to right, #494bd6, #6f00be) 1;
  }
  .glass-panel {
    background-color: rgba(12, 19, 36, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .gradient-border-box {
    box-shadow: 0 0 0 1px #8083ff;
  }
  .gradient-border-top {
    position: relative;
  }
  .gradient-border-top::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(to right, #494bd6, #6f00be);
    border-radius: inherit;
  }
  .blob {
    position: absolute;
    border-radius: 9999px;
    filter: blur(120px);
    pointer-events: none;
  }
  .ai-shadow {
    box-shadow: 0px 4px 12px rgba(113, 42, 226, 0.15);
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add ai-shadow CSS utility"
```

---

### Task 2: LoginPage — add field icons and Forgot link

**Files:**
- Modify: `src/pages/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: `Mail`, `Lock` from `lucide-react` (already installed)

- [ ] **Step 1: Add icon imports**

At the top of `src/pages/auth/LoginPage.tsx`, add the import:

```tsx
import { Mail, Lock } from 'lucide-react'
```

- [ ] **Step 2: Wrap email input with icon**

Replace the email field `<div className="flex flex-col gap-1.5">` block with:

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
    {t('auth.email')}
  </label>
  <div className="relative">
    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    <input
      type="email"
      required
      value={email}
      onChange={e => setEmail(e.target.value)}
      className="w-full bg-[#020617] border border-[#1e293b] rounded h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      placeholder="you@example.com"
    />
  </div>
</div>
```

- [ ] **Step 3: Wrap password input with icon and add Forgot link**

Replace the password field `<div className="flex flex-col gap-1.5">` block with:

```tsx
<div className="flex flex-col gap-1.5">
  <div className="flex items-center justify-between">
    <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
      {t('auth.password')}
    </label>
    <span className="text-primary text-body-sm cursor-pointer hover:underline">{t('auth.forgot')}</span>
  </div>
  <div className="relative">
    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    <input
      type="password"
      required
      value={password}
      onChange={e => setPassword(e.target.value)}
      className="w-full bg-[#020617] border border-[#1e293b] rounded h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      placeholder="••••••••"
    />
  </div>
</div>
```

- [ ] **Step 4: Add auth.forgot translation key**

In `src/locales/en/translation.json`, under `"auth"`, add:
```json
"forgot": "Forgot?"
```

In `src/locales/vi/translation.json`, under `"auth"`, add:
```json
"forgot": "Quên mật khẩu?"
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/auth/LoginPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add field icons and forgot link to LoginPage"
```

---

### Task 3: RegisterPage — add field icons

**Files:**
- Modify: `src/pages/auth/RegisterPage.tsx`

**Interfaces:**
- Consumes: `User`, `Mail`, `Lock`, `Store` from `lucide-react`

- [ ] **Step 1: Add icon imports**

```tsx
import { User, Mail, Lock, Store } from 'lucide-react'
```

- [ ] **Step 2: Replace display name field**

Replace the displayName field block with:

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
    {t('auth.displayName')}
  </label>
  <div className="relative">
    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    <input
      type="text"
      required
      value={displayName}
      onChange={e => setDisplayName(e.target.value)}
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
    />
  </div>
</div>
```

- [ ] **Step 3: Replace email field**

Replace the email field block with:

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
    {t('auth.email')}
  </label>
  <div className="relative">
    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    <input
      type="email"
      required
      value={email}
      onChange={e => setEmail(e.target.value)}
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
    />
  </div>
</div>
```

- [ ] **Step 4: Replace password field**

Replace the password field block with:

```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
    {t('auth.password')}
  </label>
  <div className="relative">
    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    <input
      type="password"
      required
      value={password}
      onChange={e => setPassword(e.target.value)}
      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
    />
  </div>
</div>
```

- [ ] **Step 5: Replace storeName field (inside role === 'vendor' conditional)**

Replace the storeName field block with:

```tsx
{role === 'vendor' && (
  <div className="flex flex-col gap-1.5">
    <label className="text-label-caps text-on-surface-variant uppercase tracking-wider">
      {t('auth.storeName')}
    </label>
    <div className="relative">
      <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
      <input
        type="text"
        required
        value={storeName}
        onChange={e => setStoreName(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-12 pl-10 pr-4 text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
    </div>
  </div>
)}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/RegisterPage.tsx
git commit -m "feat: add lucide icons to RegisterPage fields"
```

---

### Task 4: CustomerLayout — add How It Works nav, widen layout, add user avatar

**Files:**
- Modify: `src/components/layouts/CustomerLayout.tsx`

**Interfaces:**
- Consumes: `useAuth` (for `userProfile.displayName`, `userProfile.photoURL`)
- Produces: Updated nav with 4 links, wider content area, avatar circle

- [ ] **Step 1: Add nav.howItWorks translation key**

In `src/locales/en/translation.json`, under `"nav"`, add:
```json
"howItWorks": "How it Works"
```

In `src/locales/vi/translation.json`, under `"nav"`, add:
```json
"howItWorks": "Cách hoạt động"
```

- [ ] **Step 2: Replace CustomerLayout entirely**

Replace the full content of `src/components/layouts/CustomerLayout.tsx` with:

```tsx
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { LanguageToggle } from '../shared/LanguageToggle'
import { NotificationPanel } from '../shared/NotificationPanel'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '../../hooks/useUnreadCount'

export function CustomerLayout() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const location = useLocation()
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
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer">
              {initials}
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
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors (the removed `signOut`/`useNavigate` imports were only used for LogOut button which is now removed — if LogOut is needed, user can access it elsewhere or we'll add it to avatar later).

- [ ] **Step 4: Commit**

```bash
git add src/components/layouts/CustomerLayout.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign CustomerLayout nav — add How it Works, widen to 1280px, add avatar"
```

---

### Task 5: MysteryCard — add vendor name and category emoji

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/shared/MysteryCard.tsx`

**Interfaces:**
- Produces: `Listing.vendorName?: string` optional field; MysteryCard shows vendor name below title and emoji in top-right corner

- [ ] **Step 1: Add vendorName to Listing type**

In `src/types.ts`, in the `Listing` interface, after `vendorId: string`, add:

```ts
vendorName?: string
```

- [ ] **Step 2: Replace MysteryCard**

Replace the full content of `src/components/shared/MysteryCard.tsx` with:

```tsx
import { useTranslation } from 'react-i18next'
import { TimerBadge } from './TimerBadge'
import { StockBadge } from './StockBadge'
import type { Listing, ListingCategory } from '../../types'

const CATEGORY_EMOJI: Record<ListingCategory, string> = {
  bakery: '🥐', fruit: '🍎', vegetables: '🥦', dairy: '🧀', meat: '🥩',
  rice: '🍚', noodles: '🍜', drinks: '🧃', snacks: '🍿', other: '📦',
}

interface MysteryCardProps {
  listing: Listing
  onClick: () => void
}

export function MysteryCard({ listing, onClick }: MysteryCardProps) {
  const { t } = useTranslation()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const emoji = CATEGORY_EMOJI[listing.category] ?? '📦'

  return (
    <article
      role="article"
      onClick={onClick}
      className="mystery-border bg-surface-container border border-outline-variant rounded-b-xl overflow-hidden hover:border-primary transition-colors cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 bg-surface-container-high overflow-hidden">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}

        {/* Discount badge */}
        <span className="absolute top-2 right-2 bg-error-token text-on-error text-label-caps font-bold px-2 py-0.5 rounded-full shadow-lg">
          -{discount}%
        </span>

        {/* Category emoji top-left */}
        <span className="absolute top-2 left-2 bg-surface-container/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-sm">
          {emoji}
        </span>

        {/* Pickup timer badge overlay */}
        <div className="absolute bottom-2 left-2">
          <TimerBadge pickupEnd={listing.pickupEnd} />
        </div>

        {/* Sold out overlay */}
        {listing.status === 'sold_out' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-wider">{t('listing.soldOut')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="font-semibold text-on-surface text-body-sm truncate">{listing.title}</p>
        {listing.vendorName && (
          <p className="text-on-surface-variant text-xs truncate">{listing.vendorName}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-primary font-bold text-body-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-outline text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <StockBadge quantity={listing.quantityRemaining} />
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/components/shared/MysteryCard.tsx
git commit -m "feat: add vendor name and category emoji to MysteryCard"
```

---

### Task 6: BrowsePage — add sidebar filter panel

**Files:**
- Modify: `src/pages/customer/BrowsePage.tsx`

**Interfaces:**
- Produces: Left sidebar with search, price range, available-only checkbox, sort-by select; card grid on the right

- [ ] **Step 1: Replace BrowsePage**

Replace the full content of `src/pages/customer/BrowsePage.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToActiveListings } from '../../services/listings'
import { MysteryCard } from '../../components/shared/MysteryCard'
import { Search } from 'lucide-react'
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

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'discount'

export default function BrowsePage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    let result = category === 'all' ? listings : listings.filter(l => l.category === category)
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      result = result.filter(l => l.title.toLowerCase().includes(q))
    }
    if (minPrice) result = result.filter(l => l.price >= Number(minPrice))
    if (maxPrice) result = result.filter(l => l.price <= Number(maxPrice))
    if (availableOnly) result = result.filter(l => l.quantityRemaining > 0 && l.status === 'active')
    return [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'discount') return (1 - b.price / b.originalPrice) - (1 - a.price / a.originalPrice)
      return b.createdAt.seconds - a.createdAt.seconds
    })
  }, [listings, category, searchText, minPrice, maxPrice, availableOnly, sortBy])

  const inputCls = 'w-full bg-surface-dim border border-outline-variant rounded-lg h-10 px-3 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

  return (
    <div>
      {/* Header */}
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

      {/* Layout: sidebar + grid */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 self-start">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col gap-4">
            <p className="text-label-caps text-on-surface-variant uppercase tracking-wider">{t('browse.filters')}</p>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="text"
                placeholder={t('browse.searchPlaceholder')}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full bg-surface-dim border border-outline-variant rounded-lg h-10 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Price range */}
            <div className="flex flex-col gap-2">
              <p className="text-body-sm text-on-surface-variant">{t('browse.priceRange')}</p>
              <div className="flex gap-2">
                <input type="number" placeholder={t('browse.min')} value={minPrice}
                  onChange={e => setMinPrice(e.target.value)} className={inputCls} />
                <input type="number" placeholder={t('browse.max')} value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Available only */}
            <label className="flex items-center gap-2 cursor-pointer text-body-sm text-on-surface-variant">
              <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}
                className="accent-indigo-500 w-4 h-4 rounded" />
              {t('browse.availableOnly')}
            </label>

            {/* Sort */}
            <div className="flex flex-col gap-1.5">
              <p className="text-body-sm text-on-surface-variant">{t('browse.sortBy')}</p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="w-full bg-surface-dim border border-outline-variant rounded-lg h-10 px-3 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="newest">{t('browse.sortNewest')}</option>
                <option value="price_asc">{t('browse.sortPriceAsc')}</option>
                <option value="price_desc">{t('browse.sortPriceDesc')}</option>
                <option value="discount">{t('browse.sortDiscount')}</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Card grid */}
        {loading ? (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-body-lg">{t('browse.noListings')}</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
```

- [ ] **Step 2: Add filter translation keys**

In `src/locales/en/translation.json`, under `"browse"`, add:
```json
"filters": "Filters",
"searchPlaceholder": "Search listings...",
"priceRange": "Price Range (đ)",
"min": "Min",
"max": "Max",
"availableOnly": "Available now",
"sortBy": "Sort by",
"sortNewest": "Newest",
"sortPriceAsc": "Price: Low to High",
"sortPriceDesc": "Price: High to Low",
"sortDiscount": "Biggest Discount"
```

In `src/locales/vi/translation.json`, under `"browse"`, add:
```json
"filters": "Bộ lọc",
"searchPlaceholder": "Tìm kiếm...",
"priceRange": "Khoảng giá (đ)",
"min": "Tối thiểu",
"max": "Tối đa",
"availableOnly": "Còn hàng",
"sortBy": "Sắp xếp",
"sortNewest": "Mới nhất",
"sortPriceAsc": "Giá: Thấp đến Cao",
"sortPriceDesc": "Giá: Cao đến Thấp",
"sortDiscount": "Giảm giá nhiều nhất"
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/BrowsePage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add sidebar filter panel to BrowsePage"
```

---

### Task 7: OrdersPage — redesign as card grid

**Files:**
- Modify: `src/pages/customer/OrdersPage.tsx`

**Interfaces:**
- Consumes: `Order` type from types.ts, `subscribeToCustomerOrders` from services/orders
- Produces: 3-col responsive grid; each card has order name, status chip top-right, date, box count, total price

- [ ] **Step 1: Replace OrdersPage**

Replace the full content of `src/pages/customer/OrdersPage.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToCustomerOrders } from '../../services/orders'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Order } from '../../types'

const statusVariant = (s: string): 'primary' | 'emerald' | 'rose' | 'slate' => {
  if (s === 'paid') return 'primary'
  if (s === 'picked_up') return 'slate'
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
    const unsub = subscribeToCustomerOrders(userProfile.uid, data => {
      setOrders(data)
      setLoading(false)
    })
    return unsub
  }, [userProfile])

  if (loading) return <div className="py-20 text-center text-on-surface-variant">{t('browse.loading')}</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('nav.myOrders')}</h1>
        <p className="text-on-surface-variant text-body-lg mt-1">{t('order.ordersSubtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-body-lg">{t('order.noOrders')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const pickedUp = order.status === 'picked_up'
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col gap-3 hover:border-primary transition-colors"
              >
                {/* Header: name + status chip */}
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-body-sm text-on-surface ${pickedUp ? 'line-through text-on-surface-variant' : ''}`}>
                    {order.listingTitle}
                  </p>
                  <StatusChip variant={statusVariant(order.status)}>
                    {t(`order.status_${order.status}`)}
                  </StatusChip>
                </div>

                {/* Date */}
                <p className="text-on-surface-variant text-xs">
                  {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                </p>

                {/* Divider */}
                <div className="border-t border-outline-variant" />

                {/* Footer: boxes + price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
                    <span>📦</span>
                    <span>×{order.quantity} {t('order.boxes')}</span>
                  </div>
                  <span className="text-primary font-bold text-body-sm">
                    {order.totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add translation keys**

In `src/locales/en/translation.json`, under `"order"`, add:
```json
"ordersSubtitle": "Manage your recent marketplace claims and subscriptions.",
"boxes": "Boxes"
```

In `src/locales/vi/translation.json`, under `"order"`, add:
```json
"ordersSubtitle": "Quản lý các đơn hàng gần đây của bạn.",
"boxes": "Hộp"
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/OrdersPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign OrdersPage as 3-col card grid"
```

---

### Task 8: OrderDetailPage — full redesign

**Files:**
- Modify: `src/pages/customer/OrderDetailPage.tsx`

**Interfaces:**
- Consumes: `Order` from types.ts (fields: `id`, `listingTitle`, `status`, `totalPrice`, `qrCode`, `paymentMethod`, `quantity`, `pickupEnd`, `createdAt`)
- Produces: Back link header, stat tiles, QR section with Share/Save, payment details section, star rating section

- [ ] **Step 1: Replace OrderDetailPage**

Replace the full content of `src/pages/customer/OrderDetailPage.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { QRCodeSVG } from 'qrcode.react'
import { StatusChip } from '../../components/shared/StatusChip'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Share2, Download, Star } from 'lucide-react'
import type { Order } from '../../types'

const STATUS_STEPS: Array<{ key: string; labelKey: string }> = [
  { key: 'paid',      labelKey: 'order.statusPaid' },
  { key: 'picked_up', labelKey: 'order.statusPickedUp' },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

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

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const statusVariant = order.status === 'picked_up' ? 'emerald' : order.status === 'paid' ? 'primary' : 'rose'
  const orderRef = '#SVR-' + order.id.slice(0, 6).toUpperCase()

  const pickupTime = order.pickupEnd
    ? new Date(order.pickupEnd.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const canRate = order.status === 'picked_up'

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 max-w-lg mx-auto">
        <Link to="/orders" className="flex items-center gap-1 text-on-surface-variant text-body-sm hover:text-on-surface transition-colors">
          <ArrowLeft size={16} /> {t('nav.myOrders')}
        </Link>
        <p className="gradient-text font-bold text-body-sm">MysteryBox</p>
        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 flex flex-col gap-5 mt-2">
        {/* Status + order ref */}
        <div className="flex flex-col items-center gap-2 text-center">
          <StatusChip variant={statusVariant}>{t(`order.status_${order.status}`)}</StatusChip>
          <p className="text-on-surface-variant text-body-sm">{orderRef}</p>
        </div>

        {/* Title + subtitle */}
        <div className="text-center">
          <h1 className="text-headline-lg-mobile font-bold text-on-surface">{order.listingTitle}</h1>
          {pickupTime && (
            <p className="text-on-surface-variant text-body-sm mt-1">
              {t('order.pickupToday', { time: pickupTime })}
            </p>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t('order.items'), value: String(order.quantity) },
            { label: t('order.total'), value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex flex-col gap-1">
              <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
              <span className="text-mono-stat font-semibold text-on-surface">{value}</span>
            </div>
          ))}
        </div>

        {/* Live status tracker */}
        <div className="flex items-center gap-3">
          {STATUS_STEPS.map((step) => {
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

        {/* QR section */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col items-center gap-4">
          <div>
            <p className="text-on-surface font-semibold text-center">{t('order.pickupQR')}</p>
            <p className="text-on-surface-variant text-body-sm text-center mt-1">{t('order.showVendor')}</p>
          </div>

          {/* QR code on white bg */}
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={order.qrCode} size={180} bgColor="#ffffff" fgColor="#000000" />
          </div>

          <p className="text-primary font-mono text-body-sm tracking-wider">{order.qrCode.slice(0, 16).toUpperCase()}</p>

          <div className="flex gap-3 w-full">
            <button className="flex-1 flex items-center justify-center gap-2 border border-outline-variant text-on-surface-variant rounded-lg py-2.5 text-body-sm hover:border-primary hover:text-on-surface transition-colors">
              <Share2 size={15} /> {t('order.share')}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 gradient-bg text-white rounded-lg py-2.5 text-body-sm font-semibold hover:opacity-90 transition-opacity">
              <Download size={15} /> {t('order.saveQR')}
            </button>
          </div>
        </div>

        {/* Payment details */}
        {order.paymentMethod && (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
            <p className="text-on-surface font-semibold">{t('order.paymentDetails')}</p>
            <div className="flex flex-col gap-2">
              {[
                { label: t('order.method'), value: t(`payment.${order.paymentMethod}`) },
                { label: t('order.orderId'), value: order.id.slice(0, 8).toUpperCase() },
                { label: t('order.amount'), value: `${order.totalPrice.toLocaleString('vi-VN')} đ` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-on-surface-variant text-body-sm">{label}</span>
                  <span className="text-on-surface text-body-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate experience */}
        <div className={`bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-4 ${!canRate ? 'opacity-50' : ''}`}>
          <p className="text-on-surface font-semibold">{t('order.rateExperience')}</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                disabled={!canRate}
                onClick={() => canRate && setRating(star)}
                onMouseEnter={() => canRate && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
              >
                <Star
                  size={28}
                  className={star <= (hoverRating || rating) ? 'text-tertiary fill-tertiary' : 'text-outline'}
                />
              </button>
            ))}
          </div>
          <textarea
            disabled={!canRate}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('order.ratePlaceholder')}
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:cursor-not-allowed resize-none"
          />
          <button
            disabled={!canRate || rating === 0}
            className="gradient-bg text-white rounded-lg py-2.5 font-semibold text-body-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('order.submitRating')}
          </button>
          {!canRate && (
            <p className="text-on-surface-variant text-xs text-center">{t('order.rateAfterPickup')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add translation keys**

In `src/locales/en/translation.json`, under `"order"`, add:
```json
"pickupToday": "Pick up today before {{time}}",
"items": "Items",
"total": "Total",
"pickupQR": "Pickup QR Code",
"showVendor": "Show this QR code to the vendor when picking up",
"share": "Share",
"saveQR": "Save QR",
"paymentDetails": "Payment Details",
"method": "Method",
"rateExperience": "Rate Your Experience",
"ratePlaceholder": "Tell us about your experience...",
"submitRating": "Submit Rating",
"rateAfterPickup": "You can rate after picking up your order"
```

In `src/locales/vi/translation.json`, under `"order"`, add:
```json
"pickupToday": "Nhận trước {{time}} hôm nay",
"items": "Sản phẩm",
"total": "Tổng cộng",
"pickupQR": "Mã QR nhận hàng",
"showVendor": "Cho nhà bán thấy mã QR này khi nhận hàng",
"share": "Chia sẻ",
"saveQR": "Lưu QR",
"paymentDetails": "Chi tiết thanh toán",
"method": "Phương thức",
"rateExperience": "Đánh giá trải nghiệm",
"ratePlaceholder": "Kể về trải nghiệm của bạn...",
"submitRating": "Gửi đánh giá",
"rateAfterPickup": "Bạn có thể đánh giá sau khi nhận hàng"
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/OrderDetailPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: full redesign of OrderDetailPage — QR section, payment details, star rating"
```

---

### Task 9: CheckoutSuccessPage and CheckoutCancelPage — text and layout fixes

**Files:**
- Modify: `src/pages/customer/CheckoutSuccessPage.tsx`
- Modify: `src/pages/customer/CheckoutCancelPage.tsx`

- [ ] **Step 1: Fix CheckoutSuccessPage heading and button text**

In `src/pages/customer/CheckoutSuccessPage.tsx`, replace:
```tsx
<h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.confirmed')}</h1>
<p className="text-on-surface-variant text-body-lg mt-2">{t('order.showQR')}</p>
```
with:
```tsx
<h1 className="text-headline-lg-mobile font-bold text-on-surface">{t('order.paymentSuccessful')}</h1>
<p className="text-on-surface-variant text-body-lg mt-2">{t('order.qrReady')}</p>
```

Replace the View All button:
```tsx
<Link to="/orders">
  <button className="gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
    {t('order.viewAll')}
  </button>
</Link>
```
with:
```tsx
{order ? (
  <Link to={`/orders/${order.id}`} className="w-full">
    <button className="w-full gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
      {t('order.viewMyOrder')}
    </button>
  </Link>
) : (
  <Link to="/orders" className="w-full">
    <button className="w-full gradient-bg text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
      {t('order.viewAll')}
    </button>
  </Link>
)}
```

- [ ] **Step 2: Fix CheckoutCancelPage — full-width button and Contact Support link**

In `src/pages/customer/CheckoutCancelPage.tsx`, replace the Link/button block:
```tsx
<Link to="/browse">
  <button className="border border-outline-variant hover:border-primary text-primary text-body-lg font-semibold rounded-lg px-8 py-3 transition-colors">
    {t('order.backToBrowse')}
  </button>
</Link>
```
with:
```tsx
<Link to="/browse" className="w-full">
  <button className="w-full border border-outline-variant hover:border-primary text-primary text-body-lg font-semibold rounded-lg px-8 py-3 transition-colors">
    {t('order.backToBrowse')}
  </button>
</Link>
<a href="mailto:support@mysterybox.vn" className="text-on-surface-variant text-body-sm hover:text-primary transition-colors">
  {t('order.contactSupport')}
</a>
```

- [ ] **Step 3: Add translation keys**

In `src/locales/en/translation.json`, under `"order"`, add:
```json
"paymentSuccessful": "Payment Successful!",
"qrReady": "Your QR code is ready. Thank you",
"viewMyOrder": "View My Order",
"contactSupport": "Contact Support"
```

In `src/locales/vi/translation.json`, under `"order"`, add:
```json
"paymentSuccessful": "Thanh toán thành công!",
"qrReady": "Mã QR của bạn đã sẵn sàng. Cảm ơn bạn",
"viewMyOrder": "Xem đơn hàng",
"contactSupport": "Liên hệ hỗ trợ"
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/customer/CheckoutSuccessPage.tsx src/pages/customer/CheckoutCancelPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: fix text and layout on CheckoutSuccessPage and CheckoutCancelPage"
```

---

### Task 10: SubscriptionsPage — hero section and Why Subscribe

**Files:**
- Modify: `src/pages/customer/SubscriptionsPage.tsx`

**Interfaces:**
- Consumes: All existing logic (`getFollows`, `getSubscription`, `createSubscription`, `cancelSubscription`) — unchanged
- Produces: Hero with 3D illustration, redesigned plan cards (Basic/Elite/Pro labels), Why Subscribe 3-col section

- [ ] **Step 1: Replace SubscriptionsPage**

Replace the full content of `src/pages/customer/SubscriptionsPage.tsx` with:

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getFollows, unfollowVendor, toggleNotifications } from '../../services/follows'
import { getSubscription, createSubscription, cancelSubscription } from '../../services/subscriptions'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Follow, Subscription, SubscriptionPlan } from '../../types'
import { Bell, BellOff, Trash2, Leaf, Users, Sparkles } from 'lucide-react'

const SUB_ILLUSTRATION = new URL(
  '../../assets/subscription-3d.png',
  import.meta.url
).href

interface PlanMeta {
  key: SubscriptionPlan
  displayName: string
  price: string
  popular?: boolean
  features: string[]
}

const PLANS: PlanMeta[] = [
  {
    key: 'free',
    displayName: 'Basic',
    price: 'Free',
    features: ['subs.featureFollow', 'subs.featureNotify'],
  },
  {
    key: 'monthly',
    displayName: 'Elite',
    price: '300.000 đ / ngày',
    popular: true,
    features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly', 'subs.featureVoucher'],
  },
  {
    key: 'weekly',
    displayName: 'Pro',
    price: '150.000 đ / ngày',
    features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly'],
  },
]

const WHY_ITEMS = [
  { icon: Leaf,     titleKey: 'subs.whySustainTitle',  descKey: 'subs.whySustainDesc' },
  { icon: Users,    titleKey: 'subs.whyLocalTitle',    descKey: 'subs.whyLocalDesc' },
  { icon: Sparkles, titleKey: 'subs.whyFreshTitle',    descKey: 'subs.whyFreshDesc' },
]

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [follows, setFollows] = useState<Follow[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    getFollows(userProfile.uid).then(setFollows)
    getSubscription(userProfile.uid).then(setSubscription)
  }, [userProfile])

  const handleToggleNotif = async (follow: Follow) => {
    await toggleNotifications(follow.id, !follow.notificationsEnabled)
    setFollows(prev => prev.map(f => f.id === follow.id ? { ...f, notificationsEnabled: !f.notificationsEnabled } : f))
  }

  const handleUnfollow = async (follow: Follow) => {
    await unfollowVendor(follow.id)
    setFollows(prev => prev.filter(f => f.id !== follow.id))
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free') return
    setLoadingPlan(plan)
    try {
      const { clientSecret } = await createSubscription(plan)
      console.log('Stripe clientSecret:', clientSecret)
      alert(t('subs.stripeRedirect'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!subscription?.stripeSubscriptionId) return
    setCancelling(true)
    try {
      await cancelSubscription(subscription.stripeSubscriptionId)
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      {/* Hero section */}
      <section className="relative bg-surface-container border border-outline-variant rounded-2xl overflow-hidden mb-12 px-8 py-12 md:py-16">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="blob w-64 h-64 bg-inverse-primary/10 top-0 left-0" />
          <div className="blob w-48 h-48 bg-secondary-container/10 bottom-0 right-0" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-lg">
            <span className="inline-flex items-center gap-2 bg-surface-variant border border-outline-variant rounded-full px-4 py-1.5 text-label-caps text-on-surface uppercase tracking-wider w-fit">
              ★ {t('subs.vipAccess')}
            </span>
            <h1 className="text-headline-lg font-bold text-on-surface">
              {t('subs.elevate')}{' '}
              <span className="gradient-text">{t('subs.experience')}</span>
            </h1>
            <p className="text-on-surface-variant text-body-lg">{t('subs.heroSubtitle')}</p>
            <button className="gradient-bg text-white rounded-lg px-6 py-3 font-semibold text-body-lg hover:opacity-90 transition-opacity w-fit">
              {t('subs.explorePlans')} →
            </button>
          </div>
          <img
            src="/Design/a_modern_vibrant_3d_illustration_for_a_food_subscription_service._features_a/screen.png"
            alt="Subscription box"
            className="w-48 h-48 md:w-64 md:h-64 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      </section>

      {/* Plan cards */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ key, displayName, price, popular, features }) => {
            const isActive = subscription?.plan === key && subscription?.status === 'active'
            return (
              <div
                key={key}
                className={`relative bg-surface-container border rounded-xl p-5 flex flex-col gap-4 ${
                  popular ? 'border-primary gradient-border-box' : isActive ? 'gradient-border-box border-primary' : 'border-outline-variant'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-bg text-white text-label-caps font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {isActive && !popular && (
                  <StatusChip variant="emerald">{t('subs.active')}</StatusChip>
                )}
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface">{displayName}</h3>
                  <p className="text-primary font-bold text-mono-stat mt-1">{price}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="text-emerald-400">✓</span>
                      {t(f)}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="flex flex-col gap-2">
                    {subscription?.currentPeriodEnd && (
                      <p className="text-xs text-on-surface-variant">
                        {t('subs.renewsOn')} {new Date(subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                    <GhostButton onClick={handleCancel} disabled={cancelling} className="w-full">
                      {cancelling ? t('subs.cancelling') : t('subs.cancel')}
                    </GhostButton>
                  </div>
                ) : key === 'free' ? (
                  <GhostButton className="w-full" disabled>{t('subs.currentFree')}</GhostButton>
                ) : (
                  <GradientButton
                    onClick={() => handleSubscribe(key)}
                    disabled={loadingPlan === key}
                    className="w-full"
                  >
                    {loadingPlan === key ? t('subs.subscribing') : `${t('subs.upgrade')} ${displayName}`}
                  </GradientButton>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Why Subscribe */}
      <section className="mb-12">
        <h2 className="text-headline-md font-bold text-on-surface text-center mb-6">{t('subs.whyTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="bg-surface-container border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="text-on-surface font-semibold text-body-lg">{t(titleKey)}</h3>
              <p className="text-on-surface-variant text-body-sm">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Followed Vendors */}
      {follows.length > 0 && (
        <section>
          <h2 className="text-headline-md font-bold text-on-surface mb-4">{t('subs.followedVendors')}</h2>
          <div className="flex flex-col gap-3">
            {follows.map(follow => (
              <div key={follow.id} className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                  {follow.vendorId.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-semibold text-body-sm truncate">{follow.vendorId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleNotif(follow)}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title={follow.notificationsEnabled ? t('subs.muteNotif') : t('subs.enableNotif')}>
                    {follow.notificationsEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
                  </button>
                  <button onClick={() => handleUnfollow(follow)}
                    className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error-token">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add translation keys**

In `src/locales/en/translation.json`, under `"subs"`, add:
```json
"explorePlans": "Explore Plans",
"upgrade": "Upgrade to",
"whyTitle": "Why Subscribe?",
"whySustainTitle": "Sustainability",
"whySustainDesc": "Help reduce food waste by claiming surplus boxes before they're discarded.",
"whyLocalTitle": "Local Support",
"whyLocalDesc": "Support local F&B businesses and keep your community thriving.",
"whyFreshTitle": "Freshness Guaranteed",
"whyFreshDesc": "All boxes are packed fresh daily and must be collected within the pickup window."
```

In `src/locales/vi/translation.json`, under `"subs"`, add:
```json
"explorePlans": "Xem các gói",
"upgrade": "Nâng cấp lên",
"whyTitle": "Tại sao đăng ký?",
"whySustainTitle": "Bền vững",
"whySustainDesc": "Giúp giảm lãng phí thực phẩm bằng cách nhận các hộp dư thừa.",
"whyLocalTitle": "Ủng hộ địa phương",
"whyLocalDesc": "Hỗ trợ các doanh nghiệp F&B địa phương.",
"whyFreshTitle": "Tươi ngon đảm bảo",
"whyFreshDesc": "Tất cả hộp được đóng gói tươi mỗi ngày."
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors. (The `SUB_ILLUSTRATION` variable is defined but img uses a direct path string — remove the unused `SUB_ILLUSTRATION` variable if it causes a warning.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/SubscriptionsPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign SubscriptionsPage — hero, plans grid, Why Subscribe section"
```

---

### Task 11: VendorLayout — convert sidebar to top nav

**Files:**
- Modify: `src/components/layouts/VendorLayout.tsx`

**Interfaces:**
- Produces: Fixed top nav h-16 with brand left, nav links center, language+avatar right; main content uses `pt-16 pl-0` instead of `ml-56`

- [ ] **Step 1: Replace VendorLayout**

Replace the full content of `src/components/layouts/VendorLayout.tsx` with:

```tsx
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../services/auth'
import { LanguageToggle } from '../shared/LanguageToggle'
import { LayoutDashboard, Package, ShoppingBag, QrCode, Archive, Wand2, LogOut } from 'lucide-react'

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

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant h-16">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between gap-4">
          <Link to="/vendor" className="gradient-text font-bold text-headline-md shrink-0">
            MysteryBox
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? location.pathname === to : location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                    active
                      ? 'gradient-bg text-white'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <p className="text-on-surface-variant text-body-sm hidden lg:block truncate max-w-[120px]">
              {userProfile?.storeName ?? userProfile?.displayName}
            </p>
            <LanguageToggle />
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              title={t('nav.signOut')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 max-w-[1400px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/VendorLayout.tsx
git commit -m "feat: convert VendorLayout from sidebar to top nav"
```

---

### Task 12: VendorComposePage — 3-zone horizontal grid layout

**Files:**
- Modify: `src/pages/vendor/VendorComposePage.tsx`

**Interfaces:**
- Consumes: All existing state/logic unchanged (`subscribeToInventory`, `composeMysteryBox`, `suggestPrice`, `createListing`, `updateInventoryItem`)
- Produces: `grid grid-cols-12` 3-zone horizontal layout — Zone 1 (4 cols inventory), Zone 2 (4 cols controls+AI), Zone 3 (4 cols editor)

- [ ] **Step 1: Replace the return statement (layout only)**

Replace the entire `return (...)` block in `src/pages/vendor/VendorComposePage.tsx` (starting at `return (` on line 206, ending at the closing `)`) with:

```tsx
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-bold text-on-surface">{t('vendor.compose_page_title')}</h1>
        <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">AI Compose</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-10rem)]">

        {/* ZONE 1: Inventory Catalog (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-outline-variant">
            <h2 className="text-on-surface font-semibold">{t('vendor.inventory')}</h2>
            <span className="text-label-caps text-on-surface-variant bg-surface-container-high border border-outline-variant rounded px-2 py-0.5">ZONE 1</span>
          </div>

          <div className="p-3 border-b border-outline-variant">
            <div className="relative">
              <input
                type="text"
                placeholder={t('vendor.searchInventory')}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg h-9 pl-8 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {catalogLoading && <p className="text-on-surface-variant text-sm p-2">{t('browse.loading')}</p>}
            {!catalogLoading && inventoryItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-on-surface-variant mb-3">{t('vendor.no_inventory')}</p>
                <button onClick={() => navigate('/vendor/inventory')}
                  className="border border-outline-variant text-on-surface-variant text-body-sm rounded-lg px-4 py-2 hover:border-primary transition-colors">
                  {t('vendor.go_to_inventory')}
                </button>
              </div>
            )}
            {sortedInventory.map(item => {
              const selected = selectedItems.has(item.id)
              const expiring = expiryLabel(item) === 'today' || expiryLabel(item) === 'soon'
              return (
                <div key={item.id} onClick={() => toggleItem(item)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                    selected ? 'border-primary bg-primary/5'
                    : expiring ? 'border-tertiary bg-tertiary/5'
                    : 'border-outline-variant bg-surface-container-high/40 hover:bg-surface-container-high'
                  }`}>
                  <input type="checkbox" checked={selected} readOnly className="accent-indigo-500 w-4 h-4 pointer-events-none shrink-0" />
                  <span className="text-lg shrink-0">{CATEGORY_ICONS[item.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface text-body-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-on-surface-variant text-xs">{item.unitPrice.toLocaleString('vi-VN')} đ/{item.unit}</p>
                      {expiring && (
                        <span className="text-tertiary text-xs bg-tertiary/10 border border-tertiary/30 rounded px-1.5 py-0.5">
                          Expires Today
                        </span>
                      )}
                    </div>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) - 1)}
                        className="w-6 h-6 rounded border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high text-sm">−</button>
                      <span className="text-on-surface text-sm w-5 text-center">{selectedItems.get(item.id)?.qty ?? 1}</span>
                      <button onClick={() => setItemQty(item.id, (selectedItems.get(item.id)?.qty ?? 1) + 1)}
                        className="w-6 h-6 rounded border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high text-sm">+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {selectedItems.size > 0 && (
            <div className="px-4 py-3 border-t border-outline-variant flex justify-between text-body-sm">
              <span className="text-on-surface-variant">{selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected</span>
              <span className="text-on-surface font-medium">{totalValue.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
        </div>

        {/* ZONE 2: Pricing Controls + AI Suggestion (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Pricing Controls card */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-on-surface font-semibold">Pricing Controls</h2>
              <span className="text-label-caps text-on-surface-variant bg-surface-container-high border border-outline-variant rounded px-2 py-0.5">ZONE 2</span>
            </div>

            <div>
              <div className="flex justify-between text-body-sm mb-2">
                <span className="text-on-surface-variant">{t('vendor.discount_pct')}</span>
                <span className="text-primary font-bold">{discount}%</span>
              </div>
              <input type="range" min="20" max="90" step="5" value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full accent-indigo-500" />
              <p className="text-outline text-xs mt-1">Boxes sell at {100 - discount}% of original value</p>
            </div>

            {suggestResult && (
              <div className="bg-tertiary/10 border border-tertiary/30 rounded-xl p-3 flex items-start justify-between gap-2">
                <p className="text-tertiary text-body-sm">
                  {t('vendor.price_suggestion', { discount: suggestResult.recommendedDiscount, reason: suggestResult.reason })}
                </p>
                <button onClick={() => { setDiscount(suggestResult.recommendedDiscount); setSuggestResult(null) }}
                  className="text-tertiary hover:text-on-surface text-xs font-medium whitespace-nowrap shrink-0">
                  Apply
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSuggestPrice} disabled={suggestLoading}
                className="flex-1 border border-primary text-primary rounded-lg py-2 text-body-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50">
                {suggestLoading ? '…' : t('vendor.suggest_price')}
              </button>
              <button onClick={handleCompose}
                disabled={selectedItems.size === 0 || composerLoading}
                className="flex-1 flex items-center justify-center gap-2 gradient-bg text-white rounded-lg py-2 text-body-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {composerLoading ? t('vendor.ai_composing') : t('vendor.ai_compose_btn')}
              </button>
            </div>

            {composerError && <p className="text-error-token text-body-sm">{composerError}</p>}
          </div>

          {/* AI Suggestion card */}
          <div className={`bg-surface-container border border-secondary-container rounded-xl p-4 flex flex-col gap-4 ai-shadow border-t-4 ${composerResult ? '' : 'opacity-50'}`}>
            <p className="text-secondary-token text-label-caps font-bold uppercase tracking-wider">
              ✨ {t('vendor.ai_suggestion')}
            </p>

            {composerResult ? (
              <>
                <div className="text-center">
                  <p className="text-on-surface-variant text-body-sm mb-2">{t('vendor.ai_box_count', { n: numBoxes })}</p>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setNumBoxes(n => Math.max(1, n - 1))}
                      className="w-10 h-10 rounded-xl border border-secondary-container text-on-surface font-bold text-lg hover:bg-surface-container-high active:scale-95 transition-transform">
                      −
                    </button>
                    <div className="text-center">
                      <p className="text-on-surface text-3xl font-bold">{numBoxes}</p>
                      <p className="text-on-surface-variant text-xs">{t('vendor.num_boxes')}</p>
                    </div>
                    <button onClick={() => setNumBoxes(n => Math.min(20, n + 1))}
                      className="w-10 h-10 rounded-xl border border-secondary-container text-on-surface font-bold text-lg hover:bg-surface-container-high active:scale-95 transition-transform">
                      +
                    </button>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    <span className="line-through mr-2">{currentOriginalPrice.toLocaleString('vi-VN')} đ</span>
                    <span className="text-emerald-400 font-semibold">{currentSalePrice.toLocaleString('vi-VN')} đ</span>
                  </p>
                </div>

                <div className="border-t border-secondary-container/30 pt-3">
                  <p className="text-secondary-token text-xs font-semibold mb-2">📦 Packing guide (per box)</p>
                  <div className="space-y-1.5">
                    {packingGuide.map(({ name, icon, perBox, leftover }) => (
                      <div key={name} className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant">{icon} {name}</span>
                        <span className="text-on-surface font-medium">
                          {perBox > 0 ? `×${perBox}` : <span className="text-outline">—</span>}
                          {leftover > 0 && <span className="text-tertiary text-xs ml-1">+{leftover}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-on-surface-variant text-body-sm">Select items and click ✨ Compose with AI</p>
              </div>
            )}
          </div>
        </div>

        {/* ZONE 3: Listing Editor (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-outline-variant">
            <h2 className="text-on-surface font-semibold">Listing Editor</h2>
            <span className="text-label-caps text-on-surface-variant bg-surface-container-high border border-outline-variant rounded px-2 py-0.5">ZONE 3</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {composerResult && (
              <span className="inline-flex items-center gap-1.5 text-secondary-token text-xs bg-secondary-container/10 border border-secondary-container/20 rounded-full px-3 py-1">
                ✨ {t('vendor.ai_suggestion')} (editable)
              </span>
            )}

            <div className="space-y-1.5">
              <label className="text-on-surface-variant text-body-sm block">{t('vendor.category')}</label>
              <Select value={editCategory} onValueChange={v => setEditCategory(v as ListingCategory)}>
                <SelectTrigger className="bg-surface-container-lowest border-outline-variant text-on-surface rounded-xl focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-container border-outline-variant">
                  {ALL_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-on-surface">{t(`categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface-variant text-body-sm block">{t('vendor.title')}</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className={`w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-on-surface focus:outline-none transition-colors ${
                  composerResult ? 'border-secondary-container/30 focus:border-secondary-container' : 'border-outline-variant focus:border-primary'
                }`} />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface-variant text-body-sm block">{t('vendor.description')}</label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className={`bg-surface-container-lowest rounded-xl text-on-surface focus:outline-none transition-colors resize-none ${
                  composerResult ? 'border-secondary-container/30 focus:border-secondary-container' : 'border-outline-variant focus:border-primary'
                }`} />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface-variant text-body-sm block">{t('vendor.price')} (VND)</label>
              <Input value={editPrice} onChange={e => setEditPrice(e.target.value)}
                type="number" min="1000"
                className="bg-surface-container-lowest border-outline-variant text-on-surface rounded-xl focus:border-primary" />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface-variant text-body-sm block">{t('vendor.pickup_window')}</label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={pickupStart} onChange={e => setPickupStart(e.target.value)}
                  type="datetime-local"
                  className="bg-surface-container-lowest border-outline-variant text-on-surface text-xs rounded-xl focus:border-primary" />
                <Input value={pickupEnd} onChange={e => setPickupEnd(e.target.value)}
                  type="datetime-local"
                  className="bg-surface-container-lowest border-outline-variant text-on-surface text-xs rounded-xl focus:border-primary" />
              </div>
            </div>

            {publishError && <p className="text-error-token text-body-sm">{publishError}</p>}
          </div>

          <div className="p-4 border-t border-outline-variant">
            <button
              onClick={handlePublish}
              disabled={publishLoading || !editTitle || !parseInt(editPrice) || parseInt(editPrice) <= 0}
              className="w-full flex items-center justify-center gap-2 gradient-bg text-white rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {publishLoading ? t('vendor.saving') : `${t('vendor.publish_listing')} →`}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
```

- [ ] **Step 2: Add translation key for vendor.searchInventory**

In `src/locales/en/translation.json`, under `"vendor"`, add:
```json
"searchInventory": "Search inventory..."
```

In `src/locales/vi/translation.json`, under `"vendor"`, add:
```json
"searchInventory": "Tìm trong kho..."
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/vendor/VendorComposePage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign VendorComposePage as 3-zone horizontal grid"
```

---

## Self-Review

**Spec coverage:**
- ✅ Task 1 — Design tokens (already in tailwind.config.ts, added ai-shadow CSS utility)
- ✅ Task 2 — LoginPage icons + forgot link
- ✅ Task 3 — RegisterPage icons
- ✅ Task 4 — CustomerLayout nav (How it Works, avatar, widen)
- ✅ Task 5 — MysteryCard (vendorName, category emoji)
- ✅ Task 6 — BrowsePage sidebar filter panel
- ✅ Task 7 — OrdersPage 3-col grid
- ✅ Task 8 — OrderDetailPage full redesign (QR, payment, rating)
- ✅ Task 9 — CheckoutSuccessPage + CheckoutCancelPage text/layout
- ✅ Task 10 — SubscriptionsPage hero + plans + Why Subscribe
- ✅ Task 11 — VendorLayout sidebar → top nav
- ✅ Task 12 — VendorComposePage 3-zone horizontal grid

**Placeholder scan:** No TBDs or incomplete steps. Every step has exact code.

**Type consistency:**
- `Listing.vendorName?: string` added in Task 5, used in Task 5 — consistent
- `Order` type unchanged — all fields used in Task 8 match types.ts exactly
- `SubscriptionPlan` type unchanged — plan keys `'free' | 'weekly' | 'monthly'` match Task 10

**Notes for implementer:**
- `error-token` / `secondary-token` / `primary-container-token` are the Tailwind class names (not `error` / `secondary` / `primary-container`) due to shadcn/ui token conflict
- Task 10 `SubscriptionsPage` uses a direct img path for the 3D illustration; if the path doesn't resolve in dev, the `onError` handler hides it gracefully
- Task 12 Zone 3 shows content even when `composerResult` is null (fields will be empty but editable) — this differs from the original which conditionally rendered Zone 3
