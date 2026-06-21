import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToActiveListings } from '../../services/listings'
import { MysteryCard } from '../../components/shared/MysteryCard'
import type { Listing, ListingCategory } from '../../types'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'bakery',     label: '🥐 Bakery' },
  { value: 'fruit',      label: '🍎 Fruit' },
  { value: 'vegetables', label: '🥦 Vegetables' },
  { value: 'dairy',      label: '🧀 Dairy' },
  { value: 'meat',       label: '🥩 Meat' },
  { value: 'rice',       label: '🍚 Rice' },
  { value: 'noodles',    label: '🍜 Noodles' },
  { value: 'drinks',     label: '🧃 Drinks' },
  { value: 'snacks',     label: '🍿 Snacks' },
  { value: 'other',      label: '📦 Other' },
]

export default function BrowsePage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(
    () => category === 'all' ? listings : listings.filter(l => l.category === category),
    [listings, category]
  )

  return (
    <div>
      {/* Hero greeting */}
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-body-lg">{t('browse.noListings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  )
}
