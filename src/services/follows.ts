import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  updateDoc, doc, serverTimestamp, limit
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Follow } from '../types'

export async function getFollows(customerId: string): Promise<Follow[]> {
  const qAll = query(collection(db, 'follows'), where('customerId', '==', customerId))
  const snap = await getDocs(qAll)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Follow))
}

export async function getFollow(customerId: string, vendorId: string): Promise<Follow | null> {
  const q = query(
    collection(db, 'follows'),
    where('customerId', '==', customerId),
    where('vendorId', '==', vendorId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Follow
}

export async function followVendor(customerId: string, vendorId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'follows'), {
    customerId,
    vendorId,
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function unfollowVendor(followId: string): Promise<void> {
  await deleteDoc(doc(db, 'follows', followId))
}

export async function toggleNotifications(followId: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'follows', followId), { notificationsEnabled: enabled })
}
