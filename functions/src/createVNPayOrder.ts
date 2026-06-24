import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

function formatVNDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function signVNPay(params: Record<string, string>, hashSecret: string): string {
  const signData = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  return crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex')
}

export const createVNPayOrder = functions.https.onCall(
  async (data: { listingId: string; quantity: number }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { listingId, quantity } = data
    const customerId = context.auth.uid
    const db = admin.firestore()
    const config = functions.config().vnpay
    const appUrl = functions.config().app?.url ?? 'https://mystery-box-fresh-food.vercel.app'

    const ipAddr =
      (context.rawRequest.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      context.rawRequest.ip ??
      '127.0.0.1'

    const listingRef = db.collection('listings').doc(listingId)
    const listingSnap = await listingRef.get()
    if (!listingSnap.exists) throw new functions.https.HttpsError('not-found', 'Listing not found')
    const listing = listingSnap.data()!
    if (listing.quantityRemaining < quantity) throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')

    const orderId = db.collection('orders').doc().id
    await db.collection('orders').doc(orderId).set({
      customerId,
      vendorId: listing.vendorId,
      listingId,
      listingTitle: listing.title,
      quantity,
      totalPrice: listing.price * quantity,
      status: 'pending_vnpay',
      paymentMethod: 'vnpay',
      qrCode: uuidv4(),
      pickupEnd: listing.pickupEnd,
      boxContents: listing.boxContents ?? [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Vietnam time = UTC+7
    const vnTime = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.tmn_code,
      vnp_Amount: String(listing.price * quantity * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId.slice(0, 8).toUpperCase()}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: `${appUrl}/checkout/vnpay-return`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVNDate(vnTime),
    }

    params.vnp_SecureHash = signVNPay(params, config.hash_secret)
    const paymentUrl = `${config.url}?${new URLSearchParams(params).toString()}`
    return { url: paymentUrl, orderId }
  }
)
