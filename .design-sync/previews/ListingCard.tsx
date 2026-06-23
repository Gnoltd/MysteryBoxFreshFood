import { ListingCard } from 'mysterybox'

const now = Math.floor(Date.now() / 1000)

const mockListing = {
  id: '1',
  vendorId: 'vendor1',
  vendorName: 'Saigon Bakery',
  type: 'mystery_box',
  title: 'Saigon Bakery Mystery Box',
  description: 'Assorted fresh pastries and artisan bread',
  price: 35000,
  originalPrice: 80000,
  quantityTotal: 10,
  quantityRemaining: 5,
  pickupStart: { seconds: now + 3600, nanoseconds: 0 },
  pickupEnd: { seconds: now + 7200, nanoseconds: 0 },
  category: 'bakery',
  imageUrl: '',
  status: 'active',
  createdAt: { seconds: now - 3600, nanoseconds: 0 },
} as any

const soldOutListing = {
  ...mockListing,
  id: '2',
  title: 'Pho Hung Noodle Box',
  price: 45000,
  originalPrice: 100000,
  quantityRemaining: 0,
  status: 'sold_out',
} as any

export function Default() {
  return (
    <div style={{ width: 320 }}>
      <ListingCard listing={mockListing} href="/listing/1" />
    </div>
  )
}

export function SoldOut() {
  return (
    <div style={{ width: 320 }}>
      <ListingCard listing={soldOutListing} href="/listing/2" />
    </div>
  )
}

export function Grid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 660 }}>
      <ListingCard listing={mockListing} href="/listing/1" />
      <ListingCard listing={soldOutListing} href="/listing/2" />
    </div>
  )
}
