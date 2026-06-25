import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

const PLANS: Record<string, { amount: number; name: string }> = {
  weekly:  { amount: 150000, name: 'Pro' },
  monthly: { amount: 300000, name: 'Elite' },
}

export const createStripeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const { plan } = data as { plan: 'weekly' | 'monthly' }
  if (!PLANS[plan]) throw new functions.https.HttpsError('invalid-argument', 'Invalid plan')

  const uid = context.auth.uid
  const db = admin.firestore()
  const stripe = getStripe()

  const userSnap = await db.doc(`users/${uid}`).get()
  const userData = userSnap.data()!

  let stripeCustomerId: string | undefined = userData.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.displayName,
      metadata: { uid },
    })
    stripeCustomerId = customer.id
    await db.doc(`users/${uid}`).update({ stripeCustomerId })
  }

  const appUrl = (functions.config().app?.url ?? 'https://mystery-box-fresh-food.vercel.app').trim()
  const { amount, name } = PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'vnd',
        unit_amount: amount,
        recurring: { interval: 'month' },
        product_data: { name: `MysteryBox ${name} Plan` },
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/subscriptions?sub=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/subscriptions?sub=cancelled`,
    metadata: { uid, plan },
  })

  if (!session.url) throw new functions.https.HttpsError('internal', 'No checkout URL returned')
  return { url: session.url }
})
