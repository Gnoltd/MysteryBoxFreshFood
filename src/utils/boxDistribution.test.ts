import { describe, test, expect } from 'vitest'
import { distributeBoxes, formatBoxItem } from './boxDistribution'
import type { DistributionItem } from './boxDistribution'

const bread: DistributionItem = { id: '1', name: 'bánh mì', unitPrice: 10000, qty: 6, unit: 'loaf' }
const milk: DistributionItem  = { id: '2', name: 'sữa tươi 300ml', unitPrice: 8000, qty: 6, unit: 'bottle' }
const juice: DistributionItem = { id: '3', name: 'nước ép 500ml', unitPrice: 15000, qty: 3, unit: 'can' }

describe('distributeBoxes', () => {
  test('produces exactly numBoxes plans', () => {
    expect(distributeBoxes([bread], 3)).toHaveLength(3)
  })

  test('box numbers are 1-based sequential', () => {
    const plans = distributeBoxes([bread], 3)
    expect(plans.map(p => p.boxNumber)).toEqual([1, 2, 3])
  })

  test('total qty for each item matches input', () => {
    const plans = distributeBoxes([bread, milk], 3)
    const totalBread = plans.reduce((s, p) => s + (p.items.find(i => i.name === 'bánh mì')?.qty ?? 0), 0)
    const totalMilk  = plans.reduce((s, p) => s + (p.items.find(i => i.name === 'sữa tươi 300ml')?.qty ?? 0), 0)
    expect(totalBread).toBe(6)
    expect(totalMilk).toBe(6)
  })

  test('each BoxItem carries the unit from input', () => {
    const plans = distributeBoxes([milk], 2)
    const milkItems = plans.flatMap(p => p.items.filter(i => i.name === 'sữa tươi 300ml'))
    milkItems.forEach(i => expect(i.unit).toBe('bottle'))
  })

  test('belowAverage is boolean on every plan', () => {
    const plans = distributeBoxes([bread, milk, juice], 3)
    plans.forEach(p => expect(typeof p.belowAverage).toBe('boolean'))
  })

  test('box values sum to total input value', () => {
    const plans = distributeBoxes([bread, milk], 3)
    const totalVal = bread.unitPrice * bread.qty + milk.unitPrice * milk.qty
    const boxSum   = plans.reduce((s, p) => s + p.value, 0)
    expect(boxSum).toBe(totalVal)
  })

  test('handles numBoxes=1 (single box gets everything)', () => {
    const plans = distributeBoxes([bread], 1)
    expect(plans).toHaveLength(1)
    expect(plans[0].items[0].qty).toBe(6)
  })
})

describe('formatBoxItem', () => {
  test('ml measurement: shows total volume and count', () => {
    expect(formatBoxItem({ name: 'sữa tươi 300ml', qty: 2, unit: 'bottle' }))
      .toBe('600ml sữa tươi (×2 bottles)')
  })

  test('ml measurement qty=1: shows single volume and count', () => {
    expect(formatBoxItem({ name: 'nước ép 500ml', qty: 1, unit: 'can' }))
      .toBe('500ml nước ép (×1 can)')
  })

  test('g measurement: shows total weight and count', () => {
    expect(formatBoxItem({ name: 'thịt 250g', qty: 2, unit: 'pack' }))
      .toBe('500g thịt (×2 packs)')
  })

  test('no measurement: shows count × name', () => {
    expect(formatBoxItem({ name: 'bánh mì', qty: 3, unit: 'loaf' }))
      .toBe('×3 bánh mì')
  })

  test('no unit field: shows count × name', () => {
    expect(formatBoxItem({ name: 'bánh mì', qty: 2 }))
      .toBe('×2 bánh mì')
  })
})
