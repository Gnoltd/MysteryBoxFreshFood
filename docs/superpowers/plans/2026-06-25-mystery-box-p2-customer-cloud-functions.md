# Mystery Box Selection & Distribution — Plan 2: Customer Side + Cloud Functions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add customer box selection on ListingDetailPage, box reveal after Stripe/VNPAY payment, and Cloud Function updates for atomic box assignment + post-pickup discount.

**Architecture:** Customer picks a box number before checkout; it flows through the callable function into the order doc as `requestedBoxNumber`. Payment webhooks (stripeWebhook, vnpayIPN) atomically assign the box in a Firestore transaction — first-payment-wins with auto-reassignment. A new Firestore trigger `onOrderPickedUp` fires after QR scan and issues a discount + push notification when the box was below average value.

**Tech Stack:** React + TypeScript, Firebase Firestore, Firebase Cloud Functions (Node.js), Stripe SDK, react-i18next

## Global Constraints

- Requires Plan 1 to be merged first (types, BoxPlan, formatBoxItem must exist)
- No Firebase imports directly in components — use services only
- COD and bank_transfer orders: no box selection, no reveal
- All user-visible strings use `t('key')` — no hardcoded text
- Cloud Functions TypeScript: compile with `cd functions && npm run build`

---

### Task 1: Client services — pass boxNumber through checkout

**Files:**
- Modify: `src/services/stripe.ts`
- Modify: `src/services/vnpay.ts`

**Interfaces:**
- Produces:
  - `initiateCheckout(listingId: string, quantity: number, boxNumber?: number): Promise<void>`
  - `initiateVNPayOrder(listingId: string, quantity: number, boxNumber?: number): Promise<{ url: string; orderId: string }>`

- [ ] **Step 1: Update stripe.ts**

Replace `src/services/stripe.ts` with:

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateCheckout(
  listingId: string,
  quantity: number,
  boxNumber?: number,
): Promise<void> {
  const fn = httpsCallable<
    { listingId: string; quantity: number; boxNumber?: number },
    { url: string; orderId: string }
  >(functions, 'createCheckoutSession')
  const result = await fn({ listingId, quantity, ...(boxNumber != null ? { boxNumber } : {}) })
  window.location.href = result.data.url
}
```

- [ ] **Step 2: Update vnpay.ts**

Replace `src/services/vnpay.ts` with:

```ts
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateVNPayOrder(
  listingId: string,
  quantity: number,
  boxNumber?: number,
): Promise<{ url: string; orderId: string }> {
  const fn = httpsCallable<
    { listingId: string; quantity: number; boxNumber?: number },
    { url: string; orderId: string }
  >(functions, 'createVNPayOrder')
  const result = await fn({ listingId, quantity, ...(boxNumber != null ? { boxNumber } : {}) })
  return result.data
}
```

- [ ] **Step 3: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/stripe.ts src/services/vnpay.ts
git commit -m "feat: pass boxNumber through stripe and vnpay checkout service calls"
```

---

### Task 2: ListingDetailPage — inline box selector

**Files:**
- Modify: `src/pages/customer/ListingDetailPage.tsx`

**Interfaces:**
- Consumes: `BoxPlan` from `src/types` (from listing.boxPlans)
- Consumes: updated `initiateCheckout`, `initiateVNPayOrder` from services

- [ ] **Step 1: Add selectedBox state and pass boxNumber to checkout**

In `src/pages/customer/ListingDetailPage.tsx`, add state after `payMethod`:

```ts
const [selectedBox, setSelectedBox] = useState<number | null>(null)
```

Update `handleClaim` to pass `selectedBox`:

```ts
const handleClaim = async () => {
  if (!listing) return
  setLoading(true)
  try {
    if (payMethod === 'card') {
      await initiateCheckout(listing.id, 1, selectedBox ?? undefined)
    } else if (payMethod === 'vnpay') {
      const { url } = await initiateVNPayOrder(listing.id, 1, selectedBox ?? undefined)
      window.location.href = url
    } else {
      const { orderId } = await initiateLocalOrder(listing.id, 1, payMethod as 'cod' | 'bank_transfer')
      navigate(`/orders/${orderId}`)
    }
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Add box selector inline with category chip**

In the info grid section (where category is displayed), replace the category cell `{ label: t('listing.category'), value: <StatusChip ...> }` with:

```tsx
{
  label: t('listing.category'),
  value: (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusChip variant="slate">{listing.category}</StatusChip>
      {listing.boxPlans && listing.boxPlans.length > 0 && (
        <>
          {listing.boxPlans
            .filter(p => !p.takenByOrderId)
            .map(p => (
              <button
                key={p.boxNumber}
                onClick={() => setSelectedBox(prev => prev === p.boxNumber ? null : p.boxNumber)}
                className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${
                  selectedBox === p.boxNumber
                    ? 'bg-primary text-white border-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                }`}
              >
                {t('listing.box_number', { n: p.boxNumber })}
              </button>
            ))}
        </>
      )}
    </div>
  ),
},
```

- [ ] **Step 3: Disable buy button unless box selected (for Stripe/VNPAY only)**

Update `soldOut` logic used by the GradientButton disabled prop:

```ts
const hasBoxPlans = (listing.boxPlans?.length ?? 0) > 0
const availableBoxes = listing.boxPlans?.filter(p => !p.takenByOrderId) ?? []
const boxSelectionRequired = hasBoxPlans && (payMethod === 'card' || payMethod === 'vnpay')
const boxNotSelected = boxSelectionRequired && selectedBox === null
```

Update the GradientButton:

```tsx
<GradientButton
  onClick={handleClaim}
  disabled={soldOut || loading || boxNotSelected}
  className="w-full"
>
  {soldOut
    ? t('listing.soldOut')
    : loading
    ? t('listing.claiming')
    : boxNotSelected
    ? t('listing.selectBoxFirst')
    : `${t('listing.buyNow')} — ${listing.price.toLocaleString('vi-VN')} đ`}
</GradientButton>
```

- [ ] **Step 4: Show COD note for box selection not available**

After the existing `{payMethod === 'cod' && ...}` note block, add:

```tsx
{(payMethod === 'cod' || payMethod === 'bank_transfer') && hasBoxPlans && (
  <div className="bg-surface-container border border-outline-variant rounded-lg p-3 text-body-sm text-on-surface-variant mt-2">
    {t('listing.boxSelectionCashOnly')}
  </div>
)}
```

Also, when `payMethod` changes to `cod` or `bank_transfer`, clear selectedBox:

```ts
const handlePayMethod = (key: PayMethod) => {
  setPayMethod(key)
  if (key === 'cod' || key === 'bank_transfer') setSelectedBox(null)
}
```

Replace `onClick={() => setPayMethod(key)}` with `onClick={() => handlePayMethod(key)}` in the payment method buttons.

- [ ] **Step 5: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/ListingDetailPage.tsx
git commit -m "feat: inline box selector on listing detail page; passes boxNumber to checkout"
```

---

### Task 3: Reveal card on CheckoutSuccessPage and OrderDetailPage

**Files:**
- Modify: `src/pages/customer/CheckoutSuccessPage.tsx`
- Modify: `src/pages/customer/OrderDetailPage.tsx`

**Interfaces:**
- Consumes: `formatBoxItem` from `src/utils/boxDistribution`
- Consumes: `Order.boxContents`, `Order.boxNumber`, `Order.boxReassigned`, `Order.originalBoxNumber`, `Order.paymentMethod`

- [ ] **Step 1: Add BoxRevealCard component inline in CheckoutSuccessPage**

In `src/pages/customer/CheckoutSuccessPage.tsx`, add the import:

```ts
import { formatBoxItem } from '../../utils/boxDistribution'
```

Add a helper component at the top of the file (before `export default`):

```tsx
function BoxRevealCard({ order }: { order: Order }) {
  const { t } = useTranslation()
  const revealable = order.paymentMethod === 'stripe' || order.paymentMethod === 'vnpay'
  if (!revealable || !order.boxContents?.length) return null
  return (
    <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
      {order.boxReassigned && (
        <p className="text-amber-400 text-xs mb-3">
          {t('order.boxReassigned', { original: order.originalBoxNumber, got: order.boxNumber })}
        </p>
      )}
      <p className="text-primary font-semibold text-sm mb-3">
        🎁 {t('order.boxRevealTitle', { n: order.boxNumber })}
      </p>
      <ul className="space-y-1">
        {order.boxContents.map(item => (
          <li key={item.name} className="text-on-surface-variant text-sm">
            {formatBoxItem(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Inside the main JSX, after the `<StatusChip>` and before the View Order button, add:

```tsx
{order && <BoxRevealCard order={order} />}
```

- [ ] **Step 2: Add same reveal to OrderDetailPage**

In `src/pages/customer/OrderDetailPage.tsx`, add the import:

```ts
import { formatBoxItem } from '../../utils/boxDistribution'
```

Add the same `BoxRevealCard` component (copy from Step 1) at the top of the file before `export default`.

Find a logical place in the OrderDetailPage JSX (after the QR code section, before reviews) and add:

```tsx
{order && <BoxRevealCard order={order} />}
```

- [ ] **Step 3: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/customer/CheckoutSuccessPage.tsx src/pages/customer/OrderDetailPage.tsx
git commit -m "feat: box reveal card on checkout success and order detail pages"
```

---

### Task 4: createCheckoutSession — accept boxNumber, store requestedBoxNumber

**Files:**
- Modify: `functions/src/createCheckoutSession.ts`

- [ ] **Step 1: Update function signature and order creation**

Replace `functions/src/createCheckoutSession.ts` with:

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const createCheckoutSession = functions.https.onCall(
  async (
    data: { listingId: string; quantity: number; boxNumber?: number },
    context: functions.https.CallableContext,
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const { listingId, quantity, boxNumber } = data
    const customerId = context.auth.uid
    const db = admin.firestore()
    const stripe = getStripe()

    const listingRef = db.collection('listings').doc(listingId)
    const listingSnap = await listingRef.get()
    if (!listingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Listing not found')
    }
    const listing = listingSnap.data()!

    if (listing.quantityRemaining < quantity) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough stock')
    }

    // Check for active discount
    let discountedPrice = listing.price
    let discountId: string | undefined
    const discountSnap = await db
      .collection('discounts')
      .doc(customerId)
      .collection('codes')
      .where('used', '==', false)
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .orderBy('expiresAt', 'asc')
      .limit(1)
      .get()
    if (!discountSnap.empty) {
      const discount = discountSnap.docs[0]
      discountId = discount.id
      const pct = discount.data().percent as number
      discountedPrice = Math.round(listing.price * (1 - pct / 100))
    }

    const appUrl = 'https://mystery-box-fresh-food.vercel.app'
    const orderId = db.collection('orders').doc().id

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'vnd',
          product_data: { name: listing.title, description: listing.description },
          unit_amount: discountedPrice,
        },
        quantity,
      }],
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        orderId,
        listingId,
        customerId,
        vendorId: listing.vendorId,
        quantity: String(quantity),
        ...(boxNumber != null ? { requestedBoxNumber: String(boxNumber) } : {}),
        ...(discountId ? { discountId } : {}),
      },
    })

    await db.collection('orders').doc(orderId).set({
      customerId,
      vendorId: listing.vendorId,
      listingId,
      listingTitle: listing.title,
      quantity,
      totalPrice: discountedPrice * quantity,
      status: 'pending',
      paymentMethod: 'stripe',
      qrCode: uuidv4(),
      stripeSessionId: session.id,
      pickupEnd: listing.pickupEnd,
      boxContents: listing.boxContents ?? [],
      ...(boxNumber != null ? { requestedBoxNumber: boxNumber } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (!session.url) throw new functions.https.HttpsError('internal', 'No checkout URL returned')
    return { url: session.url, orderId }
  },
)
```

- [ ] **Step 2: Build functions**

```bash
cd functions && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/createCheckoutSession.ts
git commit -m "feat: createCheckoutSession accepts boxNumber and applies active discount"
```

---

### Task 5: createVNPayOrder — accept boxNumber, apply discount

**Files:**
- Modify: `functions/src/createVNPayOrder.ts`

- [ ] **Step 1: Add boxNumber param and discount logic**

In `functions/src/createVNPayOrder.ts`, update the function signature:

```ts
async (data: { listingId: string; quantity: number; boxNumber?: number }, context: functions.https.CallableContext) => {
```

After `listing.quantityRemaining` check, add discount logic (before building the VNPAY URL):

```ts
// Check for active discount
let discountedPrice = listing.price as number
let discountId: string | undefined
const discountSnap = await db
  .collection('discounts')
  .doc(customerId)
  .collection('codes')
  .where('used', '==', false)
  .where('expiresAt', '>', admin.firestore.Timestamp.now())
  .orderBy('expiresAt', 'asc')
  .limit(1)
  .get()
if (!discountSnap.empty) {
  const discount = discountSnap.docs[0]
  discountId = discount.id
  const pct = discount.data().percent as number
  discountedPrice = Math.round(listing.price * (1 - pct / 100))
}
```

In the existing `db.collection('orders').doc(orderId).set({...})` call, replace `totalPrice: listing.price * quantity` with `totalPrice: discountedPrice * quantity` and add box fields:

```ts
...(data.boxNumber != null ? { requestedBoxNumber: data.boxNumber } : {}),
```

In the VNPAY params, replace `vnp_Amount: String(listing.price * quantity * 100)` with `String(discountedPrice * quantity * 100)`.

- [ ] **Step 2: Build functions**

```bash
cd functions && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/createVNPayOrder.ts
git commit -m "feat: createVNPayOrder accepts boxNumber and applies active discount"
```

---

### Task 6: stripeWebhook — atomic box assignment transaction

**Files:**
- Modify: `functions/src/stripeWebhook.ts`

- [ ] **Step 1: Add box assignment to the transaction**

Replace `functions/src/stripeWebhook.ts` with:

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(functions.config().stripe.secret_key, { apiVersion: '2023-10-16' })
}

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = functions.config().stripe.webhook_secret

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(400).send(`Webhook Error: ${message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { orderId, listingId, quantity, discountId } = session.metadata!
    const requestedBoxNumber = session.metadata!.requestedBoxNumber
      ? parseInt(session.metadata!.requestedBoxNumber)
      : undefined

    const db = admin.firestore()
    const orderRef   = db.collection('orders').doc(orderId)
    const listingRef = db.collection('listings').doc(listingId)

    await db.runTransaction(async t => {
      const [orderSnap, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
      if (!orderSnap.exists || !listingSnap.exists) return

      const listingData = listingSnap.data()!
      const boxPlans: Array<{
        boxNumber: number
        items: Array<{ name: string; qty: number; unit?: string }>
        value: number
        belowAverage: boolean
        takenByOrderId?: string
      }> = listingData.boxPlans ?? []

      // Box assignment
      let assignedBoxNumber: number | undefined
      let assignedItems: Array<{ name: string; qty: number; unit?: string }> | undefined
      let boxReassigned = false
      let originalBoxNumber: number | undefined
      let updatedPlans = boxPlans

      if (boxPlans.length > 0 && requestedBoxNumber != null) {
        // Try requested box first
        const requested = boxPlans.find(p => p.boxNumber === requestedBoxNumber && !p.takenByOrderId)
        const chosen = requested ?? boxPlans.find(p => !p.takenByOrderId)

        if (chosen) {
          assignedBoxNumber = chosen.boxNumber
          assignedItems = chosen.items
          if (!requested) {
            boxReassigned = true
            originalBoxNumber = requestedBoxNumber
          }
          updatedPlans = boxPlans.map(p =>
            p.boxNumber === chosen.boxNumber ? { ...p, takenByOrderId: orderId } : p,
          )
        }
      }

      const newQty = listingData.quantityRemaining - parseInt(quantity)
      const orderUpdate: Record<string, unknown> = {
        status: 'paid',
        stripePaymentIntentId: session.payment_intent as string,
      }
      if (assignedBoxNumber != null) {
        orderUpdate.boxNumber = assignedBoxNumber
        orderUpdate.boxContents = assignedItems
        if (boxReassigned) {
          orderUpdate.boxReassigned = true
          orderUpdate.originalBoxNumber = originalBoxNumber
        }
      }

      t.update(orderRef, orderUpdate)
      t.update(listingRef, {
        quantityRemaining: newQty,
        status: newQty <= 0 ? 'sold_out' : 'active',
        ...(updatedPlans !== boxPlans ? { boxPlans: updatedPlans } : {}),
      })
    })

    // Mark discount used (outside transaction — idempotent)
    if (discountId) {
      const customerId = session.metadata!.customerId
      await db
        .collection('discounts')
        .doc(customerId)
        .collection('codes')
        .doc(discountId)
        .update({ used: true })
    }
  }

  res.json({ received: true })
})
```

- [ ] **Step 2: Build functions**

```bash
cd functions && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/stripeWebhook.ts
git commit -m "feat: stripeWebhook atomically assigns box plan, handles reassignment"
```

---

### Task 7: vnpayIPN — atomic box assignment transaction

**Files:**
- Modify: `functions/src/vnpayIPN.ts`

- [ ] **Step 1: Add box assignment inside the existing success transaction**

In `functions/src/vnpayIPN.ts`, inside the `if (success)` block, replace the existing `db.runTransaction` with:

```ts
const listingRef = db.collection('listings').doc(order.listingId)
await db.runTransaction(async t => {
  const [freshOrder, listingSnap] = await Promise.all([t.get(orderRef), t.get(listingRef)])
  if (!freshOrder.exists || !listingSnap.exists) return
  if (freshOrder.data()!.status !== 'pending_vnpay') return

  const listingData = listingSnap.data()!
  const boxPlans: Array<{
    boxNumber: number
    items: Array<{ name: string; qty: number; unit?: string }>
    value: number
    belowAverage: boolean
    takenByOrderId?: string
  }> = listingData.boxPlans ?? []

  const requestedBoxNumber: number | undefined = freshOrder.data()!.requestedBoxNumber

  let assignedBoxNumber: number | undefined
  let assignedItems: Array<{ name: string; qty: number; unit?: string }> | undefined
  let boxReassigned = false
  let originalBoxNumber: number | undefined
  let updatedPlans = boxPlans

  if (boxPlans.length > 0 && requestedBoxNumber != null) {
    const requested = boxPlans.find(p => p.boxNumber === requestedBoxNumber && !p.takenByOrderId)
    const chosen = requested ?? boxPlans.find(p => !p.takenByOrderId)
    if (chosen) {
      assignedBoxNumber = chosen.boxNumber
      assignedItems = chosen.items
      if (!requested) { boxReassigned = true; originalBoxNumber = requestedBoxNumber }
      updatedPlans = boxPlans.map(p =>
        p.boxNumber === chosen.boxNumber ? { ...p, takenByOrderId: order.id } : p,
      )
    }
  }

  const newQty = listingData.quantityRemaining - order.quantity
  const orderUpdate: Record<string, unknown> = {
    status: 'paid',
    vnpayTransactionNo: params.vnp_TransactionNo ?? '',
  }
  if (assignedBoxNumber != null) {
    orderUpdate.boxNumber = assignedBoxNumber
    orderUpdate.boxContents = assignedItems
    if (boxReassigned) { orderUpdate.boxReassigned = true; orderUpdate.originalBoxNumber = originalBoxNumber }
  }

  t.update(orderRef, orderUpdate)
  t.update(listingRef, {
    quantityRemaining: newQty,
    status: newQty <= 0 ? 'sold_out' : 'active',
    ...(updatedPlans !== boxPlans ? { boxPlans: updatedPlans } : {}),
  })
})

// Mark discount used if one was applied
const discountId = orderSnap.data()!.discountId as string | undefined
if (discountId) {
  await db.collection('discounts').doc(order.customerId).collection('codes')
    .doc(discountId).update({ used: true })
}
```

Note: also store `discountId` on the order in `createVNPayOrder.ts` — add `...(discountId ? { discountId } : {})` to the order set call.

- [ ] **Step 2: Build functions**

```bash
cd functions && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/vnpayIPN.ts
git commit -m "feat: vnpayIPN atomically assigns box plan, handles reassignment"
```

---

### Task 8: onOrderPickedUp — post-pickup discount trigger

**Files:**
- Create: `functions/src/onOrderPickedUp.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Fires when `orders/{orderId}` status changes to `picked_up`
- Reads `Listing.boxPlans` to find if `belowAverage`
- Creates `discounts/{customerId}/codes/{id}`
- Sends FCM push notification using existing `users/{uid}/pushTokens` pattern

- [ ] **Step 1: Create onOrderPickedUp.ts**

Create `functions/src/onOrderPickedUp.ts`:

```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onOrderPickedUp = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change) => {
    const before = change.before.data()
    const after  = change.after.data()

    // Only fire when status transitions to picked_up
    if (before.status === after.status) return
    if (after.status !== 'picked_up') return
    if (after.boxNumber == null) return   // old listing, no box plans

    const db = admin.firestore()
    const listingSnap = await db.collection('listings').doc(after.listingId).get()
    if (!listingSnap.exists) return

    const boxPlans: Array<{ boxNumber: number; belowAverage: boolean }> =
      listingSnap.data()!.boxPlans ?? []

    const plan = boxPlans.find(p => p.boxNumber === after.boxNumber)
    if (!plan?.belowAverage) return   // box was fine — no discount needed

    // Create discount document
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db
      .collection('discounts')
      .doc(after.customerId)
      .collection('codes')
      .add({
        customerId: after.customerId,
        percent: 10,
        reason: 'low_value_box',
        used: false,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    // Send push notification using existing FCM pattern
    const tokenSnap = await db
      .collection('users')
      .doc(after.customerId)
      .collection('pushTokens')
      .limit(1)
      .get()
    if (tokenSnap.empty) return

    const token = tokenSnap.docs[0].data().fcmToken as string
    await admin.messaging().send({
      token,
      notification: {
        title: 'MysteryBox',
        body: "Sorry your box wasn't the best today — enjoy 10% off your next order! 🎁",
      },
      data: { type: 'low_value_discount' },
    })
  })
```

- [ ] **Step 2: Export from index.ts**

In `functions/src/index.ts`, add to the existing exports:

```ts
export { onOrderPickedUp } from './onOrderPickedUp'
```

- [ ] **Step 3: Build functions**

```bash
cd functions && npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add functions/src/onOrderPickedUp.ts functions/src/index.ts
git commit -m "feat: onOrderPickedUp trigger issues 10% discount when box was below average"
```

---

### Task 9: i18n — customer-side new keys

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/vi/translation.json`

- [ ] **Step 1: Add English keys**

In `src/locales/en/translation.json`, inside `"listing"` object, add:

```json
"box_number": "Box {{n}}",
"selectBoxFirst": "Select a box first",
"boxSelectionCashOnly": "Box selection and reveal are available for card and VNPAY payments only."
```

Inside `"order"` object, add:

```json
"boxRevealTitle": "Your Box {{n}} contained:",
"boxReassigned": "Box {{original}} was just taken — you got Box {{got}} instead"
```

- [ ] **Step 2: Add Vietnamese keys**

In `src/locales/vi/translation.json`, inside `"listing"` object, add:

```json
"box_number": "Hộp {{n}}",
"selectBoxFirst": "Chọn một hộp trước",
"boxSelectionCashOnly": "Chọn hộp và xem nội dung chỉ khả dụng với thanh toán thẻ và VNPAY."
```

Inside `"order"` object, add:

```json
"boxRevealTitle": "Hộp {{n}} của bạn chứa:",
"boxReassigned": "Hộp {{original}} vừa bị lấy — bạn nhận được Hộp {{got}} thay thế"
```

- [ ] **Step 3: Build check**

```bash
npm run build -- --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en/translation.json src/locales/vi/translation.json
git commit -m "feat: i18n keys for box selection, reveal, and reassignment notification"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Customer sees only available boxes (filter `!takenByOrderId`) — Task 2
- ✅ Box selector inline with category chip, flex-wrap for mobile — Task 2
- ✅ No box selector for COD/bank_transfer — Task 2
- ✅ Buy button disabled until box selected (Stripe/VNPAY only) — Task 2
- ✅ boxNumber passed through initiateCheckout / initiateVNPayOrder — Task 1
- ✅ requestedBoxNumber stored on order at session creation — Task 4, 5
- ✅ Atomic box assignment in stripeWebhook transaction — Task 6
- ✅ Atomic box assignment in vnpayIPN transaction — Task 7
- ✅ First-payment-wins: auto-reassign to next available box — Task 6, 7
- ✅ boxReassigned + originalBoxNumber written on order — Task 6, 7
- ✅ Reveal card shown on CheckoutSuccessPage after Stripe/VNPAY — Task 3
- ✅ Reveal card shown on OrderDetailPage — Task 3
- ✅ boxReassigned banner on reveal card — Task 3
- ✅ Active discount applied at checkout (Stripe + VNPAY) — Task 4, 5
- ✅ Discount marked used after payment — Task 6, 7
- ✅ onOrderPickedUp trigger: create discount + push when belowAverage — Task 8
- ✅ i18n for all new customer strings — Task 9

**Out of scope (not in Plan 2):**
- Per-box QR codes
- Customer-visible box value hints
- Retroactive migration of existing listings
