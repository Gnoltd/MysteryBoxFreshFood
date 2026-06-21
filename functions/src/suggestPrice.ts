import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Groq from 'groq-sdk'

interface SuggestPriceInput {
  vendorId: string
  targetDiscount: number
}

function heuristicDiscount(targetDiscount: number, hour: number): number {
  let bump = 0
  if (hour >= 15 && hour < 18) bump = 5
  else if (hour >= 18 && hour < 20) bump = 15
  else if (hour >= 20) bump = 25
  return Math.min(90, Math.max(20, targetDiscount + bump))
}

export const suggestPrice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { vendorId, targetDiscount } = data as SuggestPriceInput
  const currentHour = new Date().getHours()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const snapshot = await admin.firestore()
    .collection('orders')
    .where('vendorId', '==', vendorId)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
    .limit(200)
    .get()

  const orders = snapshot.docs
    .map(d => d.data())
    .filter(o => o.status === 'paid' || o.status === 'picked_up')

  const buckets: Record<number, number> = {}
  for (let h = 0; h < 24; h++) buckets[h] = 0
  orders.forEach(o => {
    const h = new Date(o.createdAt.toDate()).getHours()
    buckets[h] = (buckets[h] ?? 0) + 1
  })

  const dataPoints = buckets[currentHour] ?? 0

  if (dataPoints >= 5) {
    try {
      const groq = new Groq({ apiKey: functions.config().groq.api_key })
      const ratesText = Object.entries(buckets)
        .filter(([, count]) => count >= 1)
        .map(([h, count]) => `${h}:00 — ${count} orders`)
        .join('\n')

      const prompt = `Vietnamese F&B vendor. Current time: ${currentHour}:00.
Orders by hour of day (last 30 days):
${ratesText}

Target discount: ${targetDiscount}%. Suggest an optimal discount % (integer 20-90) to maximise sell-through tonight.
Reply ONLY with valid JSON: { "recommendedDiscount": number, "reason": string }`

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
      const recommendedDiscount = Math.min(90, Math.max(20, Math.round(Number(parsed.recommendedDiscount))))
      return { recommendedDiscount, reason: String(parsed.reason ?? ''), dataPoints }
    } catch (e) {
      console.error('suggestPrice Groq error:', e)
    }
  }

  const REASONS: Record<string, string> = {
    early:     'morning hours have lower urgency',
    afternoon: 'afternoon pickup window approaching',
    evening:   'peak clearance window — drive sell-through',
    late:      'last chance to sell — deep discount recommended',
  }
  const key = currentHour < 15 ? 'early' : currentHour < 18 ? 'afternoon' : currentHour < 20 ? 'evening' : 'late'
  return { recommendedDiscount: heuristicDiscount(targetDiscount, currentHour), reason: REASONS[key], dataPoints }
})
