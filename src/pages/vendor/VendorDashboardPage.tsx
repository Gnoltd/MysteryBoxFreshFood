import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { subscribeToVendorOrders } from '../../services/orders'
import type { Listing, Order } from '../../types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function VendorDashboardPage() {
  const { t } = useTranslation()
  const { currentUser, userProfile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!currentUser) return
    const u1 = subscribeToVendorListings(currentUser.uid, setListings)
    const u2 = subscribeToVendorOrders(currentUser.uid, setOrders)
    return () => { u1(); u2() }
  }, [currentUser])

  const activeListings = listings.filter(l => l.status === 'active').length
  const paidOrders = orders.filter(o => o.status === 'paid')
  const revenue = orders.filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">{t('vendor.dashboard')}</h1>
      <p className="text-slate-400 mb-8">{t('vendor.welcome')}, {userProfile?.displayName}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label={t('vendor.activeListings')} value={activeListings} />
        <StatCard label={t('vendor.pendingPickups')} value={paidOrders.length} sub={t('vendor.awaitingQR')} />
        <StatCard label={t('vendor.totalRevenue')} value={`${revenue.toLocaleString('vi-VN')} đ`} />
      </div>
      <div>
        <h2 className="text-white font-semibold mb-3">{t('vendor.recentOrders')}</h2>
        {orders.slice(0, 5).map(o => (
          <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 text-sm">
            <span className="text-white">{o.listingTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'paid' ? 'bg-green-900 text-green-300' : o.status === 'picked_up' ? 'bg-slate-700 text-slate-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {o.status.replace('_', ' ')}
            </span>
          </div>
        ))}
        {orders.length === 0 && <p className="text-slate-500 text-sm">{t('vendor.noOrders')}</p>}
      </div>
    </div>
  )
}
