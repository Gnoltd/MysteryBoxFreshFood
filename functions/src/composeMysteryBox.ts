import * as functions from 'firebase-functions'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Item {
  name: string
  quantity: number
  unitPrice: number
}

interface ComposeMysteryBoxInput {
  items: Item[]
  targetDiscount: number
  numBoxes: number
  storeName: string
}

export const composeMysteryBox = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { items, targetDiscount, numBoxes, storeName } = data as ComposeMysteryBoxInput

  if (!items || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'At least one item is required')
  }
  if (!numBoxes || numBoxes < 1 || numBoxes > 20) {
    throw new functions.https.HttpsError('invalid-argument', 'numBoxes must be between 1 and 20')
  }
  if (targetDiscount < 20 || targetDiscount > 90) {
    throw new functions.https.HttpsError('invalid-argument', 'targetDiscount must be between 20 and 90')
  }

  const totalValue = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const originalPrice = Math.round(totalValue / numBoxes / 1000) * 1000
  const suggestedPrice = Math.round(originalPrice * (1 - targetDiscount / 100) / 1000) * 1000

  const itemsText = items
    .map(i => `- ${i.name}: ${i.quantity} units x ${i.unitPrice.toLocaleString('vi-VN')}d`)
    .join('\n')

  const prompt = `You are helping a Vietnamese F&B vendor create a mystery box listing for their end-of-day surplus. Store name: "${storeName}".

Today's surplus items:
${itemsText}

They want to sell ${numBoxes} mystery box(es) at ${targetDiscount}% off.
Total value per box before discount: ${originalPrice.toLocaleString('vi-VN')}d.
Suggested sale price: ${suggestedPrice.toLocaleString('vi-VN')}d.

Respond ONLY with valid JSON:
{
  "category": "<one of: bakery|fruit|vegetables|dairy|meat|rice|noodles|drinks|snacks|other>",
  "titleEn": "<English title, max 60 chars>",
  "titleVi": "<Vietnamese title, max 60 chars>",
  "descriptionEn": "<2-3 sentences in English: what the box contains and why it is a deal>",
  "descriptionVi": "<Same in Vietnamese>"
}`

  const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  })

  let parsed: {
    category: string
    titleEn: string
    titleVi: string
    descriptionEn: string
    descriptionVi: string
  }

  try {
    const result = await model.generateContent(prompt)
    parsed = JSON.parse(result.response.text())
  } catch (e) {
    console.error('composeMysteryBox error:', e)
    throw new functions.https.HttpsError('internal', 'compose_failed')
  }

  return {
    category: parsed.category,
    titleEn: parsed.titleEn,
    titleVi: parsed.titleVi,
    descriptionEn: parsed.descriptionEn,
    descriptionVi: parsed.descriptionVi,
    suggestedPrice,
    originalPrice,
  }
})
