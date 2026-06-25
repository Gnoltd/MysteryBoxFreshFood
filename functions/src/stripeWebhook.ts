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
    const { orderId, listingId, quantity, discountId } = session.metadata!
    const requestedBoxNumber = session.metadata!.requestedBoxNumber
      ? parseInt(session.metadata!.requestedBoxNumber)
      : undefined

    const db = admin.firestore()
    const orderRef   = db.collection('orders').doc(orderId)
    const listingRef = db.collection('listings').doc(listingId)

    await db.runTransaction(async t => {
      const [orderSnap, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
      if (!orderSnap.exists || !listingSnap.exists) return

      const listingData = listingSnap.data()!
      const boxPlans: Array<{
        boxNumber: number
        items: Array<{ name: string; qty: number; unit?: string }>
        value: number
        belowAverage: boolean
        takenByOrderId?: string
      }> = listingData.boxPlans ?? []

      // Box assignment
      let assignedBoxNumber: number | undefined
      let assignedItems: Array<{ name: string; qty: number; unit?: string }> | undefined
      let boxReassigned = false
      let originalBoxNumber: number | undefined
      let updatedPlans = boxPlans

      if (boxPlans.length > 0 && requestedBoxNumber != null) {
        const requested = boxPlans.find(p => p.boxNumber === requestedBoxNumber && !p.takenByOrderId)
        const chosen = requested ?? boxPlans.find(p => !p.takenByOrderId)

        if (chosen) {
          assignedBoxNumber = chosen.boxNumber
          assignedItems = chosen.items
          if (!requested) {
            boxReassigned = true
            originalBoxNumber = requestedBoxNumber
          }
          updatedPlans = boxPlans.map(p =>
            p.boxNumber === chosen.boxNumber ? { ...p, takenByOrderId: orderId } : p,
          )
        }
      }

      const newQty = listingData.quantityRemaining - parseInt(quantity)
      const orderUpdate: Record<string, unknown> = {
        status: 'paid',
        stripePaymentIntentId: session.payment_intent as string,
      }
      if (assignedBoxNumber != null) {
        orderUpdate.boxNumber = assignedBoxNumber
        orderUpdate.boxContents = assignedItems
        if (boxReassigned) {
          orderUpdate.boxReassigned = true
          orderUpdate.originalBoxNumber = originalBoxNumber
        }
      }

      t.update(orderRef, orderUpdate)
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
        ...(updatedPlans !== boxPlans ? { boxPlans: updatedPlans } : {}),
      })
    })

    // Mark discount used (outside transaction — idempotent)
    if (discountId) {
      const customerId = session.metadata!.customerId
      await db
        .collection('discounts')
        .doc(customerId)
        .collection('codes')
        .doc(discountId)
        .update({ used: true })
    }
  }

  res.json({ received: true })
})
