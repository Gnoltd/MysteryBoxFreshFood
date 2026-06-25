import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const { subscriptionId } = data as { subscriptionId: string }
  const uid = context.auth.uid

  const snap = await admin.firestore()
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .where('customerId', '==', uid)
    .limit(1)
    .get()

  if (snap.empty) throw new functions.https.HttpsError('not-found', 'Subscription not found')

  try {
    await stripe.subscriptions.cancel(subscriptionId)
  } catch (e: any) {
    // Already cancelled or not found in Stripe — still mark Firestore as cancelled
    if (e?.code !== 'resource_missing') {
      functions.logger.warn('stripe cancel skipped', e?.message)
    }
  }
  await snap.docs[0].ref.update({ status: 'cancelled' })
  return { ok: true }
})
