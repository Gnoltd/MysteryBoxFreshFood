import {
  collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Review } from '../types'

export async function submitReview(
  data: Omit<Review, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'reviews'), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateReview(
  reviewId: string,
  data: { rating: number; comment: string }
): Promise<void> {
  await updateDoc(doc(db, 'reviews', reviewId), data)
}

export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const q = query(collection(db, 'reviews'), where('orderId', '==', orderId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Review
}

export async function getReviewsForListing(listingId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('listingId', '==', listingId),
    orderBy('createdAt', 'desc'),
    limit(5)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))
}

export async function getAggregateRatingForVendor(
  vendorId: string
): Promise<{ avg: number; count: number }> {
  const q = query(collection(db, 'reviews'), where('vendorId', '==', vendorId))
  const snap = await getDocs(q)
  if (snap.empty) return { avg: 0, count: 0 }
  const ratings = snap.docs.map(d => d.data().rating as number)
  const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length
  return { avg: Math.round(avg * 10) / 10, count: ratings.length }
}
