import {
  collection, doc, onSnapshot,
  query, where, orderBy, getDocs, runTransaction, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Order } from '../types'

export function subscribeToCustomerOrders(customerId: string, callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))))
}

export function subscribeToVendorOrders(vendorId: string, callback: (orders: Order[]) => void): Unsubscribe {
  const q = query(collection(db, 'orders'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))))
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'orders', orderId), snap =>
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null)
  )
}

const REDEEMABLE = ['paid', 'pending_cod', 'pending_bank_transfer']

export async function redeemQRCode(qrCode: string, vendorId: string): Promise<Order> {
  const snap = await getDocs(
    query(collection(db, 'orders'),
      where('qrCode', '==', qrCode),
      where('vendorId', '==', vendorId))
  )
  if (snap.empty) throw new Error('Invalid or already used QR code')

  const validDoc = snap.docs.find(d => REDEEMABLE.includes(d.data().status))
  if (!validDoc) throw new Error('Invalid or already used QR code')

  const orderRef = validDoc.ref
  return runTransaction(db, async (tx) => {
    const fresh = await tx.get(orderRef)
    if (!fresh.exists()) throw new Error('Invalid or already used QR code')
    if (!REDEEMABLE.includes(fresh.data().status)) throw new Error('Invalid or already used QR code')
    tx.update(orderRef, { status: 'picked_up' })
    return { id: fresh.id, ...fresh.data(), status: 'picked_up' } as Order
  })
}

export async function getVendorOrders(vendorId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('vendorId', '==', vendorId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}
