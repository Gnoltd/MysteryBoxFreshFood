import type { Listing } from '../types'

export type SortOption = 'newest' | 'price_asc' | 'price_desc'

export interface FilterState {
  search: string
  minPrice: string
  maxPrice: string
  availableNow: boolean
  sort: SortOption
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  minPrice: '',
  maxPrice: '',
  availableNow: false,
  sort: 'newest',
}

export function filterListings(listings: Listing[], filters: FilterState): Listing[] {
  const now = Date.now()
  let result = listings.filter(l => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !l.title.toLowerCase().includes(q) &&
        !l.description.toLowerCase().includes(q)
      ) return false
    }
    if (filters.minPrice && l.price < Number(filters.minPrice)) return false
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false
    if (filters.availableNow) {
      const start = l.pickupStart.seconds * 1000
      const end = l.pickupEnd.seconds * 1000
      if (now < start || now > end) return false
    }
    return true
  })
  if (filters.sort === 'price_asc') result = result.toSorted((a, b) => a.price - b.price)
  if (filters.sort === 'price_desc') result = result.toSorted((a, b) => b.price - a.price)
  return result
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== '' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.availableNow ||
    filters.sort !== 'newest'
  )
}
