import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MysteryCard } from './MysteryCard'
import type { Listing } from '../../types'
import { Timestamp } from 'firebase/firestore'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('../../hooks/useCountdown', () => ({
  useCountdown: () => ({ hoursLeft: 2, minutesLeft: 30, urgent: false, expired: false }),
}))

const mockListing: Listing = {
  id: 'l1',
  vendorId: 'v1',
  type: 'mystery_box',
  title: 'Artisan Pastry Box',
  description: 'Fresh pastries',
  price: 35000,
  originalPrice: 58000,
  quantityTotal: 10,
  quantityRemaining: 3,
  pickupStart: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
  pickupEnd: { seconds: (Date.now() + 7200000) / 1000, nanoseconds: 0 } as Timestamp,
  category: 'bakery',
  imageUrl: '',
  status: 'active',
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
}

describe('MysteryCard', () => {
  test('renders listing title', () => {
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('Artisan Pastry Box')).toBeInTheDocument()
  })

  test('renders discount badge', () => {
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText(/-39%|-40%/)).toBeInTheDocument()
  })

  test('calls onClick when card is clicked', () => {
    const fn = vi.fn()
    render(<MemoryRouter><MysteryCard listing={mockListing} onClick={fn} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('article'))
    expect(fn).toHaveBeenCalledOnce()
  })

  test('shows sold out overlay when status is sold_out', () => {
    render(<MemoryRouter><MysteryCard listing={{ ...mockListing, status: 'sold_out' }} onClick={vi.fn()} /></MemoryRouter>)
    expect(screen.getByText('listing.soldOut')).toBeInTheDocument()
  })
})
