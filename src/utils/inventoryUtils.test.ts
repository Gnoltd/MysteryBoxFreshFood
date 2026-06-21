import { describe, test, expect } from 'vitest'
import { getExpiringItems, expiryLabel } from './inventoryUtils'
import type { InventoryItem } from '../types'

const now = Math.floor(Date.now() / 1000)
const ts = (offsetSec: number) => ({ seconds: now + offsetSec, nanoseconds: 0 }) as any

function makeItem(id: string, offsetSec: number | null): InventoryItem {
  return {
    id, name: `Item ${id}`, category: 'bakery', unitPrice: 10000,
    unit: 'piece', defaultQty: 1,
    bestBefore: offsetSec !== null ? ts(offsetSec) : null,
    createdAt: ts(-86400),
  }
}

describe('getExpiringItems', () => {
  test('excludes items with no bestBefore', () => {
    expect(getExpiringItems([makeItem('1', null)], 48)).toHaveLength(0)
  })
  test('includes items expiring within hoursAhead', () => {
    expect(getExpiringItems([makeItem('1', 3600)], 48)).toHaveLength(1)
  })
  test('excludes items expiring beyond hoursAhead', () => {
    expect(getExpiringItems([makeItem('1', 72 * 3600)], 48)).toHaveLength(0)
  })
  test('includes already-expired items', () => {
    expect(getExpiringItems([makeItem('1', -3600)], 48)).toHaveLength(1)
  })
})

describe('expiryLabel', () => {
  test('returns null when no bestBefore', () => {
    expect(expiryLabel(makeItem('1', null))).toBeNull()
  })
  test('returns "expired" when bestBefore is in the past', () => {
    expect(expiryLabel(makeItem('1', -3600))).toBe('expired')
  })
  test('returns "today" when bestBefore is within 24 hours', () => {
    expect(expiryLabel(makeItem('1', 12 * 3600))).toBe('today')
  })
  test('returns "soon" when bestBefore is 24-48 hours away', () => {
    expect(expiryLabel(makeItem('1', 36 * 3600))).toBe('soon')
  })
  test('returns null when bestBefore is more than 48 hours away', () => {
    expect(expiryLabel(makeItem('1', 60 * 3600))).toBeNull()
  })
})
