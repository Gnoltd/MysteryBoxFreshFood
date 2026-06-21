import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { InventoryItem } from '../types'

export function subscribeToInventory(
  vendorId: string,
  callback: (items: InventoryItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'inventory', vendorId, 'items'),
    orderBy('name', 'asc')
  )
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)))
  )
}

export async function addInventoryItem(
  vendorId: string,
  item: Omit<InventoryItem, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(
    collection(db, 'inventory', vendorId, 'items'),
    { ...item, createdAt: serverTimestamp() }
  )
}

export async function updateInventoryItem(
  vendorId: string,
  itemId: string,
  patch: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'inventory', vendorId, 'items', itemId), patch)
}

export async function deleteInventoryItem(vendorId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'inventory', vendorId, 'items', itemId))
}
