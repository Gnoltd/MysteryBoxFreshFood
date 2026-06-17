import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const changeOrderPayment = functions.https.onCall(
  async (data: { orderId: string; paymentMethod: 'cod' | 'bank_transfer' }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { orderId, paymentMethod } = data
    const db = admin.firestore()
    const orderRef = db.collection('orders').doc(orderId)

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Order not found')
      const order = snap.data()!

      if (order.customerId !== context.auth!.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your order')
      }

      const changeable = ['pending_cod', 'pending_bank_transfer']
      if (!changeable.includes(order.status)) {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot change payment method at this stage')
      }

      const newStatus = paymentMethod === 'cod' ? 'pending_cod' : 'pending_bank_transfer'
      tx.update(orderRef, { status: newStatus, paymentMethod })
    })

    return { success: true }
  }
)
