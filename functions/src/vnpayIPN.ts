import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

function verifyVNPay(params: Record<string, string>, hashSecret: string, received: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params
  // Express already URL-decodes query params; re-encode with PHP urlencode() equivalent to match VNPAY's signing
  const signData = Object.keys(rest).sort()
    .map(k => `${k}=${encodeURIComponent(rest[k]).replace(/%20/g, '+')}`)
    .join('&')
  const hash = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex')
  return hash === received
}

export const vnpayIPN = functions.https.onRequest(async (req, res) => {
  const config = functions.config().vnpay
  // VNPAY sends IPN as GET
  const params = req.query as Record<string, string>
  const receivedHash = params.vnp_SecureHash

  if (!receivedHash || !verifyVNPay(params, config.hash_secret, receivedHash)) {
    res.json({ RspCode: '97', Message: 'Invalid signature' })
    return
  }

  const orderId = params.vnp_TxnRef
  const success = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00'

  const db = admin.firestore()
  const orderRef = db.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()

  if (!orderSnap.exists) {
    res.json({ RspCode: '01', Message: 'Order not found' })
    return
  }

  const order = orderSnap.data()!
  if (order.status !== 'pending_vnpay') {
    // Already processed — idempotent response
    res.json({ RspCode: '02', Message: 'Order already updated' })
    return
  }

  if (success) {
    const listingRef = db.collection('listings').doc(order.listingId)
    await db.runTransaction(async t => {
      const [freshOrder, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
      if (!freshOrder.exists || !listingSnap.exists) return
      if (freshOrder.data()!.status !== 'pending_vnpay') return

      const newQty = listingSnap.data()!.quantityRemaining - order.quantity
      t.update(orderRef, {
        status: 'paid',
        vnpayTransactionNo: params.vnp_TransactionNo ?? '',
      })
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
      })
    })
  } else {
    await orderRef.update({ status: 'cancelled' })
  }

  res.json({ RspCode: '00', Message: 'Confirm Success' })
})
