import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { enforceDailyLimit } from './planLimits'

function formatVNDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

// VNPAY signs with URL-encoded values (matching PHP urlencode() — same as official Node.js demo sortObject)
function encodeVNPay(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+')
}

function buildSignData(params: Record<string, string>): string {
  return Object.keys(params).sort().map(k => `${k}=${encodeVNPay(params[k])}`).join('&')
}

function signVNPay(params: Record<string, string>, hashSecret: string): string {
  return crypto.createHmac('sha512', hashSecret).update(Buffer.from(buildSignData(params), 'utf-8')).digest('hex')
}

export const createVNPayOrder = functions.https.onCall(
  async (data: { listingId: string; quantity: number; boxNumber?: number }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { listingId, quantity, boxNumber } = data
    const customerId = context.auth.uid
    const db = admin.firestore()
    const config = functions.config().vnpay
    const tmnCode = (config.tmn_code as string).trim()
    const hashSecret = (config.hash_secret as string).trim()
    const vnpUrl = (config.url as string).trim()
    const appUrl = (functions.config().app?.url ?? 'https://mystery-box-fresh-food.vercel.app').trim()

    const rawIp = (context.rawRequest.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0].trim()
    // VNPAY requires IPv4 — strip IPv6-mapped prefix if present
    const ipAddr = (rawIp ?? '127.0.0.1').replace(/^::ffff:/, '')

    await enforceDailyLimit(customerId)

    const listingRef = db.collection('listings').doc(listingId)
    const listingSnap = await listingRef.get()
    if (!listingSnap.exists) throw new functions.https.HttpsError('not-found', 'Listing not found')
    const listing = listingSnap.data()!
    if (listing.quantityRemaining < quantity) throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')

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

    const orderId = db.collection('orders').doc().id
    await db.collection('orders').doc(orderId).set({
      customerId,
      vendorId: listing.vendorId,
      listingId,
      listingTitle: listing.title,
      quantity,
      totalPrice: discountedPrice * quantity,
      status: 'pending_vnpay',
      paymentMethod: 'vnpay',
      qrCode: uuidv4(),
      pickupEnd: listing.pickupEnd,
      boxContents: listing.boxContents ?? [],
      ...(boxNumber != null ? { requestedBoxNumber: boxNumber } : {}),
      ...(discountId ? { discountId } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Vietnam time = UTC+7
    const vnTime = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(discountedPrice * quantity) * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `MB${orderId.slice(0, 8).toUpperCase()}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: `${appUrl}/checkout/vnpay-return`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVNDate(vnTime),
    }

    const signData = buildSignData(params)
    const secureHash = signVNPay(params, hashSecret)

    functions.logger.info('VNPAY sign data:', signData)
    functions.logger.info('VNPAY hash:', secureHash)
    functions.logger.info('VNPAY tmnCode:', tmnCode, 'hashSecret length:', hashSecret.length)

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`
    return { url: paymentUrl, orderId }
  }
)
