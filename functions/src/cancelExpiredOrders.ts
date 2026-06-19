import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

const EXPIRY_MS = 15 * 60 * 1000
const STOCK_STATUSES = ['pending_cod', 'pending_bank_transfer']
const ALL_PENDING = ['pending', 'pending_cod', 'pending_bank_transfer']

export const cancelExpiredOrders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const db = admin.firestore()
    const cutoff = admin.firestore.Timestamp.fromDate(new Date(Date.now() - EXPIRY_MS))

    // Run one query per status to avoid composite index on 'in' + range
    const snaps = await Promise.all(
      ALL_PENDING.map(status =>
        db.collection('orders')
          .where('status', '==', status)
          .where('createdAt', '<', cutoff)
          .get()
      )
    )

    const docs = snaps.flatMap(s => s.docs)
    if (docs.length === 0) {
      console.log('cancelExpiredOrders: no expired orders')
      return
    }

    console.log(`cancelExpiredOrders: cancelling ${docs.length} orders`)

    await Promise.allSettled(
      docs.map(async orderDoc => {
        const order = orderDoc.data()

        if (STOCK_STATUSES.includes(order.status)) {
          // Restore stock in a transaction to avoid double-restoration on retries
          await db.runTransaction(async tx => {
            const freshSnap = await tx.get(orderDoc.ref)
            if (!freshSnap.exists) return
            const fresh = freshSnap.data()!
            if (!STOCK_STATUSES.includes(fresh.status)) return // already cancelled

            const listingRef = db.collection('listings').doc(fresh.listingId)
            const listingSnap = await tx.get(listingRef)
            if (listingSnap.exists) {
              const listing = listingSnap.data()!
              const restoredQty = listing.quantityRemaining + fresh.quantity
              tx.update(listingRef, {
                quantityRemaining: restoredQty,
                // reopen listing if it was marked sold_out by this order
                ...(listing.status === 'sold_out' && restoredQty > 0 ? { status: 'active' } : {}),
              })
            }

            tx.update(orderDoc.ref, { status: 'cancelled' })
          })
        } else {
          // Stripe pending — no stock was reserved, simple cancel
          await orderDoc.ref.update({ status: 'cancelled' })
        }
      })
    )

    console.log('cancelExpiredOrders: done')
  })
