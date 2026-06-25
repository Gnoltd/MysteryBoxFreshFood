import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
// Falls back to main webhook secret if subscription_webhook_secret is not separately configured
const endpointSecret: string =
  functions.config().stripe.subscription_webhook_secret ||
  functions.config().stripe.webhook_secret

export const stripeSubscriptionWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch {
    res.status(400).send('Webhook signature verification failed')
    return
  }

  const db = admin.firestore()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode === 'subscription' && session.metadata?.uid && session.metadata?.plan) {
      const { uid, plan } = session.metadata
      const stripeSubId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(stripeSubId)
      await db.collection('subscriptions').add({
        customerId: uid,
        plan,
        stripeSubscriptionId: stripeSubId,
        status: 'active',
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = invoice.subscription as string
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get()
    if (!snap.empty) {
      const sub = await stripe.subscriptions.retrieve(subId)
      await snap.docs[0].ref.update({
        status: 'active',
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = invoice.subscription as string
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get()
    if (!snap.empty) await snap.docs[0].ref.update({ status: 'past_due' })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', sub.id).limit(1).get()
    if (!snap.empty) await snap.docs[0].ref.update({ status: 'cancelled' })
  }

  res.json({ received: true })
})
