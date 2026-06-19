import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  role: 'vendor' | 'customer'
  displayName: string
  email: string
  lang: 'en' | 'vi'
  storeName?: string
  address?: string
  storeDescription?: string
  bankName?: string
  bankBin?: string
  bankAccount?: string
  bankAccountName?: string
}

export type ListingCategory = 'bakery' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
export type ListingStatus = 'active' | 'sold_out' | 'expired'
export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'cancelled' | 'pending_cod' | 'pending_bank_transfer'
export type PaymentMethod = 'stripe' | 'cod' | 'bank_transfer'

export interface Listing {
  id: string
  vendorId: string
  type: 'mystery_box' | 'item'
  title: string
  description: string
  price: number
  originalPrice: number
  quantityTotal: number
  quantityRemaining: number
  pickupStart: Timestamp
  pickupEnd: Timestamp
  category: ListingCategory
  imageUrl: string
  status: ListingStatus
  createdAt: Timestamp
  // Note: stripeProductId/stripePriceId omitted — prototype uses price_data at checkout time
}

export interface Order {
  id: string
  customerId: string
  vendorId: string
  listingId: string
  listingTitle: string
  quantity: number
  totalPrice: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  qrCode: string
  stripeSessionId?: string
  createdAt: Timestamp
}

export interface Review {
  id: string
  orderId: string
  listingId: string
  vendorId: string
  customerId: string
  rating: number
  comment: string
  createdAt: Timestamp
}
