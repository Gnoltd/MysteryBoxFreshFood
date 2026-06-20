import { describe, test, expect } from 'vitest'
import { suggestQuantity } from './quickCreate'
import type { Order } from '../types'

const ts = (s: number) => ({ seconds: s, nanoseconds: 0 }) as any

function makeOrders(count: number, status = 'paid'): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i), customerId: 'c1', vendorId: 'v1', listingId: 'l1',
    listingTitle: 'Test', quantity: 1, totalPrice: 30000,
    status: status as any, qrCode: 'qr', createdAt: ts(1000 + i),
  }))
}

describe('suggestQuantity', () => {
  test('returns 1 when no orders exist', () => {
    expect(suggestQuantity([], 'medium')).toBe(1)
  })

  test('returns 1 when only pending orders exist', () => {
    expect(suggestQuantity(makeOrders(14, 'pending'), 'medium')).toBe(1)
  })

  test('medium: ceil(avgDaily × 1.0)', () => {
    // 14 paid over 14 days = 1/day → ceil(1 × 1.0) = 1
    expect(suggestQuantity(makeOrders(14, 'paid'), 'medium')).toBe(1)
  })

  test('high: ceil(avgDaily × 1.5)', () => {
    // 14 paid → 1/day → ceil(1 × 1.5) = 2
    expect(suggestQuantity(makeOrders(14, 'paid'), 'high')).toBe(2)
  })

  test('low: ceil(avgDaily × 0.5), minimum 1', () => {
    // 14 paid → 1/day → ceil(1 × 0.5) = 1
    expect(suggestQuantity(makeOrders(14, 'paid'), 'low')).toBe(1)
  })

  test('scales with higher volume', () => {
    // 28 paid → 2/day → high = ceil(2 × 1.5) = 3
    expect(suggestQuantity(makeOrders(28, 'paid'), 'high')).toBe(3)
  })

  test('counts picked_up orders', () => {
    const mixed = [...makeOrders(7, 'paid'), ...makeOrders(7, 'picked_up')]
    // 14 total → 1/day → medium = 1
    expect(suggestQuantity(mixed, 'medium')).toBe(1)
  })
})
