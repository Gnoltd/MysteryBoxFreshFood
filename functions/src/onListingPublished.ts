import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onListingPublished = functions.firestore
  .document('listings/{listingId}')
  .onWrite(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    if (!after) return
    // Only fire on first activation
    if (before?.status === 'active' || after.status !== 'active') return

    const { listingId } = context.params
    const vendorId: string = after.vendorId
    const title: string = after.title
    const price: number = after.price

    // Get vendor store name
    const vendorSnap = await admin.firestore().doc(`users/${vendorId}`).get()
    const storeName: string = vendorSnap.data()?.storeName ?? 'A vendor'

    // Find followers with notifications enabled
    const followsSnap = await admin.firestore()
      .collection('follows')
      .where('vendorId', '==', vendorId)
      .where('notificationsEnabled', '==', true)
      .get()

    if (followsSnap.empty) return

    const customerIds = followsSnap.docs.map(d => d.data().customerId as string)

    // Fetch FCM tokens
    const tokenSnaps = await Promise.all(
      customerIds.map(uid => admin.firestore().doc(`pushTokens/${uid}`).get())
    )
    const tokens = tokenSnaps
      .filter(s => s.exists)
      .map(s => s.data()!.fcmToken as string)
      .filter(Boolean)

    const notifTitle = `${storeName} listed a new box`
    const notifBody = `${title} — ${price.toLocaleString('vi-VN')} đ. Grab it before it's gone!`

    // Send FCM multicast if tokens exist
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: notifTitle, body: notifBody },
        data: { listingId, vendorId },
      })
    }

    // Write notification items to all followers
    const batch = admin.firestore().batch()
    for (const uid of customerIds) {
      const ref = admin.firestore()
        .collection('notifications').doc(uid)
        .collection('items').doc()
      batch.set(ref, {
        title: notifTitle,
        body: notifBody,
        listingId,
        vendorId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()
  })
