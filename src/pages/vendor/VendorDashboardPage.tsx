import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { updateVendorProfile, updateVendorBankInfo } from '../../services/auth'
import { StatusChip } from '../../components/shared/StatusChip'
import { StatCardSkeleton } from '../../components/shared/ShimmerSkeleton'
import { useCountUp } from '../../hooks/useCountUp'
import type { Listing, Order } from '../../types'
import { Package, ShoppingBag, TrendingUp, Star, QrCode, Wand2, PlusCircle, Pencil, Check, X, Zap, BarChart2, PieChart, Target } from 'lucide-react'
import { VN_BANKS } from '../../data/vnBanks'

const RevenueChart = lazy(() => import('../../components/shared/RevenueChart'))
const DailyRevenueChart = lazy(() => import('../../components/shared/DailyRevenueChart'))
const CategorySalesChart = lazy(() => import('../../components/shared/CategorySalesChart'))
const SellThroughChart = lazy(() => import('../../components/shared/SellThroughChart'))

function AnimatedStat({ value, prefix = '', suffix = '', className = '' }: {
  value: number; prefix?: string; suffix?: string; className?: string
}) {
  const count = useCountUp(value, 1000)
  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{count.toLocaleString('vi-VN')}{suffix}
    </span>
  )
}

export default function VendorDashboardPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const [editingProfile, setEditingProfile] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [editingBank, setEditingBank] = useState(false)
  const [bankName, setBankName] = useState('')
  const [bankBin, setBankBin] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [savingBank, setSavingBank] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    setStoreName(userProfile.storeName ?? userProfile.displayName ?? '')
    setAddress(userProfile.address ?? '')
    setStoreDescription(userProfile.storeDescription ?? '')
    setBankName(userProfile.bankName ?? '')
    setBankBin(userProfile.bankBin ?? '')
    setBankAccount(userProfile.bankAccount ?? '')
    setBankAccountName(userProfile.bankAccountName ?? '')
    const unsub = subscribeToVendorListings(userProfile.uid, d => {
      setListings(d)
      setDataLoaded(true)
    })
    getVendorOrders(userProfile.uid).then(setOrders)
    return unsub
  }, [userProfile])

  const handleSaveProfile = async () => {
    if (!userProfile || !storeName.trim()) return
    setSavingProfile(true)
    try {
      await updateVendorProfile(userProfile.uid, {
        storeName: storeName.trim(),
        address: address.trim(),
        storeDescription: storeDescription.trim(),
      })
      setEditingProfile(false)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveBankInfo = async () => {
    if (!userProfile) return
    setSavingBank(true)
    try {
      await updateVendorBankInfo(userProfile.uid, bankName.trim(), bankBin.trim(), bankAccount.trim(), bankAccountName.trim())
      setEditingBank(false)
    } finally {
      setSavingBank(false)
    }
  }

  const revenue = orders
    .filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const activeListings = listings.filter(l => l.status === 'active').length
  const pendingPickups = orders.filter(o => o.status === 'paid').length
  const ratings = orders.reduce<number[]>((acc, o) => {
    if ((o as any).rating) acc.push((o as any).rating as number)
    return acc
  }, [])
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

  const recentOrders = orders.slice(0, 5)

  // Revenue chart data (last 14 orders with cumulative-ish data)
  const chartData = orders.slice(-14).map((o, i) => ({
    i: i + 1,
    revenue: o.totalPrice,
  }))

  // Daily revenue — last 30 days
  const dailyRevenue = (() => {
    const days: Record<string, { day: string; revenue: number; orders: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
      days[key] = { day: key, revenue: 0, orders: 0 }
    }
    orders
      .filter(o => o.status === 'paid' || o.status === 'picked_up')
      .forEach(o => {
        const d = new Date(o.createdAt.seconds * 1000)
        const key = d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        if (days[key]) {
          days[key].revenue += o.totalPrice
          days[key].orders += 1
        }
      })
    return Object.values(days)
  })()

  // Revenue by category (from listings sold qty × price)
  const categorySales = (() => {
    const cat: Record<string, number> = {}
    listings.forEach(l => {
      const sold = l.quantityTotal - l.quantityRemaining
      if (sold > 0) cat[l.category] = (cat[l.category] ?? 0) + sold * l.price
    })
    return Object.entries(cat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  })()

  // Sell-through rate per listing (top 6 by activity)
  const sellThrough = listings
    .filter(l => l.quantityTotal > 0)
    .map(l => ({
      name: l.title.length > 22 ? l.title.slice(0, 20) + '…' : l.title,
      rate: Math.round(((l.quantityTotal - l.quantityRemaining) / l.quantityTotal) * 100),
      remaining: l.quantityRemaining,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6)

  const statCards = [
    {
      label: t('dashboard.revenue'),
      numericValue: revenue,
      displayValue: null,
      suffix: ' đ',
      icon: TrendingUp,
      color: 'text-emerald-400',
      glow: 'rgba(52,211,153,0.2)',
      bg: 'from-emerald-500/10 to-transparent',
    },
    {
      label: t('dashboard.activeListings'),
      numericValue: activeListings,
      displayValue: null,
      suffix: '',
      icon: Package,
      color: 'text-primary',
      glow: 'rgba(73,75,214,0.2)',
      bg: 'from-primary/10 to-transparent',
    },
    {
      label: t('dashboard.pending'),
      numericValue: pendingPickups,
      displayValue: null,
      suffix: '',
      icon: ShoppingBag,
      color: 'text-tertiary',
      glow: 'rgba(255,185,95,0.2)',
      bg: 'from-tertiary/10 to-transparent',
    },
    {
      label: t('dashboard.avgRating'),
      numericValue: Math.round(avgRating * 10),
      displayValue: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '–',
      suffix: '',
      icon: Star,
      color: 'text-yellow-400',
      glow: 'rgba(250,204,21,0.2)',
      bg: 'from-yellow-400/10 to-transparent',
    },
  ]

  const inputCls = 'w-full bg-surface-container-high/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none input-glow transition-all'

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-tertiary" />
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Vendor Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface">
            {t('dashboard.title', { store: userProfile?.storeName ?? userProfile?.displayName })}
          </h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {!dataLoaded
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ label, numericValue, displayValue, suffix, icon: Icon, color, glow, bg }, idx) => (
          <div
            key={label}
            className="relative glass glow-border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden card-hover animate-fade-in-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Bg gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${bg} pointer-events-none`} />
            {/* Glow circle */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-60 pointer-events-none"
              style={{ background: glow }} />

            <div className="relative flex items-center justify-between">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} bg-current/10`}
                style={{ background: glow }}>
                <Icon size={15} className={color} />
              </div>
            </div>

            <div className="relative">
              {displayValue ? (
                <span className={`text-2xl font-black ${color}`}>{displayValue}</span>
              ) : (
                <span className={`text-2xl font-black ${color}`}>
                  <AnimatedStat value={numericValue} suffix={suffix} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass glow-border rounded-2xl p-5 animate-fade-in-up-delay-1">
          <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            {t('dashboard.revenueChart')}
          </h2>
          <Suspense fallback={<div className="h-[140px] animate-pulse bg-white/5 rounded-xl" />}>
            <RevenueChart data={chartData} />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="glass glow-border rounded-2xl p-5 flex flex-col gap-3 animate-fade-in-up-delay-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Zap size={14} className="text-tertiary" />
            {t('dashboard.quickActions')}
          </h2>
          {[
            { to: '/vendor/compose', label: t('nav.compose'), icon: Wand2, cls: 'from-secondary-container/20 to-transparent border-secondary-token/20 text-secondary-token hover:border-secondary-token/40' },
            { to: '/vendor/listings/new', label: t('listing.new'), icon: PlusCircle, cls: 'from-primary/15 to-transparent border-primary/25 text-primary hover:border-primary/50' },
            { to: '/vendor/scan', label: t('nav.scanQR'), icon: QrCode, cls: 'from-white/3 to-transparent border-white/8 text-on-surface-variant hover:border-white/15' },
          ].map(({ to, label, icon: Icon, cls }) => (
            <Link
              key={to}
              to={to}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-br font-semibold text-sm transition-all duration-200 hover:scale-[1.02] card-hover ${cls}`}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Analytics Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-primary" />
          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Analytics</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Daily Revenue + Orders (last 7 days) */}
          <div className="lg:col-span-3 glass glow-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              Revenue & Orders — Last 30 Days
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">Bars = revenue (đ) · Line = order count</p>
            <Suspense fallback={<div className="h-[200px] animate-pulse bg-white/5 rounded-xl" />}>
              <DailyRevenueChart data={dailyRevenue} />
            </Suspense>
          </div>

          {/* Revenue by Category */}
          <div className="glass glow-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
              <PieChart size={14} className="text-purple-400" />
              Revenue by Category
            </h2>
            <p className="text-xs text-on-surface-variant mb-3">Estimated from sold quantity × listing price</p>
            <Suspense fallback={<div className="h-[180px] animate-pulse bg-white/5 rounded-xl" />}>
              <CategorySalesChart data={categorySales} />
            </Suspense>
          </div>

          {/* Sell-through Rate */}
          <div className="lg:col-span-2 glass glow-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
              <Target size={14} className="text-amber-400" />
              Sell-through Rate by Listing
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              <span className="text-emerald-400 font-semibold">Green ≥ 80%</span>
              &ensp;·&ensp;<span className="text-indigo-400 font-semibold">Blue ≥ 50%</span>
              &ensp;·&ensp;<span className="text-amber-400 font-semibold">Amber ≥ 25%</span>
              &ensp;·&ensp;<span className="text-rose-400 font-semibold">Red = high waste</span>
            </p>
            <Suspense fallback={<div className="h-[200px] animate-pulse bg-white/5 rounded-xl" />}>
              <SellThroughChart data={sellThrough} />
            </Suspense>
          </div>

        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass glow-border rounded-2xl overflow-hidden animate-fade-in-up-delay-2">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <ShoppingBag size={14} className="text-primary" />
            {t('dashboard.recentOrders')}
          </h2>
          <Link to="/vendor/orders" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-on-surface-variant text-sm">
            <ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />
            {t('dashboard.noOrders')}
          </div>
        ) : (
          <ul>
            {recentOrders.map((order, i) => (
              <li
                key={order.id}
                className={`px-5 py-3.5 flex items-center gap-4 transition-colors hover:bg-white/3 ${
                  i < recentOrders.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-semibold truncate">{order.listingTitle}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
                </div>
                <span className="text-primary font-bold text-sm shrink-0">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                <StatusChip variant={order.status === 'paid' ? 'primary' : order.status === 'picked_up' ? 'emerald' : 'slate'}>
                  {t(`order.status_${order.status}`)}
                </StatusChip>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Store Settings */}
      <div className="glass glow-border rounded-2xl overflow-hidden animate-fade-in-up-delay-3">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">{t('dashboard.storeSettings', 'Store Settings')}</h2>
          {!editingProfile ? (
            <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 text-primary text-xs hover:text-primary/80 transition-colors font-semibold">
              <Pencil size={12} /> {t('common.edit', 'Edit')}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingProfile(false); setStoreName(userProfile?.storeName ?? ''); setAddress(userProfile?.address ?? ''); setStoreDescription(userProfile?.storeDescription ?? '') }}
                className="flex items-center gap-1 text-on-surface-variant text-xs hover:text-on-surface transition-colors"
              >
                <X size={13} /> {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !storeName.trim()}
                className="flex items-center gap-1 gradient-bg text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:opacity-90 glow-primary-sm"
              >
                <Check size={13} /> {savingProfile ? t('listing.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
            </div>
          )}
        </div>
        <div className="p-5">
          {editingProfile ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.storeName', 'Store name')} *</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.address', 'Address')}</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.storeDescription', 'Description')}</label>
                <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: t('vendor.storeName', 'Store name'), value: userProfile?.storeName },
                { label: t('vendor.address', 'Address'), value: userProfile?.address },
                { label: t('vendor.storeDescription', 'Description'), value: userProfile?.storeDescription },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</span>
                  <span className="text-sm text-on-surface">{value ?? <span className="text-outline italic">Not set</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Account Info */}
      <div className="glass glow-border rounded-2xl overflow-hidden animate-fade-in-up-delay-3">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-on-surface">{t('vendor.bankInfo', 'Bank Account Info')}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('vendor.bankInfoSub', 'Customers see this when they choose bank transfer')}</p>
          </div>
          {!editingBank ? (
            <button onClick={() => setEditingBank(true)} className="flex items-center gap-1.5 text-primary text-xs hover:text-primary/80 transition-colors font-semibold shrink-0">
              <Pencil size={12} /> {t('vendor.editBankInfo', 'Edit')}
            </button>
          ) : (
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => { setEditingBank(false); setBankName(userProfile?.bankName ?? ''); setBankBin(userProfile?.bankBin ?? ''); setBankAccount(userProfile?.bankAccount ?? ''); setBankAccountName(userProfile?.bankAccountName ?? '') }}
                className="flex items-center gap-1 text-on-surface-variant text-xs hover:text-on-surface transition-colors"
              >
                <X size={13} /> {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveBankInfo}
                disabled={savingBank}
                className="flex items-center gap-1 gradient-bg text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:opacity-90 glow-primary-sm"
              >
                <Check size={13} /> {savingBank ? t('listing.saving', 'Saving…') : t('vendor.saveBankInfo', 'Save Bank Info')}
              </button>
            </div>
          )}
        </div>
        <div className="p-5">
          {editingBank ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.bankName', 'Bank')}</label>
                <select
                  value={bankBin}
                  onChange={e => {
                    const bank = VN_BANKS.find(b => b.bin === e.target.value)
                    setBankBin(e.target.value)
                    setBankName(bank?.name ?? '')
                  }}
                  className={inputCls}
                >
                  <option value="">— Select your bank —</option>
                  {VN_BANKS.map(b => (
                    <option key={b.bin} value={b.bin}>{b.name} ({b.shortName})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.bankAccount', 'Account Number')}</label>
                <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="e.g. 1234567890" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('vendor.bankAccountName', 'Account Holder Name')}</label>
                <input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="e.g. NGUYEN VAN A" className={inputCls} />
              </div>
            </div>
          ) : userProfile?.bankAccount ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: t('vendor.bankName', 'Bank'), value: userProfile.bankName },
                { label: t('vendor.bankAccount', 'Account Number'), value: userProfile.bankAccount },
                { label: t('vendor.bankAccountName', 'Account Holder Name'), value: userProfile.bankAccountName },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</span>
                  <span className="text-sm text-on-surface font-mono">{value ?? <span className="text-outline italic font-sans">Not set</span>}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                <Pencil size={14} className="text-yellow-400" />
              </div>
              <p className="text-sm text-on-surface-variant">{t('vendor.bankInfoNotSet', 'Not set — customers can\'t use bank transfer')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
