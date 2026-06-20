import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = functions.config().stripe.webhook_secret

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(400).send(`Webhook Error: ${message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { orderId, listingId, quantity } = session.metadata!

    const db = admin.firestore()
    const orderRef = db.collection('orders').doc(orderId)
    const listingRef = db.collection('listings').doc(listingId)

    await db.runTransaction(async t => {
      const [orderSnap, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
      if (!orderSnap.exists || !listingSnap.exists) return

      const newQty = listingSnap.data()!.quantityRemaining - parseInt(quantity)
      t.update(orderRef, {
        status: 'paid',
        stripePaymentIntentId: session.payment_intent as string,
      })
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
      })
    })
  }

  res.json({ received: true })
})
