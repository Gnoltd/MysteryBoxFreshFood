import { useEffect, useState } from 'react'
import { subscribeToActiveListings } from '../../services/listings'
import { ListingCard } from '../../components/shared/ListingCard'
import type { Listing, ListingCategory } from '../../types'

const CATEGORIES: { value: ListingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'rice', label: 'Rice' },
  { value: 'noodles', label: 'Noodles' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'other', label: 'Other' },
]

export default function BrowsePage() {
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
      <h1 className="text-2xl font-bold text-white mb-6">Browse Surplus Boxes</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c.value ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {c.label}
          </button>
        ))}
      </div>
      {loading && <p className="text-slate-400">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="text-slate-400">No listings available right now.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => <ListingCard key={l.id} listing={l} href={`/listing/${l.id}`} />)}
      </div>
    </div>
  )
}
