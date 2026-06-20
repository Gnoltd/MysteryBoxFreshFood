import type { Order } from '../types'

export type Volume = 'low' | 'medium' | 'high'

const MULTIPLIERS: Record<Volume, number> = { low: 0.5, medium: 1.0, high: 1.5 }
const WINDOW_DAYS = 14

export function suggestQuantity(orders: Order[], volume: Volume): number {
  const sold = orders.filter(o => o.status === 'paid' || o.status === 'picked_up')
  const avgDailySold = sold.length / WINDOW_DAYS
  return Math.max(1, Math.ceil(avgDailySold * MULTIPLIERS[volume]))
}
