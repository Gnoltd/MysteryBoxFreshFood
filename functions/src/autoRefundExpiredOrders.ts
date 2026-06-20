import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const autoRefundExpiredOrders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const db = admin.firestore()
    const stripe = getStripe()

    const snap = await db.collection('orders')
      .where('status', '==', 'paid')
      .where('pickupEnd', '<', admin.firestore.Timestamp.now())
      .get()

    if (snap.empty) {
      console.log('autoRefundExpiredOrders: no expired paid orders')
      return
    }

    console.log(`autoRefundExpiredOrders: processing ${snap.docs.length} orders`)

    await Promise.allSettled(snap.docs.map(async orderDoc => {
      await db.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref)
        if (!fresh.exists) return
        if (fresh.data()!.status !== 'paid') return

        const paymentIntentId = fresh.data()!.stripePaymentIntentId as string | undefined
        if (!paymentIntentId) {
          console.warn(`autoRefundExpiredOrders: order ${orderDoc.id} missing stripePaymentIntentId — skipping`)
          return
        }

        await stripe.refunds.create({ payment_intent: paymentIntentId })
        tx.update(orderDoc.ref, { status: 'refunded' })
      })
    }))

    console.log('autoRefundExpiredOrders: done')
  })
