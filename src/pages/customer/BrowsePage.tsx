import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { subscribeToActiveListings } from '../../services/listings'
import { ListingCard } from '../../components/shared/ListingCard'
import { filterListings, hasActiveFilters, DEFAULT_FILTERS } from '../../utils/filterListings'
import type { Listing, ListingCategory } from '../../types'
import type { FilterState } from '../../utils/filterListings'

const CATEGORY_VALUES: (ListingCategory | 'all')[] = ['all', 'bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

export default function BrowsePage() {
  const { t } = useTranslation()
  const [listings, setListings] = useState<Listing[]>([])
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const categoryFiltered = category === 'all' ? listings : listings.filter(l => l.category === category)
  const displayed = filterListings(categoryFiltered, filters)
  const activeFilters = hasActiveFilters(filters)

  const clearAll = () => setFilters(DEFAULT_FILTERS)
  const clearFilter = (key: keyof FilterState) =>
    setFilters(f => ({ ...f, [key]: DEFAULT_FILTERS[key] }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('browse.title')}</h1>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORY_VALUES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {c === 'all' ? t('browse.all') : t(`categories.${c}`)}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
        <input
          type="text"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder={t('filter.search_placeholder')}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="number"
            value={filters.minPrice}
            onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
            placeholder={t('filter.price_min')}
            className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-500 text-sm">—</span>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
            placeholder={t('filter.price_max')}
            className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="flex items-center gap-2 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={filters.availableNow}
              onChange={e => setFilters(f => ({ ...f, availableNow: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <span className="text-slate-300 text-sm">{t('filter.available_now')}</span>
          </label>
          <select
            value={filters.sort}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
            className="ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">{t('filter.sort_newest')}</option>
            <option value="price_asc">{t('filter.sort_price_asc')}</option>
            <option value="price_desc">{t('filter.sort_price_desc')}</option>
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters && (
        <div className="flex gap-2 flex-wrap items-center mb-4">
          <span className="text-slate-500 text-xs">{t('filter.active_filters')}:</span>
          {filters.search && (
            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              "{filters.search}" <button onClick={() => clearFilter('search')} className="hover:text-white">×</button>
            </span>
          )}
          {filters.minPrice && (
            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              ≥{Number(filters.minPrice).toLocaleString('vi-VN')}đ <button onClick={() => clearFilter('minPrice')} className="hover:text-white">×</button>
            </span>
          )}
          {filters.maxPrice && (
            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              ≤{Number(filters.maxPrice).toLocaleString('vi-VN')}đ <button onClick={() => clearFilter('maxPrice')} className="hover:text-white">×</button>
            </span>
          )}
          {filters.availableNow && (
            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              {t('filter.available_now')} <button onClick={() => clearFilter('availableNow')} className="hover:text-white">×</button>
            </span>
          )}
          {filters.sort !== 'newest' && (
            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              {t(`filter.sort_${filters.sort}`)} <button onClick={() => clearFilter('sort')} className="hover:text-white">×</button>
            </span>
          )}
          <button onClick={clearAll} className="text-slate-500 hover:text-white text-xs ml-1 underline">
            {t('filter.clear_all')}
          </button>
        </div>
      )}

      {loading && <p className="text-slate-400">{t('browse.loading')}</p>}
      {!loading && displayed.length === 0 && <p className="text-slate-400">{t('browse.noListings')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
      </div>
    </div>
  )
}
