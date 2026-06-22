import { useTranslation } from 'react-i18next'
import { TimerBadge } from './TimerBadge'
import { StockBadge } from './StockBadge'
import type { Listing } from '../../types'

interface MysteryCardProps {
  listing: Listing
  onClick: () => void
}

export function MysteryCard({ listing, onClick }: MysteryCardProps) {
  const { t } = useTranslation()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)

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
          : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
        {/* Discount badge */}
        <span className="absolute top-2 right-2 bg-error-container text-on-error-container text-label-caps font-bold px-2 py-0.5 rounded-full shadow-lg">
          -{discount}%
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
      <div className="p-3 flex flex-col gap-2">
        <p className="font-semibold text-on-surface text-body-sm truncate">{listing.title}</p>
        <p className="text-on-surface-variant text-xs truncate">{listing.category}</p>
        <div className="flex items-center justify-between mt-auto">
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
