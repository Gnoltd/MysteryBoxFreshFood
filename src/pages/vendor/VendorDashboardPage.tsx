import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { getVendorOrders } from '../../services/orders'
import { StatusChip } from '../../components/shared/StatusChip'
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
    </div>
  )
}
