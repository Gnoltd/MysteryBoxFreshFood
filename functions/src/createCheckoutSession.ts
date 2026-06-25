import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import { enforceDailyLimit } from './planLimits'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const createCheckoutSession = functions.https.onCall(
  async (
    data: { listingId: string; quantity: number; boxNumber?: number },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { listingId, quantity, boxNumber } = data
    const customerId = context.auth.uid
    const db = admin.firestore()
    const stripe = getStripe()

    await enforceDailyLimit(customerId)

    const listingRef = db.collection('listings').doc(listingId)
    const listingSnap = await listingRef.get()
    if (!listingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Listing not found')
    }
    const listing = listingSnap.data()!

    if (listing.quantityRemaining < quantity) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')
    }

    // Check for active discount
    let discountedPrice = listing.price as number
    let discountId: string | undefined
    const discountSnap = await db
      .collection('discounts')
      .doc(customerId)
      .collection('codes')
      .where('used', '==', false)
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .orderBy('expiresAt', 'asc')
      .limit(1)
      .get()
    if (!discountSnap.empty) {
      const discount = discountSnap.docs[0]
      discountId = discount.id
      const pct = discount.data().percent as number
      discountedPrice = Math.round(listing.price * (1 - pct / 100))
    }

    const appUrl = 'https://mystery-box-fresh-food.vercel.app'
    const orderId = db.collection('orders').doc().id

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'vnd',
          product_data: { name: listing.title, description: listing.description },
          unit_amount: discountedPrice,
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
        ...(boxNumber != null ? { requestedBoxNumber: String(boxNumber) } : {}),
        ...(discountId ? { discountId } : {}),
      },
    })

    await db.collection('orders').doc(orderId).set({
      customerId,
      vendorId: listing.vendorId,
      listingId,
      listingTitle: listing.title,
      quantity,
      totalPrice: discountedPrice * quantity,
      status: 'pending',
      paymentMethod: 'stripe',
      qrCode: uuidv4(),
      stripeSessionId: session.id,
      pickupEnd: listing.pickupEnd,
      boxContents: listing.boxContents ?? [],
      ...(boxNumber != null ? { requestedBoxNumber: boxNumber } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (!session.url) throw new functions.https.HttpsError('internal', 'No checkout URL returned')
    return { url: session.url, orderId }
  },
)
