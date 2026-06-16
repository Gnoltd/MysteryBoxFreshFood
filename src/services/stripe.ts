import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateCheckout(listingId: string, quantity: number): Promise<void> {
  const fn = httpsCallable<
    { listingId: string; quantity: number },
    { url: string; orderId: string }
  >(functions, 'createCheckoutSession')
  const result = await fn({ listingId, quantity })
  window.location.href = result.data.url
}
