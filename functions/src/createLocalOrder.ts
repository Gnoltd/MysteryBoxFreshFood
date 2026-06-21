import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'

export const createLocalOrder = functions.https.onCall(
  async (data: { listingId: string; quantity: number; paymentMethod: 'cod' | 'bank_transfer' }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { listingId, quantity, paymentMethod } = data
    const customerId = context.auth.uid
    const db = admin.firestore()

    const listingRef = db.collection('listings').doc(listingId)
    const orderId = db.collection('orders').doc().id
    const orderRef = db.collection('orders').doc(orderId)

    await db.runTransaction(async (tx) => {
      const listingSnap = await tx.get(listingRef)
      if (!listingSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Listing not found')
      }
      const listing = listingSnap.data()!

      if (listing.quantityRemaining < quantity) {
        throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')
      }

      const newQuantity = listing.quantityRemaining - quantity
      const status = paymentMethod === 'cod' ? 'pending_cod' : 'pending_bank_transfer'

      tx.update(listingRef, {
        quantityRemaining: newQuantity,
        status: newQuantity === 0 ? 'sold_out' : listing.status,
      })

      tx.set(orderRef, {
        customerId,
        vendorId: listing.vendorId,
        listingId,
        listingTitle: listing.title,
        quantity,
        totalPrice: listing.price * quantity,
        status,
        paymentMethod,
        qrCode: uuidv4(),
        pickupEnd: listing.pickupEnd,
        boxContents: listing.boxContents ?? [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    return { orderId }
  }
)
