import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })

async function cancelStripeSubSafe(id: string) {
  try {
    await stripe.subscriptions.cancel(id)
  } catch (e: any) {
    functions.logger.warn('stripe cancel skipped', e?.message)
  }
}

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const uid = context.auth.uid
  const db = admin.firestore()

  // Cancel ALL active subscriptions for this user so they always return to Basic
  const allSnap = await db.collection('subscriptions')
    .where('customerId', '==', uid)
    .where('status', 'in', ['active', 'past_due'])
    .get()

  if (allSnap.empty) throw new functions.https.HttpsError('not-found', 'No active subscription found')

  await Promise.all(
    allSnap.docs.map(async doc => {
      const stripeId = doc.data().stripeSubscriptionId as string | undefined
      if (stripeId) await cancelStripeSubSafe(stripeId)
      await doc.ref.update({ status: 'cancelled' })
    })
  )

  return { ok: true }
})
