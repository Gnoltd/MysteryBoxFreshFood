import type { Order, Listing } from '../types'

const PAID_STATUSES = new Set(['paid', 'picked_up'])

export interface DayRevenue {
  date: string
  revenue: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface TopListing {
  listing: Listing
  revenue: number
}

export function getRevenueByDay(orders: Order[]): DayRevenue[] {
  const days: Record<string, number> = {}
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days[d.toLocaleDateString('en-CA')] = 0
  }
  for (const o of orders) {
    if (!PAID_STATUSES.has(o.status)) continue
    const d = new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-CA')
    if (d in days) days[d] = (days[d] || 0) + o.totalPrice
  }
  return Object.entries(days).map(([date, revenue]) => ({
    date: date.slice(5),
    revenue,
  }))
}

export function getOrdersByCategory(orders: Order[], listings: Listing[]): CategoryCount[] {
  const listingMap = new Map(listings.map(l => [l.id, l]))
  const counts: Record<string, number> = {}
  for (const o of orders) {
    if (!PAID_STATUSES.has(o.status)) continue
    const cat = listingMap.get(o.listingId)?.category ?? 'other'
    counts[cat] = (counts[cat] || 0) + 1
  }
  return Object.entries(counts).map(([category, count]) => ({ category, count }))
}

export function getTopListing(orders: Order[], listings: Listing[]): TopListing | null {
  if (!orders.length) return null
  const revenue: Record<string, number> = {}
  for (const o of orders) {
    if (!PAID_STATUSES.has(o.status)) continue
    revenue[o.listingId] = (revenue[o.listingId] || 0) + o.totalPrice
  }
  let topId: string | undefined
  let topRev = -Infinity
  for (const [id, rev] of Object.entries(revenue)) {
    if (rev > topRev) { topRev = rev; topId = id }
  }
  if (!topId) return null
  const listing = listings.find(l => l.id === topId)
  if (!listing) return null
  return { listing, revenue: revenue[topId] }
}
