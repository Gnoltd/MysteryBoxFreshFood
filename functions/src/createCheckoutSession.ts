import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const createCheckoutSession = functions.https.onCall(
  async (data: { listingId: string; quantity: number }, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  }

  const { listingId, quantity } = data
  const customerId = context.auth.uid
  const db = admin.firestore()
  const stripe = getStripe()

  const listingRef = db.collection('listings').doc(listingId)
  const listingSnap = await listingRef.get()
  if (!listingSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Listing not found')
  }
  const listing = listingSnap.data()!

  if (listing.quantityRemaining < quantity) {
    throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')
  }

  const appUrl = functions.config().app?.url ?? 'http://localhost:5173'
  const orderId = db.collection('orders').doc().id

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'vnd',
        product_data: { name: listing.title, description: listing.description },
        unit_amount: listing.price,
      },
      quantity,
    }],
    mode: 'payment',
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${appUrl}/checkout/cancel`,
    metadata: {
      orderId,
      listingId,
      customerId,
      vendorId: listing.vendorId,
      quantity: String(quantity),
    },
  })

  await db.collection('orders').doc(orderId).set({
    customerId,
    vendorId: listing.vendorId,
    listingId,
    listingTitle: listing.title,
    quantity,
    totalPrice: listing.price * quantity,
    status: 'pending',
    qrCode: uuidv4(),
    stripeSessionId: session.id,
    pickupEnd: listing.pickupEnd,
    boxContents: listing.boxContents ?? [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  if (!session.url) throw new functions.https.HttpsError('internal', 'No checkout URL returned')
  return { url: session.url, orderId }
})
