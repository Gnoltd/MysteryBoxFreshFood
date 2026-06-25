import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

export const PLAN_DAILY_LIMITS: Record<string, number> = {
  free: 2,
  weekly: 5,
  monthly: 8,
}

export async function enforceDailyLimit(customerId: string): Promise<void> {
  const db = admin.firestore()

  const subsSnap = await db.collection('subscriptions')
    .where('customerId', '==', customerId)
    .where('status', '==', 'active')
    .limit(1)
    .get()

  const plan = subsSnap.empty ? 'free' : (subsSnap.docs[0].data().plan as string)
  const dailyLimit = PLAN_DAILY_LIMITS[plan] ?? 2

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todaySnap = await db.collection('orders')
    .where('customerId', '==', customerId)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
    .get()

  const committed = todaySnap.docs.filter(d => {
    const status = d.data().status as string
    return ['paid', 'picked_up', 'pending_cod', 'pending_bank_transfer'].includes(status)
  }).length

  if (committed >= dailyLimit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `DAILY_LIMIT_REACHED:${dailyLimit}:${plan}`
    )
  }
}
