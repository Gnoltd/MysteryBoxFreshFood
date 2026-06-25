import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const AMOUNT_TO_PLAN: Record<number, 'weekly' | 'monthly'> = {
  150000: 'weekly',
  300000: 'monthly',
}

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

// Called from the client after successful Stripe checkout to ensure the subscription
// is recorded in Firestore — acts as a reliable fallback when the webhook is delayed
// or the stripeSubscriptionWebhook endpoint isn't registered in Stripe Dashboard.
export const syncSubscriptionFromStripe = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const uid = context.auth.uid
  const db = admin.firestore()
  const stripe = getStripe()

  const userSnap = await db.doc(`users/${uid}`).get()
  const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined
  if (!stripeCustomerId) return { synced: false }

  const stripeSubs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 5,
    expand: ['data.items.data.price'],
  })

  for (const sub of stripeSubs.data) {
    const unitAmount = sub.items.data[0]?.price?.unit_amount ?? 0
    const plan = AMOUNT_TO_PLAN[unitAmount]
    if (!plan) continue

    const existing = await db.collection('subscriptions')
      .where('stripeSubscriptionId', '==', sub.id)
      .limit(1)
      .get()

    const payload = {
      status: 'active' as const,
      plan,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
    }

    if (existing.empty) {
      await db.collection('subscriptions').add({
        customerId: uid,
        stripeSubscriptionId: sub.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...payload,
      })
    } else {
      await existing.docs[0].ref.update(payload)
    }

    return { synced: true, plan }
  }

  return { synced: false }
})
