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
