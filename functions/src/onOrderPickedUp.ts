import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onOrderPickedUp = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change) => {
    const before = change.before.data()
    const after  = change.after.data()

    // Only fire when status transitions to picked_up
    if (before.status === after.status) return
    if (after.status !== 'picked_up') return
    if (after.boxNumber == null) return   // old listing, no box plans

    const db = admin.firestore()
    const listingSnap = await db.collection('listings').doc(after.listingId).get()
    if (!listingSnap.exists) return

    const boxPlans: Array<{ boxNumber: number; belowAverage: boolean }> =
      listingSnap.data()!.boxPlans ?? []

    const plan = boxPlans.find(p => p.boxNumber === after.boxNumber)
    if (!plan?.belowAverage) return   // box was fine — no discount needed

    // Create discount document
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db
      .collection('discounts')
      .doc(after.customerId)
      .collection('codes')
      .add({
        customerId: after.customerId,
        percent: 10,
        reason: 'low_value_box',
        used: false,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    // Send push notification using existing FCM pattern
    const tokenSnap = await db
      .collection('users')
      .doc(after.customerId)
      .collection('pushTokens')
      .limit(1)
      .get()
    if (tokenSnap.empty) return

    const token = tokenSnap.docs[0].data().fcmToken as string
    await admin.messaging().send({
      token,
      notification: {
        title: 'MysteryBox',
        body: "Sorry your box wasn't the best today — enjoy 10% off your next order! 🎁",
      },
      data: { type: 'low_value_discount' },
    })
  })
