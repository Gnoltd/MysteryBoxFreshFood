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

export async function getListingRatings(
  listingIds: string[]
): Promise<Record<string, { avg: number; count: number }>> {
  if (listingIds.length === 0) return {}
  const result: Record<string, { avg: number; count: number }> = {}
  // Firestore 'in' supports max 30 items per query
  for (let i = 0; i < listingIds.length; i += 30) {
    const chunk = listingIds.slice(i, i + 30)
    const snap = await getDocs(query(collection(db, 'reviews'), where('listingId', 'in', chunk)))
    const grouped: Record<string, number[]> = {}
    snap.docs.forEach(d => {
      const { listingId, rating } = d.data() as Review
      if (!grouped[listingId]) grouped[listingId] = []
      grouped[listingId].push(rating)
    })
    for (const [lid, ratings] of Object.entries(grouped)) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
      result[lid] = { avg: Math.round(avg * 10) / 10, count: ratings.length }
    }
  }
  return result
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
