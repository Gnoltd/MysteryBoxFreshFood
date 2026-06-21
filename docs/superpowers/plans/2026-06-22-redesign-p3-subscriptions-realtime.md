# MysteryBoxFreshFood — Redesign Part 3: Subscriptions + Real-Time Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Parts 1 & 2 complete. Types (Follow, Subscription, PushToken, NotificationItem) must exist in `src/types.ts`. Firestore rules must include follows, subscriptions, pushTokens, notifications.

**Goal:** Build the follow-vendor system, Web Push / FCM push notifications, Stripe recurring subscription backend, and the new SubscriptionsPage.

**Architecture:** Follow writes go through `src/services/follows.ts`. FCM token saved on first login via `savePushToken` callable. `onListingPublished` Cloud Function triggers on listing activation and multicast-sends FCM. Stripe subscription lifecycle managed by `createStripeSubscription` + `stripeSubscriptionWebhook` Cloud Functions.

**Tech Stack:** Firebase Cloud Functions (Node.js 18), Firebase Cloud Messaging, Stripe Subscriptions API, Firestore, React 18 + TypeScript

## Global Constraints

- App name: **MysteryBoxFreshFood**
- All text via `t('key')`
- No Firebase SDK in components — only via `src/services/`
- FCM VAPID key in `.env.local` as `VITE_FIREBASE_VAPID_KEY`
- Stripe recurring uses `price_data` at runtime — no pre-created Price IDs needed
- `onListingPublished` only sends FCM when `before.status !== 'active' && after.status === 'active'` (first activation)

---

## File Map

| Action | Path |
|---|---|
| Create | `src/services/follows.ts` |
| Create | `src/services/notifications.ts` |
| Create | `src/services/pushNotifications.ts` |
| Create | `src/services/subscriptions.ts` |
| Modify | `src/pages/customer/VendorStorePage.tsx` |
| Create | `public/firebase-messaging-sw.js` |
| Create | `functions/src/savePushToken.ts` |
| Create | `functions/src/onListingPublished.ts` |
| Create | `functions/src/createStripeSubscription.ts` |
| Create | `functions/src/stripeSubscriptionWebhook.ts` |
| Create | `functions/src/cancelSubscription.ts` |
| Modify | `functions/src/index.ts` |
| Create | `src/pages/customer/SubscriptionsPage.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/locales/en/translation.json` |
| Modify | `src/locales/vi/translation.json` |

---

### Task 10: Follow System

**Files:**
- Create: `src/services/follows.ts`
- Modify: `src/pages/customer/VendorStorePage.tsx`

**Interfaces — Produces:**
- `followVendor(customerId: string, vendorId: string): Promise<string>` — returns followId
- `unfollowVendor(followId: string): Promise<void>`
- `getFollows(customerId: string): Promise<Follow[]>`
- `getFollow(customerId: string, vendorId: string): Promise<Follow | null>`
- `toggleNotifications(followId: string, enabled: boolean): Promise<void>`

- [ ] **Step 1: Create `src/services/follows.ts`**

```ts
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  updateDoc, doc, serverTimestamp, limit
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Follow } from '../types'

export async function getFollows(customerId: string): Promise<Follow[]> {
  const q = query(
    collection(db, 'follows'),
    where('customerId', '==', customerId),
    where('notificationsEnabled', '==', false)
  )
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
```

- [ ] **Step 2: Add Follow/Unfollow button to `src/pages/customer/VendorStorePage.tsx`**

Find the section in VendorStorePage that renders the vendor header. Add the following hook and button. First read the existing file, then add:

After the existing imports, add:
```tsx
import { followVendor, unfollowVendor, getFollow } from '../../services/follows'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { Bell, BellOff } from 'lucide-react'
```

After the existing state declarations inside the component, add:
```tsx
const [follow, setFollow] = useState<Follow | null>(null)
const [followLoading, setFollowLoading] = useState(false)

useEffect(() => {
  if (!userProfile || !vendorId) return
  getFollow(userProfile.uid, vendorId).then(setFollow)
}, [userProfile, vendorId])

const handleFollow = async () => {
  if (!userProfile || !vendorId) return
  setFollowLoading(true)
  if (follow) {
    await unfollowVendor(follow.id)
    setFollow(null)
  } else {
    const id = await followVendor(userProfile.uid, vendorId)
    setFollow({ id, customerId: userProfile.uid, vendorId, notificationsEnabled: true, createdAt: null as any })
  }
  setFollowLoading(false)
}
```

In the JSX, in the vendor header section, add:
```tsx
<div className="flex items-center gap-3 mt-4">
  {follow ? (
    <GhostButton onClick={handleFollow} disabled={followLoading}>
      <BellOff size={16} /> {t('vendor.unfollow')}
    </GhostButton>
  ) : (
    <GradientButton onClick={handleFollow} disabled={followLoading}>
      <Bell size={16} /> {t('vendor.follow')}
    </GradientButton>
  )}
</div>
```

- [ ] **Step 3: Add i18n keys**

In `src/locales/en/translation.json` under a new `"vendor"` section (if not exists) or merge:
```json
"follow": "Follow Vendor",
"unfollow": "Unfollow",
"following": "Following"
```

In `src/locales/vi/translation.json`:
```json
"follow": "Theo dõi",
"unfollow": "Bỏ theo dõi",
"following": "Đang theo dõi"
```

- [ ] **Step 4: Commit**

```bash
git add src/services/follows.ts src/pages/customer/VendorStorePage.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add follow/unfollow vendor system with Firestore follows collection"
```

---

### Task 11: Push Notifications (FCM)

**Files:**
- Create: `public/firebase-messaging-sw.js`
- Create: `src/services/notifications.ts`
- Create: `src/services/pushNotifications.ts`
- Create: `functions/src/savePushToken.ts`
- Create: `functions/src/onListingPublished.ts`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Create `public/firebase-messaging-sw.js`**

```js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

// Config injected at build time — values must match src/firebase.ts
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'MysteryBoxFreshFood', {
    body: body ?? '',
    icon: '/icon-192.png',
  })
})
```

**Note:** The service worker reads Firebase config from Vite's env injection. In `vite.config.ts`, add a plugin to inject env vars into the SW at build time, or alternatively hard-code the config values directly from `.env.local` here. For simplicity in dev, hard-code the same values from `.env.local` into the SW file.

- [ ] **Step 2: Create `src/services/notifications.ts`**

```ts
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore'
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
  const { updateDoc } = await import('firebase/firestore')
  await updateDoc(doc(db, 'notifications', uid, 'items', itemId), { read: true })
}
```

- [ ] **Step 3: Create `src/services/pushNotifications.ts`**

```ts
import { getMessaging, getToken } from 'firebase/messaging'
import { app } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function savePushToken(): Promise<void> {
  const granted = await requestPermission()
  if (!granted) return
  const messaging = getMessaging(app)
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: await navigator.serviceWorker.ready })
  if (!token) return
  const saveFn = httpsCallable(functions, 'savePushToken')
  await saveFn({ fcmToken: token })
}
```

**Note:** Ensure `src/firebase.ts` exports `functions` (the Firebase Functions instance). If it does not, add:
```ts
import { getFunctions } from 'firebase/functions'
export const functions = getFunctions(app)
```

- [ ] **Step 4: Create `functions/src/savePushToken.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const savePushToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')
  const { fcmToken } = data as { fcmToken: string }
  if (!fcmToken) throw new functions.https.HttpsError('invalid-argument', 'fcmToken required')
  await admin.firestore().doc(`pushTokens/${context.auth.uid}`).set({
    fcmToken,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { ok: true }
})
```

- [ ] **Step 5: Create `functions/src/onListingPublished.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onListingPublished = functions.firestore
  .document('listings/{listingId}')
  .onWrite(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    if (!after) return
    // Only fire on first activation
    if (before?.status === 'active' || after.status !== 'active') return

    const { listingId } = context.params
    const vendorId: string = after.vendorId
    const title: string = after.title
    const price: number = after.price

    // Get vendor store name
    const vendorSnap = await admin.firestore().doc(`users/${vendorId}`).get()
    const storeName: string = vendorSnap.data()?.storeName ?? 'A vendor'

    // Find followers with notifications enabled
    const followsSnap = await admin.firestore()
      .collection('follows')
      .where('vendorId', '==', vendorId)
      .where('notificationsEnabled', '==', true)
      .get()

    if (followsSnap.empty) return

    const customerIds = followsSnap.docs.map(d => d.data().customerId as string)

    // Fetch FCM tokens
    const tokenSnaps = await Promise.all(
      customerIds.map(uid => admin.firestore().doc(`pushTokens/${uid}`).get())
    )
    const tokens = tokenSnaps
      .filter(s => s.exists)
      .map(s => s.data()!.fcmToken as string)
      .filter(Boolean)

    if (tokens.length === 0) return

    const notifTitle = `${storeName} listed a new box`
    const notifBody = `${title} — ${price.toLocaleString('vi-VN')} đ. Grab it before it's gone!`

    // Send FCM multicast
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: notifTitle, body: notifBody },
      data: { listingId, vendorId },
    })

    // Write notification items
    const batch = admin.firestore().batch()
    for (const uid of customerIds) {
      const ref = admin.firestore()
        .collection('notifications').doc(uid)
        .collection('items').doc()
      batch.set(ref, {
        title: notifTitle,
        body: notifBody,
        listingId,
        vendorId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()
  })
```

- [ ] **Step 6: Export new functions from `functions/src/index.ts`**

Add these two lines to the existing exports:
```ts
export { savePushToken } from './savePushToken'
export { onListingPublished } from './onListingPublished'
```

- [ ] **Step 7: Call `savePushToken` on customer login**

In `src/pages/auth/LoginPage.tsx`, after `navigate('/browse')` in the success path, add:
```tsx
import { savePushToken } from '../../services/pushNotifications'
// inside handleSubmit, after navigate:
savePushToken().catch(() => {}) // fire-and-forget, non-blocking
```

- [ ] **Step 8: Compile Cloud Functions**

```bash
cd functions && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add public/firebase-messaging-sw.js src/services/notifications.ts src/services/pushNotifications.ts functions/src/savePushToken.ts functions/src/onListingPublished.ts functions/src/index.ts src/pages/auth/LoginPage.tsx
git commit -m "feat: add FCM push notifications — savePushToken + onListingPublished Cloud Functions"
```

---

### Task 12: Stripe Subscription Backend

**Files:**
- Create: `functions/src/createStripeSubscription.ts`
- Create: `functions/src/stripeSubscriptionWebhook.ts`
- Create: `functions/src/cancelSubscription.ts`
- Create: `src/services/subscriptions.ts`
- Modify: `functions/src/index.ts`

**Stripe plan prices (runtime `price_data`):**
- `weekly`: 49000 VND / week
- `monthly`: 179000 VND / month

- [ ] **Step 1: Create `functions/src/createStripeSubscription.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })

const PLANS: Record<string, { amount: number; interval: Stripe.PriceCreateParams.Recurring.Interval }> = {
  weekly:  { amount: 49000,  interval: 'week' },
  monthly: { amount: 179000, interval: 'month' },
}

export const createStripeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const { plan } = data as { plan: 'weekly' | 'monthly' }
  if (!PLANS[plan]) throw new functions.https.HttpsError('invalid-argument', 'Invalid plan')

  const uid = context.auth.uid
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.data()!

  // Find or create Stripe customer
  let stripeCustomerId: string | undefined = userData.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: userData.displayName,
      metadata: { uid },
    })
    stripeCustomerId = customer.id
    await admin.firestore().doc(`users/${uid}`).update({ stripeCustomerId })
  }

  const { amount, interval } = PLANS[plan]

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{
      price_data: {
        currency: 'vnd',
        unit_amount: amount,
        recurring: { interval },
        product_data: { name: `MysteryBoxFreshFood ${plan} plan` },
      },
    }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  const invoice = subscription.latest_invoice as Stripe.Invoice
  const intent = invoice.payment_intent as Stripe.PaymentIntent

  // Write pending subscription doc
  await admin.firestore().collection('subscriptions').add({
    customerId: uid,
    plan,
    stripeSubscriptionId: subscription.id,
    status: 'active',
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { clientSecret: intent.client_secret }
})
```

- [ ] **Step 2: Create `functions/src/stripeSubscriptionWebhook.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
const endpointSecret: string = functions.config().stripe.subscription_webhook_secret

export const stripeSubscriptionWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  } catch {
    res.status(400).send('Webhook signature verification failed')
    return
  }

  const db = admin.firestore()

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = invoice.subscription as string
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get()
    if (!snap.empty) {
      const sub = await stripe.subscriptions.retrieve(subId)
      await snap.docs[0].ref.update({
        status: 'active',
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subId = invoice.subscription as string
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get()
    if (!snap.empty) await snap.docs[0].ref.update({ status: 'past_due' })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', sub.id).limit(1).get()
    if (!snap.empty) await snap.docs[0].ref.update({ status: 'cancelled' })
  }

  res.json({ received: true })
})
```

- [ ] **Step 3: Create `functions/src/cancelSubscription.ts`**

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required')

  const { subscriptionId } = data as { subscriptionId: string }
  const uid = context.auth.uid

  const snap = await admin.firestore()
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .where('customerId', '==', uid)
    .limit(1)
    .get()

  if (snap.empty) throw new functions.https.HttpsError('not-found', 'Subscription not found')

  await stripe.subscriptions.cancel(subscriptionId)
  await snap.docs[0].ref.update({ status: 'cancelled' })
  return { ok: true }
})
```

- [ ] **Step 4: Create `src/services/subscriptions.ts`**

```ts
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
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

export async function createSubscription(plan: SubscriptionPlan): Promise<{ clientSecret: string }> {
  const fn = httpsCallable<{ plan: SubscriptionPlan }, { clientSecret: string }>(functions, 'createStripeSubscription')
  const result = await fn({ plan })
  return result.data
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const fn = httpsCallable(functions, 'cancelSubscription')
  await fn({ subscriptionId })
}
```

- [ ] **Step 5: Export new functions**

Add to `functions/src/index.ts`:
```ts
export { createStripeSubscription } from './createStripeSubscription'
export { stripeSubscriptionWebhook } from './stripeSubscriptionWebhook'
export { cancelSubscription } from './cancelSubscription'
```

- [ ] **Step 6: Compile Cloud Functions**

```bash
cd functions && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add functions/src/createStripeSubscription.ts functions/src/stripeSubscriptionWebhook.ts functions/src/cancelSubscription.ts functions/src/index.ts src/services/subscriptions.ts
git commit -m "feat: add Stripe subscription Cloud Functions and subscriptions service"
```

---

### Task 13: SubscriptionsPage

**Files:**
- Create: `src/pages/customer/SubscriptionsPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

**Interfaces — Consumes:**
- `getFollows(uid)` from `src/services/follows.ts`
- `toggleNotifications(followId, enabled)` from `src/services/follows.ts`
- `unfollowVendor(followId)` from `src/services/follows.ts`
- `getSubscription(uid)` from `src/services/subscriptions.ts`
- `createSubscription(plan)` from `src/services/subscriptions.ts`
- `cancelSubscription(subId)` from `src/services/subscriptions.ts`
- `GradientButton`, `GhostButton`, `StatusChip` from shared components
- `Follow`, `Subscription` types

- [ ] **Step 1: Create `src/pages/customer/SubscriptionsPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getFollows, unfollowVendor, toggleNotifications } from '../../services/follows'
import { getSubscription, createSubscription, cancelSubscription } from '../../services/subscriptions'
import { GradientButton } from '../../components/shared/GradientButton'
import { GhostButton } from '../../components/shared/GhostButton'
import { StatusChip } from '../../components/shared/StatusChip'
import type { Follow, Subscription, SubscriptionPlan } from '../../types'
import { Bell, BellOff, Trash2 } from 'lucide-react'

const PLANS: Array<{ key: SubscriptionPlan; priceLabel: string; features: string[] }> = [
  {
    key: 'free',
    priceLabel: t => t('subs.planFreePrice'),
    features: ['subs.featureFollow', 'subs.featureNotify'],
  },
  {
    key: 'weekly',
    priceLabel: t => '49.000 đ / tuần',
    features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly'],
  },
  {
    key: 'monthly',
    priceLabel: t => '179.000 đ / tháng',
    features: ['subs.featureFollow', 'subs.featureNotify', 'subs.featurePriority', 'subs.featureWeekly', 'subs.featureVoucher'],
  },
]

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const { userProfile } = useAuth()
  const [follows, setFollows] = useState<Follow[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!userProfile) return
    getFollows(userProfile.uid).then(setFollows)
    getSubscription(userProfile.uid).then(setSubscription)
  }, [userProfile])

  const handleToggleNotif = async (follow: Follow) => {
    await toggleNotifications(follow.id, !follow.notificationsEnabled)
    setFollows(prev => prev.map(f => f.id === follow.id ? { ...f, notificationsEnabled: !f.notificationsEnabled } : f))
  }

  const handleUnfollow = async (follow: Follow) => {
    await unfollowVendor(follow.id)
    setFollows(prev => prev.filter(f => f.id !== follow.id))
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free') return
    setLoadingPlan(plan)
    try {
      const { clientSecret } = await createSubscription(plan)
      // In production: show Stripe Payment Element with clientSecret
      // For prototype: log and reload
      console.log('Stripe clientSecret:', clientSecret)
      alert(t('subs.stripeRedirect'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!subscription?.stripeSubscriptionId) return
    setCancelling(true)
    try {
      await cancelSubscription(subscription.stripeSubscriptionId)
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section A: Followed Vendors */}
      <section className="mb-12">
        <h2 className="text-headline-md font-bold text-on-surface mb-4">{t('subs.followedVendors')}</h2>
        {follows.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant text-body-lg">{t('subs.noFollows')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {follows.map(follow => (
              <div
                key={follow.id}
                className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
                  {follow.vendorId.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-semibold text-body-sm truncate">{follow.vendorId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleNotif(follow)}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
                    title={follow.notificationsEnabled ? t('subs.muteNotif') : t('subs.enableNotif')}
                  >
                    {follow.notificationsEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} />}
                  </button>
                  <button
                    onClick={() => handleUnfollow(follow)}
                    className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error-token"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section B: Plans */}
      <section>
        {/* Hero */}
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center gap-2 bg-surface-variant border border-outline-variant rounded-full px-4 py-1.5 text-label-caps text-on-surface uppercase tracking-wider">
            ★ {t('subs.vipAccess')}
          </span>
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-bold">
            {t('subs.elevate')}{' '}
            <span className="gradient-text">{t('subs.experience')}</span>
          </h2>
          <p className="text-on-surface-variant text-body-lg max-w-md">{t('subs.heroSubtitle')}</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(({ key, features }) => {
            const isActive = subscription?.plan === key && subscription?.status === 'active'
            const priceMap: Record<SubscriptionPlan, string> = {
              free:    t('subs.planFreePrice'),
              weekly:  '49.000 đ / tuần',
              monthly: '179.000 đ / tháng',
            }
            return (
              <div
                key={key}
                className={`bg-surface-container border rounded-xl p-5 flex flex-col gap-4 ${isActive ? 'gradient-border-box' : 'border-outline-variant'}`}
              >
                {isActive && (
                  <StatusChip variant="emerald">{t('subs.active')}</StatusChip>
                )}
                <div>
                  <h3 className="text-headline-md font-bold text-on-surface capitalize">{t(`subs.plan_${key}`)}</h3>
                  <p className="text-primary font-bold text-mono-stat mt-1">{priceMap[key]}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="text-emerald-400">✓</span>
                      {t(f)}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <div className="flex flex-col gap-2">
                    {subscription?.currentPeriodEnd && (
                      <p className="text-xs text-on-surface-variant">
                        {t('subs.renewsOn')} {new Date(subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                    <GhostButton onClick={handleCancel} disabled={cancelling} className="w-full">
                      {cancelling ? t('subs.cancelling') : t('subs.cancel')}
                    </GhostButton>
                  </div>
                ) : key === 'free' ? (
                  <GhostButton className="w-full" disabled>{t('subs.currentFree')}</GhostButton>
                ) : (
                  <GradientButton
                    onClick={() => handleSubscribe(key)}
                    disabled={loadingPlan === key}
                    className="w-full"
                  >
                    {loadingPlan === key ? t('subs.subscribing') : t('subs.subscribe')}
                  </GradientButton>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Add route to `src/App.tsx`**

Add import:
```tsx
import SubscriptionsPage from './pages/customer/SubscriptionsPage'
```

Inside the customer `<Route>` block, add:
```tsx
<Route path="/subscriptions" element={<SubscriptionsPage />} />
```

- [ ] **Step 3: Add i18n keys to `src/locales/en/translation.json`**

Add a new top-level `"subs"` key:
```json
"subs": {
  "followedVendors": "Vendors You Follow",
  "noFollows": "Follow vendors to get notified when they list new boxes.",
  "muteNotif": "Mute notifications",
  "enableNotif": "Enable notifications",
  "vipAccess": "VIP Access",
  "elevate": "Elevate Your",
  "experience": "Experience",
  "heroSubtitle": "Unlock exclusive perks, priority pickup, and weekly mystery boxes.",
  "plan_free": "Free",
  "plan_weekly": "Weekly",
  "plan_monthly": "Monthly",
  "planFreePrice": "Free forever",
  "featureFollow": "Follow your favourite vendors",
  "featureNotify": "Push notifications for new boxes",
  "featurePriority": "Priority pickup slot",
  "featureWeekly": "Guaranteed weekly box",
  "featureVoucher": "Monthly discount voucher",
  "active": "Active",
  "renewsOn": "Renews",
  "cancel": "Cancel Plan",
  "cancelling": "Cancelling…",
  "currentFree": "Current Plan",
  "subscribe": "Subscribe",
  "subscribing": "Redirecting…",
  "stripeRedirect": "Stripe payment coming soon in production."
}
```

In `src/locales/vi/translation.json`, add corresponding Vietnamese translations.

Also add `"subscriptions": "Subscriptions"` to the `"nav"` section in both locale files.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/SubscriptionsPage.tsx src/App.tsx src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: add SubscriptionsPage — follow vendors + weekly/monthly Stripe plans"
```
