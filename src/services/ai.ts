import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import type { ListingCategory } from '../types'

interface ComposeMysteryBoxInput {
  items: { name: string; quantity: number; unitPrice: number }[]
  targetDiscount: number
  storeName: string
}

export interface ComposeMysteryBoxResult {
  numBoxes: number
  category: ListingCategory
  titleEn: string
  titleVi: string
  descriptionEn: string
  descriptionVi: string
  suggestedPrice: number
  originalPrice: number
}

export interface SuggestPriceResult {
  recommendedDiscount: number
  reason: string
  dataPoints: number
}

interface SuggestPriceInput {
  vendorId: string
  targetDiscount: number
}

export async function composeMysteryBox(input: ComposeMysteryBoxInput): Promise<ComposeMysteryBoxResult> {
  const fn = httpsCallable<ComposeMysteryBoxInput, ComposeMysteryBoxResult>(functions, 'composeMysteryBox')
  const result = await fn(input)
  return result.data
}

export async function suggestPrice(input: SuggestPriceInput): Promise<SuggestPriceResult> {
  const fn = httpsCallable<SuggestPriceInput, SuggestPriceResult>(functions, 'suggestPrice')
  const result = await fn(input)
  return result.data
}
