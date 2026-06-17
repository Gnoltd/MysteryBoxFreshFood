import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function initiateLocalOrder(
  listingId: string,
  quantity: number,
  paymentMethod: 'cod' | 'bank_transfer'
): Promise<{ orderId: string }> {
  const fn = httpsCallable<
    { listingId: string; quantity: number; paymentMethod: 'cod' | 'bank_transfer' },
    { orderId: string }
  >(functions, 'createLocalOrder')
  const result = await fn({ listingId, quantity, paymentMethod })
  return result.data
}

export async function changeOrderPayment(
  orderId: string,
  paymentMethod: 'cod' | 'bank_transfer'
): Promise<void> {
  const fn = httpsCallable<
    { orderId: string; paymentMethod: 'cod' | 'bank_transfer' },
    { success: boolean }
  >(functions, 'changeOrderPayment')
  await fn({ orderId, paymentMethod })
}
