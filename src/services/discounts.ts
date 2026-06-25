import {
  collection, query, where, orderBy, limit,
  getDocs, updateDoc, doc, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Discount } from '../types'

export async function getActiveDiscount(customerId: string): Promise<Discount | null> {
  const q = query(
    collection(db, 'discounts', customerId, 'codes'),
    where('used', '==', false),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'asc'),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Discount
}

export async function markDiscountUsed(customerId: string, discountId: string): Promise<void> {
  await updateDoc(doc(db, 'discounts', customerId, 'codes', discountId), { used: true })
}
