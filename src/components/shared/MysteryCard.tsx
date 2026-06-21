import { useTranslation } from 'react-i18next'
import { StatusChip } from './StatusChip'
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
      className="mystery-border bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-40 bg-surface-container-high overflow-hidden">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
        {/* Discount badge */}
        <span className="absolute top-2 left-2 bg-tertiary-container/20 backdrop-blur-sm border border-tertiary/50 text-tertiary text-label-caps font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </span>
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

        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary font-bold text-body-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-outline text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <StatusChip variant="slate">{listing.category}</StatusChip>
        </div>

        <div className="flex items-center justify-between">
          <TimerBadge pickupEnd={listing.pickupEnd} />
          <StockBadge quantity={listing.quantityRemaining} />
        </div>
      </div>
    </article>
  )
}
