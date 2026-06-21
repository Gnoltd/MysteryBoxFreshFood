# MysteryBoxFreshFood — Redesign Part 4: Vendor Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Parts 1–3 complete. Shared components (GradientButton, GhostButton, StatusChip, StockBadge, StockProgressBar, GlassNav) must exist. Vendor layout already updated in Part 2.

**Goal:** Redesign all vendor-facing pages with the new dark design system tokens. Apply real-time `onSnapshot` to ListingsPage and VendorOrdersPage. Restyle VendorComposePage's AI modal with purple AI aesthetic.

**Architecture:** All vendor pages are already inside `VendorLayout` (updated in Part 2). Pages import shared components, apply new token-based Tailwind classes, and replace legacy `bg-slate-*` / `text-white` with semantic tokens.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, Recharts (existing), Firebase Firestore onSnapshot, react-i18next

## Global Constraints

- App name: **MysteryBoxFreshFood**
- All text via `t('key')` — no hardcoded strings
- No Firebase SDK in components — all via `src/services/`
- Real-time: `ListingsPage` and `VendorOrdersPage` subscribe via `onSnapshot` (services already have these)
- Vendor theme: dark (`bg-background`) — no light theme switch

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/pages/vendor/VendorDashboardPage.tsx` |
| Modify | `src/pages/vendor/ListingsPage.tsx` |
| Modify | `src/pages/vendor/ListingFormPage.tsx` |
| Modify | `src/pages/vendor/VendorComposePage.tsx` |
| Modify | `src/pages/vendor/VendorOrdersPage.tsx` |
| Modify | `src/pages/vendor/QRScanPage.tsx` |
| Modify | `src/pages/vendor/VendorInventoryPage.tsx` |

---

### Task 14: Vendor Dashboard Page

**Files:**
- Modify: `src/pages/vendor/VendorDashboardPage.tsx`

- [ ] **Step 1: Read the existing `VendorDashboardPage.tsx` to understand its current stat/chart structure, then rewrite with new tokens**

Open `src/pages/vendor/VendorDashboardPage.tsx` and identify:
- The stats it calculates (revenue, active count, pending pickups, avg rating)
- The Recharts chart component used
- The orders list it renders

Then rewrite:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { StatusChip } from '../../components/shared/StatusChip'
import { StockProgressBar } from '../../components/shared/StockProgressBar'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import type { Listing, Order } from '../../types'
import { Package, ShoppingBag, TrendingUp, Star, QrCode, Wand2, PlusCircle } from 'lucide-react'

export default function VendorDashboardPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!userProfile) return
    const unsub = subscribeToVendorListings(userProfile.uid, setListings)
    getVendorOrders(userProfile.uid).then(setOrders)
    return unsub
  }, [userProfile])

  const revenue = orders
    .filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const activeListings = listings.filter(l => l.status === 'active').length
  const pendingPickups = orders.filter(o => o.status === 'paid').length
  const ratings = orders.filter(o => (o as any).rating).map((o: any) => o.rating as number)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–'

  const recentOrders = orders.slice(0, 5)

  const statCards = [
    { label: t('dashboard.revenue'),       value: `${revenue.toLocaleString('vi-VN')} đ`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: t('dashboard.activeListings'), value: String(activeListings),                 icon: Package,    color: 'text-primary' },
    { label: t('dashboard.pending'),        value: String(pendingPickups),                 icon: ShoppingBag, color: 'text-tertiary' },
    { label: t('dashboard.avgRating'),      value: String(avgRating),                      icon: Star,       color: 'text-primary' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-headline-md font-bold text-on-surface">
        {t('dashboard.title', { store: userProfile?.storeName ?? userProfile?.displayName })}
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-label-caps text-on-surface-variant uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className={`text-mono-stat font-semibold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart placeholder */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-4">
          <h2 className="text-body-sm font-semibold text-on-surface-variant mb-3">{t('dashboard.revenueChart')}</h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={orders.slice(-14).map((o, i) => ({ i, v: o.totalPrice }))}>
              <Line type="monotone" dataKey="v" stroke="#c0c1ff" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ background: '#191f31', border: '1px solid #464554', borderRadius: 8 }}
                labelStyle={{ color: '#c7c4d7' }}
                itemStyle={{ color: '#c0c1ff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h2 className="text-body-sm font-semibold text-on-surface-variant">{t('dashboard.quickActions')}</h2>
          {[
            { to: '/vendor/compose',      label: t('nav.compose'),   icon: Wand2,       cls: 'bg-secondary-container/20 text-secondary-token border-secondary-token/30' },
            { to: '/vendor/listings/new', label: t('listing.new'),   icon: PlusCircle,  cls: 'bg-primary/10 text-primary border-primary/30' },
            { to: '/vendor/scan',         label: t('nav.scanQR'),    icon: QrCode,      cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant' },
          ].map(({ to, label, icon: Icon, cls }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-body-sm transition-opacity hover:opacity-80 ${cls}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant">
          <h2 className="text-body-sm font-semibold text-on-surface">{t('dashboard.recentOrders')}</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-4 py-6 text-on-surface-variant text-body-sm">{t('dashboard.noOrders')}</p>
        ) : (
          <ul>
            {recentOrders.map((order, i) => (
              <li key={order.id} className={`px-4 py-3 flex items-center gap-4 ${i < recentOrders.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-body-sm font-semibold truncate">{order.listingTitle}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
                </div>
                <span className="text-primary font-bold text-body-sm">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                <StatusChip variant={order.status === 'paid' ? 'primary' : order.status === 'picked_up' ? 'emerald' : 'slate'}>
                  {t(`order.status_${order.status}`)}
                </StatusChip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add missing i18n keys in `src/locales/en/translation.json`**

Under a `"dashboard"` key:
```json
"dashboard": {
  "title": "Welcome, {{store}}",
  "revenue": "Revenue",
  "activeListings": "Active Listings",
  "pending": "Pending Pickups",
  "avgRating": "Avg Rating",
  "revenueChart": "Revenue (last 14 orders)",
  "quickActions": "Quick Actions",
  "recentOrders": "Recent Orders",
  "noOrders": "No orders yet."
}
```

In Vietnamese: mirror with translated values.

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/VendorDashboardPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign VendorDashboard with dark tokens, stat cards, and quick actions"
```

---

### Task 15: Vendor Listings Page (real-time table)

**Files:**
- Modify: `src/pages/vendor/ListingsPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/vendor/ListingsPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings, deleteListing, updateListing } from '../../services/listings'
import { StockProgressBar } from '../../components/shared/StockProgressBar'
import { StatusChip } from '../../components/shared/StatusChip'
import { GradientButton } from '../../components/shared/GradientButton'
import type { Listing, ListingCategory } from '../../types'
import { Pencil, Trash2, Wand2 } from 'lucide-react'

export default function ListingsPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')

  useEffect(() => {
    if (!userProfile) return
    return subscribeToVendorListings(userProfile.uid, setListings)
  }, [userProfile])

  const filtered = listings.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || l.category === category
    return matchSearch && matchCat
  })

  const handleToggleStatus = async (l: Listing) => {
    const next = l.status === 'active' ? 'expired' : 'active'
    await updateListing(l.id, { status: next })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('listing.deleteConfirm'))) return
    await deleteListing(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder={t('listing.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value as ListingCategory | 'all')}
          className="bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">{t('browse.all')}</option>
          {(['bakery','fruit','vegetables','dairy','meat','rice','noodles','drinks','snacks','other'] as ListingCategory[]).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Link to="/vendor/compose">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-secondary-token/40 bg-secondary-container/10 text-secondary-token text-body-sm font-semibold hover:opacity-80 transition-opacity">
            <Wand2 size={16} /> {t('nav.compose')}
          </button>
        </Link>
        <Link to="/vendor/listings/new">
          <GradientButton className="py-2.5">{t('listing.new')}</GradientButton>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-on-surface-variant text-body-sm">{t('listing.none')}</div>
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant text-label-caps text-on-surface-variant uppercase tracking-wider">
                <th className="px-4 py-3 text-left">{t('listing.name')}</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">{t('listing.category')}</th>
                <th className="px-4 py-3 text-left">{t('listing.stock')}</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">{t('listing.price')}</th>
                <th className="px-4 py-3 text-left">{t('listing.status')}</th>
                <th className="px-4 py-3 text-right">{t('listing.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={l.id}
                  className={`${i < filtered.length - 1 ? 'border-b border-outline-variant' : ''} ${l.status !== 'active' ? 'opacity-50' : ''} hover:bg-surface-container-high transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.imageUrl
                        ? <img src={l.imageUrl} alt={l.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-lg shrink-0">🎁</div>}
                      <span className="text-on-surface font-semibold truncate max-w-[160px]">{l.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusChip variant="slate">{l.category}</StatusChip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 min-w-[80px]">
                      <span className={`text-body-sm font-semibold ${l.quantityRemaining <= 2 ? 'text-tertiary' : 'text-on-surface'}`}>
                        {l.quantityRemaining} / {l.quantityTotal}
                      </span>
                      <StockProgressBar current={l.quantityRemaining} total={l.quantityTotal} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-primary font-semibold">
                    {l.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(l)}>
                      <StatusChip variant={l.status === 'active' ? 'emerald' : 'slate'}>
                        {l.status === 'active' ? t('listing.active') : t('listing.draft')}
                      </StatusChip>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/vendor/listings/${l.id}/edit`)} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg hover:bg-error-container/20 text-on-surface-variant hover:text-error-token transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add i18n keys**

In `src/locales/en/translation.json` under `"listing"`:
```json
"new": "New Listing",
"searchPlaceholder": "Search listings…",
"none": "No listings yet — create your first box.",
"name": "Name",
"stock": "Stock",
"price": "Price",
"actions": "Actions",
"active": "Active",
"draft": "Draft",
"deleteConfirm": "Delete this listing?"
```

Mirror in Vietnamese.

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/ListingsPage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: redesign ListingsPage as real-time table with StockProgressBar and new tokens"
```

---

### Task 16: Listing Form + AI Compose Restyle

**Files:**
- Modify: `src/pages/vendor/ListingFormPage.tsx`
- Modify: `src/pages/vendor/VendorComposePage.tsx`

- [ ] **Step 1: Update `src/pages/vendor/ListingFormPage.tsx` — replace all `bg-slate-*` / `border-slate-*` / `text-white` with new tokens**

This is a targeted find-and-replace across the existing form. Open the file and apply these substitutions globally:

| Old class | New class |
|---|---|
| `bg-slate-900` | `bg-surface-container` |
| `bg-slate-800` | `bg-surface-container-high` |
| `bg-slate-950` | `bg-background` |
| `border-slate-700` | `border-outline-variant` |
| `border-slate-800` | `border-outline-variant` |
| `text-white` | `text-on-surface` |
| `text-slate-400` | `text-on-surface-variant` |
| `text-slate-500` | `text-outline` |
| `text-indigo-400` | `text-primary` |
| `bg-indigo-600` | `gradient-bg` |
| `border-indigo-500` | `border-primary` |
| `focus:border-indigo-500` | `focus:border-primary` |
| `rounded-lg` (on inputs/buttons) | `rounded-xl` |

Also replace the submit button with `<GradientButton type="submit">`:
```tsx
import { GradientButton } from '../../components/shared/GradientButton'
// Replace existing submit button:
<GradientButton type="submit" disabled={loading} className="w-full">
  {loading ? t('listing.saving') : t('listing.save')}
</GradientButton>
```

Add i18n keys `"saving": "Saving…"` and `"save": "Save Listing"`.

- [ ] **Step 2: Update `src/pages/vendor/VendorComposePage.tsx` — apply AI purple aesthetic**

Open the file and apply targeted replacements:

| Old | New |
|---|---|
| `bg-slate-900` on the modal card | `bg-surface-container-highest` |
| `border-slate-700` on the modal | `border-secondary-token/30` |
| `bg-indigo-600` on the Compose button | replace with `className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary-container text-on-secondary font-semibold hover:opacity-90 transition-opacity"` |
| Any input `border-slate-*` | `border-secondary-token/30 focus:border-secondary-token` |
| The AI input field | Add `✨` prefix icon inside a wrapper div |

Add a sparkle icon to the item input:
```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-token">✨</span>
  <input
    className="w-full pl-8 bg-surface-container-lowest border border-secondary-token/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-secondary-token transition-colors"
    // ... existing props
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/ListingFormPage.tsx src/pages/vendor/VendorComposePage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: restyle ListingForm with new tokens and VendorCompose with purple AI aesthetic"
```

---

### Task 17: Vendor Orders Page (real-time)

**Files:**
- Modify: `src/pages/vendor/VendorOrdersPage.tsx`

- [ ] **Step 1: Open `src/pages/vendor/VendorOrdersPage.tsx` and apply token replacements, then add TimerBadge to deadline column**

Apply same class substitution table as Task 16 Step 1.

Then import TimerBadge and add it to the pickup deadline cell:
```tsx
import { TimerBadge } from '../../components/shared/TimerBadge'
```

In the table row where pickup deadline is rendered, replace the static text with:
```tsx
<td className="px-4 py-3 hidden md:table-cell">
  {order.pickupEnd
    ? <TimerBadge pickupEnd={order.pickupEnd} />
    : <span className="text-on-surface-variant text-xs">—</span>}
</td>
```

Also update `<StatusChip>` usage (if not already using it) to show correct variant per status.

Verify the page already uses `subscribeToVendorOrders` via `onSnapshot`. If it uses a one-time `getDocs`, replace:

```tsx
useEffect(() => {
  if (!userProfile) return
  return subscribeToVendorOrders(userProfile.uid, setOrders)
}, [userProfile])
```

Where `subscribeToVendorOrders` needs to be added to `src/services/orders.ts` if missing:
```ts
export function subscribeToVendorOrders(vendorId: string, callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'))
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))),
    err => { console.error('subscribeToVendorOrders:', err); callback([]) }
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/vendor/VendorOrdersPage.tsx src/services/orders.ts
git commit -m "feat: redesign VendorOrdersPage with real-time onSnapshot and TimerBadge"
```

---

### Task 18: QR Scan Page + Inventory Page

**Files:**
- Modify: `src/pages/vendor/QRScanPage.tsx`
- Modify: `src/pages/vendor/VendorInventoryPage.tsx`

- [ ] **Step 1: Update `src/pages/vendor/QRScanPage.tsx` — apply new tokens and gradient reticle**

Apply the class substitution table from Task 16 Step 1.

Then locate the scanning reticle element (typically a square border overlay) and update its styling:
```tsx
{/* Scanning reticle — replace existing border styling with: */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  <div className="w-56 h-56 rounded-xl" style={{
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
    boxShadow: '0 0 0 2px #8083ff, 0 0 20px rgba(128, 131, 255, 0.3)',
  }} />
</div>
```

For the success state overlay, use emerald:
```tsx
<div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
  <div className="bg-surface-container border border-emerald-500/50 rounded-xl p-6 text-center">
    {/* existing success content */}
  </div>
</div>
```

For error state, use rose:
```tsx
<div className="absolute inset-0 bg-error-container/20 flex items-center justify-center">
  <div className="bg-surface-container border border-error-token/50 rounded-xl p-6 text-center text-error-token">
    {/* existing error content */}
  </div>
</div>
```

- [ ] **Step 2: Update `src/pages/vendor/VendorInventoryPage.tsx` — apply tokens + amber low-stock rows**

Apply the class substitution table.

Then find the table rows and add conditional amber styling for low-stock:
```tsx
<tr
  key={item.id}
  className={`border-b border-outline-variant transition-colors ${
    item.defaultQty <= 2
      ? 'bg-tertiary-container/10 border-l-2 border-l-tertiary'
      : 'hover:bg-surface-container-high'
  }`}
>
```

Also add `<StockProgressBar>` import and use it if there's a stock column:
```tsx
import { StockProgressBar } from '../../components/shared/StockProgressBar'
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/vendor/QRScanPage.tsx src/pages/vendor/VendorInventoryPage.tsx
git commit -m "feat: restyle QRScanPage and VendorInventoryPage with gradient reticle and amber alerts"
```

---

### Task 19: Final i18n Audit + nav.subscriptions

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

- [ ] **Step 1: Verify nav.subscriptions key exists in both files**

In `src/locales/en/translation.json` under `"nav"`, confirm:
```json
"subscriptions": "Subscriptions"
```

In `src/locales/vi/translation.json`:
```json
"subscriptions": "Gói đặt hàng"
```

- [ ] **Step 2: Verify all `t('...')` keys used across new components exist**

Run a grep to find all `t('` usages in newly created/modified files:
```bash
grep -rh "t('" src/pages/customer/SubscriptionsPage.tsx src/pages/vendor/VendorDashboardPage.tsx src/pages/vendor/ListingsPage.tsx | grep -oP "t\('\K[^']*" | sort -u
```

Cross-check each key exists in `src/locales/en/translation.json`. Add any missing ones.

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests still pass (34+). New component tests added in Part 1 also pass.

- [ ] **Step 4: Build verification**

```bash
npm run build
```

Expected: no TypeScript errors, no missing module errors.

- [ ] **Step 5: Final commit**

```bash
git add src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: complete i18n audit — all new keys present in EN and VI"
```

---

## Smoke Tests (manual)

After all tasks complete, verify these flows in the browser:

1. **Login page** — dark card, gradient logo, inputs glow on focus ✓
2. **Browse page** — MysteryCard grid with gradient top border, category chips ✓
3. **Real-time stock** — open two tabs, buy via Stripe test card in one tab — stock count updates in the other tab without refresh ✓
4. **Listing detail** — 2-col layout on desktop, timer banner, sticky "Claim Box" button ✓
5. **Order success** — QR displayed, live status tracker updates when vendor scans ✓
6. **Subscriptions page** — follow vendor list + 3 plan cards ✓
7. **Vendor dashboard** — stat cards + chart + quick actions ✓
8. **Vendor listings table** — real-time stock bar, toggle active/draft ✓
9. **Vendor compose** — purple border modal, sparkle input ✓
10. **Notification bell** — new listing publish triggers push + unread dot appears ✓
