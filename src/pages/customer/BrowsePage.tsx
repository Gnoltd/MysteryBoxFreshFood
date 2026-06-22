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
  { value: 'drinks',     label: '🧃 Drinks' },
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
