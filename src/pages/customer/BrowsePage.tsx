import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToActiveListings } from '../../services/listings'
import { useDailyBoxStatus } from '../../hooks/useDailyBoxStatus'
import { getListingRatings } from '../../services/reviews'
import { MysteryCard } from '../../components/shared/MysteryCard'
import { MysteryCardSkeleton } from '../../components/shared/ShimmerSkeleton'
import { Search, SlidersHorizontal, X, ChevronDown, Sparkles } from 'lucide-react'
import type { Listing, ListingCategory } from '../../types'

const CATEGORIES: { value: ListingCategory | 'all'; label: string; icon?: string; emoji?: string }[] = [
  { value: 'all',        label: 'All',        emoji: '🛒' },
  { value: 'bakery',     label: 'Bakery',     icon: '/images/icons/bakery.png' },
  { value: 'fruit',      label: 'Fruit',      icon: '/images/icons/fruit.png' },
  { value: 'vegetables', label: 'Vegetables', icon: '/images/icons/vegetables.png' },
  { value: 'dairy',      label: 'Dairy',      icon: '/images/icons/dairy.png' },
  { value: 'meat',       label: 'Meat',       icon: '/images/icons/meat.png' },
  { value: 'drinks',     label: 'Drinks',     icon: '/images/icons/drinks.png' },
  { value: 'other',      label: 'Other',      icon: '/images/icons/other.png' },
]

type SortKey = 'top_rated' | 'newest' | 'price_asc' | 'price_desc' | 'discount'

// Typewriter hook for search placeholder
function usePlaceholderTypewriter(phrases: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const current = phrases[phraseIdx]
    const tick = () => {
      if (!deleting) {
        if (charIdx < current.length) {
          setText(current.slice(0, charIdx + 1))
          setCharIdx(i => i + 1)
          timeoutRef.current = setTimeout(tick, speed)
        } else {
          timeoutRef.current = setTimeout(() => setDeleting(true), pause)
        }
      } else {
        if (charIdx > 0) {
          setText(current.slice(0, charIdx - 1))
          setCharIdx(i => i - 1)
          timeoutRef.current = setTimeout(tick, speed / 2)
        } else {
          setDeleting(false)
          setPhraseIdx(i => (i + 1) % phrases.length)
          timeoutRef.current = setTimeout(tick, 300)
        }
      }
    }
    timeoutRef.current = setTimeout(tick, 100)
    return () => clearTimeout(timeoutRef.current)
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause])

  return text
}

export default function BrowsePage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({})
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('top_rated')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const placeholder = usePlaceholderTypewriter([
    'Search fresh bakery…',
    'Find local vegetables…',
    'Discover mystery boxes…',
    'Organic dairy deals…',
  ])

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      const now = Date.now() / 1000
      const live = data.filter(l => l.pickupEnd.seconds > now)
      setListings(live)
      setLoading(false)
      if (live.length > 0) {
        getListingRatings(live.map(l => l.id)).then(setRatings)
      }
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
      if (sortBy === 'top_rated') {
        const ra = ratings[a.id]?.avg ?? 0
        const rb = ratings[b.id]?.avg ?? 0
        return rb !== ra ? rb - ra : b.createdAt.seconds - a.createdAt.seconds
      }
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'discount') return (1 - b.price / b.originalPrice) - (1 - a.price / a.originalPrice)
      return b.createdAt.seconds - a.createdAt.seconds
    })
  }, [listings, ratings, category, searchText, minPrice, maxPrice, availableOnly, sortBy])

  const inputCls = 'w-full bg-surface-container-high/50 border border-white/10 rounded-xl h-10 px-3 text-sm text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all'
  const firstName = userProfile?.displayName?.split(' ')[0] ?? ''
  const dailyStatus = useDailyBoxStatus(userProfile?.uid)

  return (
    <div className="animate-fade-in-up">
      {/* ── Hero Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-tertiary animate-pulse" />
          <span className="text-xs text-on-surface-variant font-medium tracking-wider uppercase">Fresh Deals Today</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-on-surface leading-tight">
          {t('browse.greeting', { name: firstName }) || `Hey ${firstName} 👋`}
        </h1>
        <p className="text-on-surface-variant text-base mt-2 max-w-lg">{t('browse.subtitle')}</p>

        {/* Daily box quota badge */}
        {!dailyStatus.loading && (
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            dailyStatus.remaining === 0
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : dailyStatus.remaining <= 1
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-primary/10 border-primary/30 text-primary'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              dailyStatus.remaining === 0 ? 'bg-red-400' : dailyStatus.remaining <= 1 ? 'bg-amber-400' : 'bg-primary'
            }`} />
            {dailyStatus.remaining === 0
              ? t('browse.noBoxesLeft')
              : t('browse.boxesLeft', { n: dailyStatus.remaining, total: dailyStatus.limit })}
          </div>
        )}
      </div>

      {/* ── Live Search Bar ── */}
      <div className={`relative mb-6 transition-all duration-300 ${searchFocused ? 'scale-[1.01]' : ''}`}>
        <div className={`relative flex items-center glass glow-border rounded-2xl overflow-hidden transition-all duration-300 ${
          searchFocused ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/10' : ''
        }`}>
          <Search size={18} className={`absolute left-4 transition-colors ${searchFocused ? 'text-primary' : 'text-outline'}`} />
          <input
            type="text"
            placeholder={!searchFocused && !searchText ? placeholder : t('browse.searchPlaceholder')}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent h-14 pl-12 pr-32 text-base text-on-surface placeholder:text-outline/70 focus:outline-none"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-20 text-outline hover:text-on-surface transition-colors"
            >
              <X size={16} />
            </button>
          )}
          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen(f => !f)}
            className={`absolute right-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filtersOpen ? 'gradient-bg text-white' : 'glass text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Category Chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`relative shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in-up overflow-hidden ${
              category === cat.value
                ? 'border-transparent text-white'
                : 'glass border-white/10 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {category === cat.value && (
              <span className="absolute inset-0 gradient-bg" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.icon && <img src={cat.icon} alt="" className="w-5 h-5 object-contain" />}
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Collapsible Filter Panel ── */}
      <div className={`overflow-hidden transition-all duration-300 ${filtersOpen ? 'max-h-96 mb-6' : 'max-h-0'}`}>
        <div className="glass glow-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Price range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('browse.priceRange')}</label>
            <div className="flex gap-2">
              <input type="number" placeholder={t('browse.min')} value={minPrice}
                onChange={e => setMinPrice(e.target.value)} className={inputCls} />
              <input type="number" placeholder={t('browse.max')} value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{t('browse.sortBy')}</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className={inputCls}
            >
              <option value="top_rated">{t('browse.sortTopRated', 'Top Rated')}</option>
              <option value="newest">{t('browse.sortNewest')}</option>
              <option value="price_asc">{t('browse.sortPriceAsc')}</option>
              <option value="price_desc">{t('browse.sortPriceDesc')}</option>
              <option value="discount">{t('browse.sortDiscount')}</option>
            </select>
          </div>

          {/* Available only */}
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <div
                onClick={() => setAvailableOnly(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer ${availableOnly ? 'gradient-bg' : 'bg-surface-container-high border border-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${availableOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              {t('browse.availableOnly')}
            </label>
          </div>

          {/* Clear filters */}
          {(minPrice || maxPrice || availableOnly || searchText) && (
            <div className="flex items-end">
              <button
                onClick={() => { setMinPrice(''); setMaxPrice(''); setAvailableOnly(false); setSearchText('') }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <X size={12} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results summary ── */}
      {!loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-on-surface-variant">
            <span className="text-on-surface font-semibold">{filtered.length}</span> listings found
          </p>
        </div>
      )}

      {/* ── Card Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MysteryCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant animate-fade-in-up">
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mb-4 animate-float">
            <img src="/images/icons/single-item.png" alt="" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-lg font-semibold text-on-surface mb-1">No listings found</p>
          <p className="text-sm">{t('browse.noListings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((listing, i) => (
            <div key={listing.id} style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
              <MysteryCard
                listing={listing}
                rating={ratings[listing.id]}
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
