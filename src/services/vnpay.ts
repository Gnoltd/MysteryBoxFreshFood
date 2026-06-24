import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateVNPayOrder(
  listingId: string,
  quantity: number
): Promise<{ url: string; orderId: string }> {
  const fn = httpsCallable<
    { listingId: string; quantity: number },
    { url: string; orderId: string }
  >(functions, 'createVNPayOrder')
  const result = await fn({ listingId, quantity })
  return result.data
}
