import type { BoxItem, BoxPlan } from '../types'

export interface DistributionItem {
  id: string
  name: string
  unitPrice: number
  qty: number       // total units across all boxes
  unit: string
}

export function distributeBoxes(
  items: DistributionItem[],
  numBoxes: number,
): Omit<BoxPlan, 'takenByOrderId'>[] {
  if (numBoxes < 1 || items.length === 0) return []

  const totalValue = items.reduce((s, it) => s + it.unitPrice * it.qty, 0)
  const targetPerBox = totalValue / numBoxes

  // Sort expensive items first so they spread before cheap filler
  const sorted = [...items].sort((a, b) => b.unitPrice - a.unitPrice)

  const boxes: Array<{ value: number; items: BoxItem[] }> = Array.from(
    { length: numBoxes },
    () => ({ value: 0, items: [] }),
  )

  // Greedy random fill — one unit at a time
  for (const item of sorted) {
    for (let i = 0; i < item.qty; i++) {
      // Pick from the bottom 40% of boxes by current value
      const indexed = boxes
        .map((b, idx) => ({ idx, value: b.value }))
        .sort((a, b) => a.value - b.value)
      const poolSize = Math.max(1, Math.ceil(numBoxes * 0.4))
      const pool = indexed.slice(0, poolSize)
      const chosen = pool[Math.floor(Math.random() * pool.length)]

      const box = boxes[chosen.idx]
      const existing = box.items.find(bi => bi.name === item.name)
      if (existing) {
        existing.qty++
      } else {
        box.items.push({ name: item.name, qty: 1, unit: item.unit })
      }
      box.value += item.unitPrice
    }
  }

  // Balance pass — swap one unit between richest and poorest if it reduces total deviation
  let improved = true
  let passes = 0
  while (improved && passes < 30) {
    improved = false
    passes++

    const maxDev = boxes.reduce((mx, b) => Math.max(mx, Math.abs(b.value - targetPerBox)), 0)
    if (maxDev / targetPerBox <= 0.2) break

    const byValue = [...boxes.keys()].sort((a, b) => boxes[b].value - boxes[a].value)
    const richIdx = byValue[0]
    const poorIdx = byValue[byValue.length - 1]

    let bestReduction = 0
    let bestItemName = ''

    for (const bItem of boxes[richIdx].items) {
      const src = items.find(it => it.name === bItem.name)
      if (!src) continue
      const v = src.unitPrice
      const oldDev = Math.abs(boxes[richIdx].value - targetPerBox) + Math.abs(boxes[poorIdx].value - targetPerBox)
      const newDev = Math.abs(boxes[richIdx].value - v - targetPerBox) + Math.abs(boxes[poorIdx].value + v - targetPerBox)
      const reduction = oldDev - newDev
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestItemName = bItem.name
      }
    }

    if (bestItemName && bestReduction > 0) {
      const src = items.find(it => it.name === bestItemName)!
      const v = src.unitPrice

      // Remove one unit from richest
      const richItem = boxes[richIdx].items.find(bi => bi.name === bestItemName)!
      if (richItem.qty > 1) richItem.qty--
      else boxes[richIdx].items = boxes[richIdx].items.filter(bi => bi.name !== bestItemName)
      boxes[richIdx].value -= v

      // Add one unit to poorest
      const poorItem = boxes[poorIdx].items.find(bi => bi.name === bestItemName)
      if (poorItem) poorItem.qty++
      else boxes[poorIdx].items.push({ name: bestItemName, qty: 1, unit: src.unit })
      boxes[poorIdx].value += v

      improved = true
    }
  }

  const average = totalValue / numBoxes
  return boxes.map((box, i) => ({
    boxNumber: i + 1,
    items: box.items,
    value: Math.round(box.value),
    belowAverage: box.value < average * 0.85,
  }))
}

const MEASURE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|mg|oz)/i

export function formatBoxItem(item: BoxItem): string {
  if (!item.unit) return `×${item.qty} ${item.name}`
  const match = item.name.match(MEASURE_RE)
  if (match) {
    const amount = parseFloat(match[1].replace(',', '.'))
    const unitOfMeasure = match[2]
    const total = Math.round(amount * item.qty * 10) / 10
    const cleanName = item.name.replace(match[0], '').trim()
    const unitLabel = item.qty > 1 ? `${item.unit}s` : item.unit
    return `${total}${unitOfMeasure} ${cleanName} (×${item.qty} ${unitLabel})`
  }
  return `×${item.qty} ${item.name}`
}
