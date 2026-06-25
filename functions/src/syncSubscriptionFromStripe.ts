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

async function upsertSubscription(
  db: admin.firestore.Firestore,
  uid: string,
  sub: Stripe.Subscription,
  plan: 'weekly' | 'monthly',
): Promise<void> {
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
}

export const syncSubscriptionFromStripe = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const uid = context.auth.uid
  const db = admin.firestore()
  const stripe = getStripe()

  const sessionId = (data as { sessionId?: string })?.sessionId

  // Fast path: session ID supplied → retrieve exact session to get subscription
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price'],
    })
    const sub = session.subscription as Stripe.Subscription | null
    if (!sub || sub.status !== 'active') return { synced: false }

    const unitAmount = (sub.items.data[0]?.price as Stripe.Price | undefined)?.unit_amount ?? 0
    const plan = AMOUNT_TO_PLAN[unitAmount]
    if (!plan) {
      functions.logger.warn('syncSubscription: unknown unit_amount', unitAmount)
      return { synced: false }
    }

    await upsertSubscription(db, uid, sub, plan)
    return { synced: true, plan }
  }

  // Fallback: no session ID — list all active subscriptions for this customer
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
    const unitAmount = (sub.items.data[0]?.price as Stripe.Price | undefined)?.unit_amount ?? 0
    const plan = AMOUNT_TO_PLAN[unitAmount]
    if (!plan) continue

    await upsertSubscription(db, uid, sub, plan)
    return { synced: true, plan }
  }

  return { synced: false }
})
