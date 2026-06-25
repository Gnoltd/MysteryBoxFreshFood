import { collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import type { Subscription, SubscriptionPlan } from '../types'

export async function getSubscription(uid: string): Promise<Subscription | null> {
  const q = query(
    collection(db, 'subscriptions'),
    where('customerId', '==', uid),
    where('status', 'in', ['active', 'past_due']),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription
}

export function subscribeToSubscription(
  uid: string,
  onChange: (sub: Subscription | null) => void,
): () => void {
  const q = query(
    collection(db, 'subscriptions'),
    where('customerId', '==', uid),
    where('status', 'in', ['active', 'past_due']),
    limit(1)
  )
  return onSnapshot(q, snap => {
    onChange(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription)
  })
}

export async function createSubscription(plan: SubscriptionPlan): Promise<{ url: string }> {
  const fn = httpsCallable<{ plan: SubscriptionPlan }, { url: string }>(functions, 'createStripeSubscription')
  const result = await fn({ plan })
  return result.data
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const fn = httpsCallable(functions, 'cancelSubscription')
  await fn({ subscriptionId })
}
