import { useTranslation } from 'react-i18next'
import { TimerBadge } from './TimerBadge'
import { StockBadge } from './StockBadge'
import type { Listing, ListingCategory } from '../../types'

const CATEGORY_EMOJI: Record<ListingCategory, string> = {
  bakery: '🥐', fruit: '🍎', vegetables: '🥦', dairy: '🧀', meat: '🥩',
  drinks: '🧃', other: '📦',
}

const CATEGORY_IMAGE: Record<ListingCategory, string> = {
  bakery: '/images/categories/bakery.jpg',
  fruit: '/images/categories/fruit.jpg',
  vegetables: '/images/categories/vegetables.jpg',
  dairy: '/images/categories/dairy.jpg',
  meat: '/images/categories/meat.jpg',
  drinks: '/images/categories/drinks.jpg',
  other: '/images/categories/other.jpg',
}

interface MysteryCardProps {
  listing: Listing
  onClick: () => void
}

export function MysteryCard({ listing, onClick }: MysteryCardProps) {
  const { t } = useTranslation()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const emoji = CATEGORY_EMOJI[listing.category] ?? '📦'
  const categoryImage = CATEGORY_IMAGE[listing.category]

  return (
    <article
      role="article"
      onClick={onClick}
      className="mystery-border bg-surface-container border border-outline-variant rounded-b-xl overflow-hidden hover:border-primary transition-colors cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 bg-surface-container-high overflow-hidden">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="relative w-full h-full overflow-hidden">
              <img src={categoryImage} alt={listing.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/30" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80 text-[10px] font-bold tracking-widest uppercase">Mystery Box</span>
            </div>
          )}

        {/* Discount badge */}
        <span className="absolute top-2 right-2 bg-error-token text-on-error text-label-caps font-bold px-2 py-0.5 rounded-full shadow-lg">
          -{discount}%
        </span>

        {/* Category emoji top-left */}
        <span className="absolute top-2 left-2 bg-surface-container/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-sm">
          {emoji}
        </span>

        {/* Pickup timer badge overlay */}
        <div className="absolute bottom-2 left-2">
          <TimerBadge pickupEnd={listing.pickupEnd} />
        </div>

        {/* Sold out overlay */}
        {listing.status === 'sold_out' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-wider">{t('listing.soldOut')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="font-semibold text-on-surface text-body-sm truncate">{listing.title}</p>
        {listing.vendorName && (
          <p className="text-on-surface-variant text-xs truncate">{listing.vendorName}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-primary font-bold text-body-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-outline text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <StockBadge quantity={listing.quantityRemaining} />
        </div>
      </div>
    </article>
  )
}
