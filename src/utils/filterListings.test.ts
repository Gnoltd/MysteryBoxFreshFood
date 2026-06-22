import { describe, test, expect } from 'vitest'
import { filterListings } from './filterListings'
import type { Listing } from '../types'

const ts = (seconds: number) => ({ seconds, nanoseconds: 0 }) as any

const base: Listing = {
  id: '1', vendorId: 'v1', type: 'mystery_box',
  title: 'Bánh mì box', description: 'Fresh bread',
  price: 30000, originalPrice: 60000,
  quantityTotal: 5, quantityRemaining: 3,
  pickupStart: ts(0), pickupEnd: ts(9999999999),
  category: 'bakery', imageUrl: '', status: 'active',
  createdAt: ts(1000),
}

const listings: Listing[] = [
  { ...base, id: '1', title: 'Bánh mì box', price: 30000, category: 'bakery', createdAt: ts(1000) },
  { ...base, id: '2', title: 'Cơm hộp', description: 'Rice lunch', price: 50000, category: 'other', createdAt: ts(2000) },
  { ...base, id: '3', title: 'Trà sữa', description: 'Milk tea', price: 20000, category: 'drinks', createdAt: ts(3000),
    pickupStart: ts(0), pickupEnd: ts(1) },
]

const defaults = { search: '', minPrice: '', maxPrice: '', availableNow: false, sort: 'newest' as const }

describe('filterListings', () => {
  test('returns all listings when no filters applied', () => {
    expect(filterListings(listings, defaults)).toHaveLength(3)
  })

  test('filters by search term in title', () => {
    const result = filterListings(listings, { ...defaults, search: 'bánh' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  test('filters by search term in description', () => {
    const result = filterListings(listings, { ...defaults, search: 'milk' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  test('search is case-insensitive', () => {
    const result = filterListings(listings, { ...defaults, search: 'RICE' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  test('filters by minPrice', () => {
    const result = filterListings(listings, { ...defaults, minPrice: '25000' })
    expect(result).toHaveLength(2)
    expect(result.map(l => l.id)).toContain('1')
    expect(result.map(l => l.id)).toContain('2')
  })

  test('filters by maxPrice', () => {
    const result = filterListings(listings, { ...defaults, maxPrice: '30000' })
    expect(result).toHaveLength(2)
    expect(result.map(l => l.id)).toContain('1')
    expect(result.map(l => l.id)).toContain('3')
  })

  test('availableNow filters out expired pickup windows', () => {
    const result = filterListings(listings, { ...defaults, availableNow: true })
    expect(result).toHaveLength(2)
    expect(result.map(l => l.id)).not.toContain('3')
  })

  test('sort price_asc orders by price ascending', () => {
    const result = filterListings(listings, { ...defaults, sort: 'price_asc' })
    expect(result[0].price).toBe(20000)
    expect(result[2].price).toBe(50000)
  })

  test('sort price_desc orders by price descending', () => {
    const result = filterListings(listings, { ...defaults, sort: 'price_desc' })
    expect(result[0].price).toBe(50000)
    expect(result[2].price).toBe(20000)
  })

  test('sort newest preserves original order', () => {
    const result = filterListings(listings, { ...defaults, sort: 'newest' })
    expect(result.map(l => l.id)).toEqual(['1', '2', '3'])
  })
})
