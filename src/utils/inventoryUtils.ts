import type { InventoryItem } from '../types'

function toMs(ts: { seconds: number; nanoseconds: number }): number {
  return ts.seconds * 1000 + ts.nanoseconds / 1_000_000
}

export function getExpiringItems(items: InventoryItem[], hoursAhead: number): InventoryItem[] {
  const cutoff = Date.now() + hoursAhead * 3600 * 1000
  return items.filter(item => item.bestBefore !== null && toMs(item.bestBefore) <= cutoff)
}

export function expiryLabel(item: InventoryItem): 'today' | 'soon' | 'expired' | null {
  if (!item.bestBefore) return null
  const now = Date.now()
  const ms = toMs(item.bestBefore)
  if (ms < now) return 'expired'
  if (ms < now + 24 * 3600 * 1000) return 'today'
  if (ms < now + 48 * 3600 * 1000) return 'soon'
  return null
}
