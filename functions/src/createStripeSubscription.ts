import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })

const PLANS: Record<string, { amount: number; interval: Stripe.PriceCreateParams.Recurring.Interval }> = {
  weekly:  { amount: 49000,  interval: 'week' },
  monthly: { amount: 179000, interval: 'month' },
}

export const createStripeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const { plan } = data as { plan: 'weekly' | 'monthly' }
  if (!PLANS[plan]) throw new functions.https.HttpsError('invalid-argument', 'Invalid plan')

  const uid = context.auth.uid
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.data()!

  // Find or create Stripe customer
  let stripeCustomerId: string | undefined = userData.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.displayName,
      metadata: { uid },
    })
    stripeCustomerId = customer.id
    await admin.firestore().doc(`users/${uid}`).update({ stripeCustomerId })
  }

  const { amount, interval } = PLANS[plan]

  const product = await stripe.products.create({ name: `MysteryBoxFreshFood ${plan} plan` })
  const price = await stripe.prices.create({
    currency: 'vnd',
    unit_amount: amount,
    recurring: { interval },
    product: product.id,
  })

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice
  const intent = invoice.payment_intent as Stripe.PaymentIntent

  await admin.firestore().collection('subscriptions').add({
    customerId: uid,
    plan,
    stripeSubscriptionId: subscription.id,
    status: 'active',
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { clientSecret: intent.client_secret }
})
