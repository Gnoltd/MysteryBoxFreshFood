import { MysteryCard } from 'mysterybox'

const now = Math.floor(Date.now() / 1000)

const mockListing = {
  id: '1',
  vendorId: 'vendor1',
  vendorName: 'Saigon Bakery',
  type: 'mystery_box',
  title: 'Bakery Mystery Box – Fresh Pastries',
  description: 'Assorted fresh pastries and artisan bread from today\'s surplus',
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

export function WithRating() {
  return (
    <div style={{ width: 280 }}>
      <MysteryCard
        listing={mockListing}
        rating={{ avg: 4.5, count: 23 }}
        onClick={() => {}}
      />
    </div>
  )
}

export function NoRating() {
  return (
    <div style={{ width: 280 }}>
      <MysteryCard listing={mockListing} onClick={() => {}} />
    </div>
  )
}

export function SoldOut() {
  return (
    <div style={{ width: 280 }}>
      <MysteryCard
        listing={{ ...mockListing, status: 'sold_out', category: 'drinks' } as any}
        onClick={() => {}}
      />
    </div>
  )
}

export function Grid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 600 }}>
      <MysteryCard listing={mockListing} rating={{ avg: 4.8, count: 12 }} onClick={() => {}} />
      <MysteryCard listing={{ ...mockListing, category: 'drinks', title: 'Bubble Tea Mix Box' } as any} onClick={() => {}} />
    </div>
  )
}
