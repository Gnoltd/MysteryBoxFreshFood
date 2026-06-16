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
}

export type ListingCategory = 'bakery' | 'rice' | 'noodles' | 'drinks' | 'snacks' | 'other'
export type ListingStatus = 'active' | 'sold_out' | 'expired'
export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'cancelled'

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
  qrCode: string
  stripeSessionId: string
  createdAt: Timestamp
}
