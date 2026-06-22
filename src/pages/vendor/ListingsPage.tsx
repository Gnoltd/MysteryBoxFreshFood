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
