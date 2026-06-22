import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { updateVendorProfile } from '../../services/auth'
import { StatusChip } from '../../components/shared/StatusChip'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import type { Listing, Order } from '../../types'
import { Package, ShoppingBag, TrendingUp, Star, QrCode, Wand2, PlusCircle, Pencil, Check, X } from 'lucide-react'

export default function VendorDashboardPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  // Store profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    setStoreName(userProfile.storeName ?? userProfile.displayName ?? '')
    setAddress(userProfile.address ?? '')
    setStoreDescription(userProfile.storeDescription ?? '')
    const unsub = subscribeToVendorListings(userProfile.uid, setListings)
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

  const revenue = orders
    .filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const activeListings = listings.filter(l => l.status === 'active').length
  const pendingPickups = orders.filter(o => o.status === 'paid').length
  const ratings = orders.filter(o => (o as any).rating).map((o: any) => o.rating as number)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–'

  const recentOrders = orders.slice(0, 5)

  const statCards = [
    { label: t('dashboard.revenue'),        value: `${revenue.toLocaleString('vi-VN')} đ`, icon: TrendingUp,  color: 'text-emerald-400' },
    { label: t('dashboard.activeListings'), value: String(activeListings),                  icon: Package,     color: 'text-primary' },
    { label: t('dashboard.pending'),        value: String(pendingPickups),                  icon: ShoppingBag, color: 'text-tertiary' },
    { label: t('dashboard.avgRating'),      value: String(avgRating),                       icon: Star,        color: 'text-primary' },
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

        <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
          <h2 className="text-body-sm font-semibold text-on-surface-variant">{t('dashboard.quickActions')}</h2>
          {[
            { to: '/vendor/compose',      label: t('nav.compose'),  icon: Wand2,      cls: 'bg-secondary-container/20 text-secondary-token border-secondary-token/30' },
            { to: '/vendor/listings/new', label: t('listing.new'),  icon: PlusCircle, cls: 'bg-primary/10 text-primary border-primary/30' },
            { to: '/vendor/scan',         label: t('nav.scanQR'),   icon: QrCode,     cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant' },
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

      {/* Store profile settings */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-body-sm font-semibold text-on-surface">{t('dashboard.storeSettings', 'Store Settings')}</h2>
          {!editingProfile ? (
            <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 text-primary text-body-sm hover:underline">
              <Pencil size={13} /> {t('common.edit', 'Edit')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditingProfile(false); setStoreName(userProfile?.storeName ?? ''); setAddress(userProfile?.address ?? ''); setStoreDescription(userProfile?.storeDescription ?? '') }}
                className="flex items-center gap-1 text-on-surface-variant text-body-sm hover:text-on-surface">
                <X size={14} /> {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleSaveProfile} disabled={savingProfile || !storeName.trim()}
                className="flex items-center gap-1 text-primary text-body-sm font-semibold hover:underline disabled:opacity-40">
                <Check size={14} /> {savingProfile ? t('listing.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-3">
          {editingProfile ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('vendor.storeName', 'Store name')} *</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)}
                  className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('vendor.address', 'Address')}</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant">{t('vendor.storeDescription', 'Store description')}</label>
                <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} rows={3}
                  className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-on-surface-variant">{t('vendor.storeName', 'Store name')}</span>
                <span className="text-body-sm text-on-surface font-semibold">{userProfile?.storeName ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-on-surface-variant">{t('vendor.address', 'Address')}</span>
                <span className="text-body-sm text-on-surface">{userProfile?.address ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-on-surface-variant">{t('vendor.storeDescription', 'Description')}</span>
                <span className="text-body-sm text-on-surface">{userProfile?.storeDescription ?? '—'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
