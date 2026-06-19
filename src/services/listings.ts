import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, Unsubscribe
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Listing } from '../types'

export function subscribeToActiveListings(callback: (listings: Listing[]) => void): Unsubscribe {
  const q = query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))))
}

export function subscribeToVendorListings(vendorId: string, callback: (listings: Listing[]) => void): Unsubscribe {
  const q = query(collection(db, 'listings'), where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))))
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, 'listings', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Listing) : null
}

export async function getActiveListingsByVendor(vendorId: string): Promise<Listing[]> {
  const q = query(
    collection(db, 'listings'),
    where('vendorId', '==', vendorId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing))
}

export async function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'listings'), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateListing(id: string, data: Partial<Omit<Listing, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'listings', id), data)
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, 'listings', id))
}
