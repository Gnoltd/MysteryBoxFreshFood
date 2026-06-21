import { collection, query, where, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { NotificationItem } from '../types'

export async function getNotifications(uid: string): Promise<NotificationItem[]> {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    where('read', '==', false)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as NotificationItem))
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
}

export async function markAllRead(uid: string): Promise<void> {
  const q = query(collection(db, 'notifications', uid, 'items'), where('read', '==', false))
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(doc(db, 'notifications', uid, 'items', d.id), { read: true }))
  await batch.commit()
}

export async function markRead(uid: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', uid, 'items', itemId), { read: true })
}
