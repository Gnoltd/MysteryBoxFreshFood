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
  // Query by qrCode only to avoid requiring a composite Firestore index
  const snap = await getDocs(
    query(collection(db, 'orders'), where('qrCode', '==', qrCode.trim()))
  )
  if (snap.empty) throw new Error('QR code not found')

  const orderDoc = snap.docs[0]
  const data = orderDoc.data()

  if (data.vendorId !== vendorId) throw new Error('This QR code belongs to a different vendor')
  if (!REDEEMABLE.includes(data.status)) throw new Error('Order has already been picked up')

  return runTransaction(db, async (tx) => {
    const fresh = await tx.get(orderDoc.ref)
    if (!fresh.exists()) throw new Error('Order not found')
    if (!REDEEMABLE.includes(fresh.data().status)) throw new Error('Order has already been picked up')
    tx.update(orderDoc.ref, { status: 'picked_up' })
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
