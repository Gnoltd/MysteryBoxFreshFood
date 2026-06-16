import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { subscribeToActiveListings } from '../../services/listings'
import { ListingCard } from '../../components/shared/ListingCard'
import type { Listing, ListingCategory } from '../../types'

const CATEGORY_VALUES: (ListingCategory | 'all')[] = ['all', 'bakery', 'rice', 'noodles', 'drinks', 'snacks', 'other']

export default function BrowsePage() {
  const { t } = useTranslation()
  const [listings, setListings] = useState<Listing[]>([])
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToActiveListings(data => {
      setListings(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = category === 'all' ? listings : listings.filter(l => l.category === category)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('browse.title')}</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORY_VALUES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {c === 'all' ? t('browse.all') : t(`categories.${c}`)}
          </button>
        ))}
      </div>
      {loading && <p className="text-slate-400">{t('browse.loading')}</p>}
      {!loading && filtered.length === 0 && <p className="text-slate-400">{t('browse.noListings')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
      </div>
    </div>
  )
}
