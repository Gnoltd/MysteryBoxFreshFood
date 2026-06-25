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

      const listingData = listingSnap.data()!
      const boxPlans: Array<{
        boxNumber: number
        items: Array<{ name: string; qty: number; unit?: string }>
        value: number
        belowAverage: boolean
        takenByOrderId?: string
      }> = listingData.boxPlans ?? []

      const requestedBoxNumber: number | undefined = freshOrder.data()!.requestedBoxNumber

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
          if (!requested) { boxReassigned = true; originalBoxNumber = requestedBoxNumber }
          updatedPlans = boxPlans.map(p =>
            p.boxNumber === chosen.boxNumber ? { ...p, takenByOrderId: orderId } : p,
          )
        }
      }

      const newQty = listingData.quantityRemaining - order.quantity
      const orderUpdate: Record<string, unknown> = {
        status: 'paid',
        vnpayTransactionNo: params.vnp_TransactionNo ?? '',
      }
      if (assignedBoxNumber != null) {
        orderUpdate.boxNumber = assignedBoxNumber
        orderUpdate.boxContents = assignedItems
        if (boxReassigned) { orderUpdate.boxReassigned = true; orderUpdate.originalBoxNumber = originalBoxNumber }
      }

      t.update(orderRef, orderUpdate)
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
        ...(updatedPlans !== boxPlans ? { boxPlans: updatedPlans } : {}),
      })
    })

    // Mark discount used if one was applied
    const discountId = orderSnap.data()!.discountId as string | undefined
    if (discountId) {
      await db.collection('discounts').doc(order.customerId).collection('codes')
        .doc(discountId).update({ used: true })
    }
  } else {
    await orderRef.update({ status: 'cancelled' })
  }

  res.json({ RspCode: '00', Message: 'Confirm Success' })
})
