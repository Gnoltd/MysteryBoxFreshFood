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

export type ListingCategory = 'bakery' | 'fruit' | 'vegetables' | 'dairy' | 'meat' | 'drinks' | 'other'
export type ListingStatus = 'active' | 'sold_out' | 'expired'
export type OrderStatus = 'pending' | 'paid' | 'picked_up' | 'cancelled' | 'pending_cod' | 'pending_bank_transfer' | 'refunded'
export type PaymentMethod = 'stripe' | 'cod' | 'bank_transfer'

export interface BoxItem {
  name: string
  qty: number
}

export interface Listing {
  id: string
  vendorId: string
  vendorName?: string
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
  packedAt?: Timestamp
  boxContents?: BoxItem[]
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
  stripePaymentIntentId?: string
  pickupEnd?: Timestamp
  boxContents?: BoxItem[]
  createdAt: Timestamp
}

export interface InventoryItem {
  id: string
  name: string
  category: ListingCategory
  unitPrice: number
  unit: string
  defaultQty: number
  bestBefore: Timestamp | null
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

export type SubscriptionPlan = 'free' | 'weekly' | 'monthly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due'

export interface Follow {
  id: string
  customerId: string
  vendorId: string
  notificationsEnabled: boolean
  createdAt: Timestamp
}

export interface Subscription {
  id: string
  customerId: string
  plan: SubscriptionPlan
  stripeSubscriptionId?: string
  status: SubscriptionStatus
  currentPeriodEnd?: Timestamp
  createdAt: Timestamp
}

export interface PushToken {
  fcmToken: string
  updatedAt: Timestamp
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  listingId: string
  vendorId: string
  read: boolean
  createdAt: Timestamp
}
