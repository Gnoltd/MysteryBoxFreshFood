import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import type { ListingCategory } from '../types'

interface ComposeMysteryBoxInput {
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number
  numBoxes: number
  storeName: string
}

export interface ComposeMysteryBoxResult {
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}

export async function composeMysteryBox(input: ComposeMysteryBoxInput): Promise<ComposeMysteryBoxResult> {
  const fn = httpsCallable<ComposeMysteryBoxInput, ComposeMysteryBoxResult>(functions, 'composeMysteryBox')
  const result = await fn(input)
  return result.data
}
