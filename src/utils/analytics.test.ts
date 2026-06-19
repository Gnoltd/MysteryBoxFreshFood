import { describe, test, expect } from 'vitest'
import { getRevenueByDay, getOrdersByCategory, getTopListing } from './analytics'
import type { Order, Listing } from '../types'

const ts = (seconds: number) => ({ seconds, nanoseconds: 0 }) as any

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const DAY = 86400

const baseOrder: Order = {
  id: 'o1', customerId: 'c1', vendorId: 'v1',
  listingId: 'l1', listingTitle: 'Bánh box',
  quantity: 1, totalPrice: 30000,
  status: 'paid', qrCode: 'qr1',
  createdAt: ts(NOW_SECONDS),
}

const baseListing: Listing = {
  id: 'l1', vendorId: 'v1', type: 'mystery_box',
  title: 'Bánh mì box', description: '',
  price: 30000, originalPrice: 60000,
  quantityTotal: 5, quantityRemaining: 3,
  pickupStart: ts(0), pickupEnd: ts(9999999999),
  category: 'bakery', imageUrl: '', status: 'active',
  createdAt: ts(1000),
}

describe('getRevenueByDay', () => {
  test('returns 7 entries', () => {
    const result = getRevenueByDay([])
    expect(result).toHaveLength(7)
  })

  test('sums revenue for today', () => {
    const orders = [
      { ...baseOrder, totalPrice: 30000, createdAt: ts(NOW_SECONDS) },
      { ...baseOrder, id: 'o2', totalPrice: 20000, createdAt: ts(NOW_SECONDS) },
    ]
    const result = getRevenueByDay(orders)
    const today = result[result.length - 1]
    expect(today.revenue).toBe(50000)
  })

  test('ignores orders older than 7 days', () => {
    const old = { ...baseOrder, totalPrice: 99999, createdAt: ts(NOW_SECONDS - 8 * DAY) }
    const result = getRevenueByDay([old])
    expect(result.every(d => d.revenue === 0)).toBe(true)
  })

  test('ignores pending and cancelled orders', () => {
    const pending = { ...baseOrder, status: 'pending' as const }
    const result = getRevenueByDay([pending])
    expect(result.every(d => d.revenue === 0)).toBe(true)
  })
})

describe('getOrdersByCategory', () => {
  test('returns empty array when no orders', () => {
    expect(getOrdersByCategory([], [])).toHaveLength(0)
  })

  test('counts orders by listing category', () => {
    const orders = [
      { ...baseOrder, listingId: 'l1' },
      { ...baseOrder, id: 'o2', listingId: 'l1' },
      { ...baseOrder, id: 'o3', listingId: 'l2' },
    ]
    const listings = [
      { ...baseListing, id: 'l1', category: 'bakery' as const },
      { ...baseListing, id: 'l2', category: 'rice' as const },
    ]
    const result = getOrdersByCategory(orders, listings)
    const bakery = result.find(r => r.category === 'bakery')
    const rice = result.find(r => r.category === 'rice')
    expect(bakery?.count).toBe(2)
    expect(rice?.count).toBe(1)
  })
})

describe('getTopListing', () => {
  test('returns null when no orders', () => {
    expect(getTopListing([], [])).toBeNull()
  })

  test('returns listing with highest total revenue', () => {
    const orders = [
      { ...baseOrder, listingId: 'l1', totalPrice: 30000 },
      { ...baseOrder, id: 'o2', listingId: 'l2', totalPrice: 50000 },
      { ...baseOrder, id: 'o3', listingId: 'l2', totalPrice: 50000 },
    ]
    const listings = [
      { ...baseListing, id: 'l1', title: 'Bánh box' },
      { ...baseListing, id: 'l2', title: 'Cơm hộp' },
    ]
    const result = getTopListing(orders, listings)
    expect(result?.listing.id).toBe('l2')
    expect(result?.revenue).toBe(100000)
  })
})
