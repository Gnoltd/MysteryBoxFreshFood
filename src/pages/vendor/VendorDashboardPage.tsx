import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToVendorListings } from '../../services/listings'
import { subscribeToVendorOrders } from '../../services/orders'
import { updateVendorBankInfo } from '../../services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VIETNAMESE_BANKS } from '../../constants/banks'
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
  const [editingBank, setEditingBank] = useState(false)
  const [selectedBin, setSelectedBin] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankSaving, setBankSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const u1 = subscribeToVendorListings(currentUser.uid, setListings)
    const u2 = subscribeToVendorOrders(currentUser.uid, setOrders)
    return () => { u1(); u2() }
  }, [currentUser])

  useEffect(() => {
    if (userProfile) {
      setSelectedBin(userProfile.bankBin ?? '')
      setBankAccount(userProfile.bankAccount ?? '')
      setBankAccountName(userProfile.bankAccountName ?? '')
    }
  }, [userProfile])

  const activeListings = listings.filter(l => l.status === 'active').length
  const pendingOrders = orders.filter(o => ['paid', 'pending_cod', 'pending_bank_transfer'].includes(o.status))
  const revenue = orders
    .filter(o => o.status === 'paid' || o.status === 'picked_up')
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const handleBankSave = async () => {
    if (!currentUser) return
    const bank = VIETNAMESE_BANKS.find(b => b.bin === selectedBin)
    if (!bank || !bankAccount) return
    setBankSaving(true)
    try {
      await updateVendorBankInfo(currentUser.uid, bank.name, bank.bin, bankAccount, bankAccountName)
      setEditingBank(false)
    } finally {
      setBankSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">{t('vendor.dashboard')}</h1>
      <p className="text-slate-400 mb-8">{t('vendor.welcome')}, {userProfile?.displayName}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label={t('vendor.activeListings')} value={activeListings} />
        <StatCard label={t('vendor.pendingPickups')} value={pendingOrders.length} sub={t('vendor.awaitingQR')} />
        <StatCard label={t('vendor.totalRevenue')} value={`${revenue.toLocaleString('vi-VN')} đ`} />
      </div>

      <div className="mb-8">
        <h2 className="text-white font-semibold mb-3">{t('vendor.recentOrders')}</h2>
        {orders.slice(0, 5).map(o => (
          <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 text-sm">
            <span className="text-white">{o.listingTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              o.status === 'paid' ? 'bg-green-900 text-green-300'
              : o.status === 'picked_up' ? 'bg-slate-700 text-slate-300'
              : o.status === 'pending_cod' ? 'bg-orange-900 text-orange-300'
              : o.status === 'pending_bank_transfer' ? 'bg-blue-900 text-blue-300'
              : 'bg-yellow-900 text-yellow-300'
            }`}>
              {o.status === 'pending_cod' ? 'COD' : o.status === 'pending_bank_transfer' ? 'BANK' : o.status.replace('_', ' ')}
            </span>
          </div>
        ))}
        {orders.length === 0 && <p className="text-slate-500 text-sm">{t('vendor.noOrders')}</p>}
      </div>

      {/* Bank account info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-semibold">{t('vendor.bankInfo')}</h2>
          {!editingBank && (
            <button onClick={() => setEditingBank(true)} className="text-indigo-400 hover:text-indigo-300 text-sm">
              {t('vendor.editBankInfo')}
            </button>
          )}
        </div>
        <p className="text-slate-500 text-xs mb-4">{t('vendor.bankInfoSub')}</p>

        {!editingBank ? (
          userProfile?.bankAccount ? (
            <div className="space-y-2 text-sm">
              {userProfile.bankName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('vendor.bankName')}</span>
                  <span className="text-white">{userProfile.bankName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">{t('vendor.bankAccount')}</span>
                <span className="text-white font-mono font-bold">{userProfile.bankAccount}</span>
              </div>
              {userProfile.bankAccountName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('vendor.bankAccountName')}</span>
                  <span className="text-white">{userProfile.bankAccountName}</span>
                </div>
              )}
              {userProfile.bankBin && (
                <p className="text-green-400 text-xs pt-1">✓ VietQR enabled — customers can pay with one tap</p>
              )}
            </div>
          ) : (
            <p className="text-yellow-400 text-sm">{t('vendor.bankInfoNotSet')}</p>
          )
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">{t('vendor.bankName')}</Label>
              <select
                value={selectedBin}
                onChange={e => setSelectedBin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Chọn ngân hàng —</option>
                {VIETNAMESE_BANKS.map(b => (
                  <option key={b.bin} value={b.bin}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">{t('vendor.bankAccount')}</Label>
              <Input
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
                placeholder="Số tài khoản"
                className="bg-slate-800 border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">{t('vendor.bankAccountName')}</Label>
              <Input
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value)}
                placeholder="Tên chủ tài khoản"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleBankSave}
                disabled={bankSaving || !selectedBin || !bankAccount}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              >
                {bankSaving ? t('vendor.saving') : t('vendor.saveBankInfo')}
              </Button>
              <Button
                onClick={() => setEditingBank(false)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
              >
                {t('vendor.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
