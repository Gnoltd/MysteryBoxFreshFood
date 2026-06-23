import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StockBadge } from './StockBadge'
import type { Listing, ListingCategory } from '../../types'
import { Clock, Star } from 'lucide-react'

const CATEGORY_ICON: Record<ListingCategory, string> = {
  bakery: '/images/icons/bakery.png',
  fruit: '/images/icons/fruit.png',
  vegetables: '/images/icons/vegetables.png',
  dairy: '/images/icons/dairy.png',
  meat: '/images/icons/meat.png',
  drinks: '/images/icons/drinks.png',
  other: '/images/icons/other.png',
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
  rating?: { avg: number; count: number }
  onClick: () => void
}

function useCountdown(endSeconds: number) {
  const [remaining, setRemaining] = useState(() => endSeconds - Math.floor(Date.now() / 1000))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(endSeconds - Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [endSeconds])

  return Math.max(0, remaining)
}

function formatTime(secs: number) {
  if (secs <= 0) return '00:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function MysteryCard({ listing, rating, onClick }: MysteryCardProps) {
  const { t } = useTranslation()
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const categoryIcon = CATEGORY_ICON[listing.category]
  const categoryImage = CATEGORY_IMAGE[listing.category]
  const remaining = useCountdown(listing.pickupEnd.seconds)
  const isUrgent = remaining > 0 && remaining < 3600 // under 1hr

  return (
    <article
      role="article"
      onClick={onClick}
      className="relative glass glow-border rounded-2xl overflow-hidden cursor-pointer card-hover group animate-fade-in-up"
    >
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-secondary-token/60 to-primary/60 z-10" />

      {/* Image */}
      <div className="relative h-48 bg-surface-container-high overflow-hidden">
        {listing.imageUrl
          ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
          : (
            <div className="relative w-full h-full overflow-hidden">
              <img src={categoryImage} alt={listing.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">Mystery Box</span>
            </div>
          )}

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Discount badge */}
        <span className="absolute top-2.5 right-2.5 bg-red-500/90 backdrop-blur-sm text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30">
          -{discount}%
        </span>

        {/* Category icon */}
        <span className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10">
          <img src={categoryIcon} alt={listing.category} className="w-8 h-8 object-contain" />
        </span>

        {/* Countdown timer */}
        {remaining > 0 && (
          <div className={`absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
            isUrgent
              ? 'bg-red-500/30 border-red-400/50 text-red-300 animate-urgency'
              : 'bg-black/40 border-white/10 text-white/80'
          }`}>
            <Clock size={11} className="shrink-0" />
            {formatTime(remaining)}
          </div>
        )}

        {/* Sold out */}
        {listing.status === 'sold_out' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white/90 font-black text-sm uppercase tracking-widest px-4 py-1.5 border border-white/20 rounded-full">
              {t('listing.soldOut')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <p className="font-bold text-on-surface text-sm truncate">{listing.title}</p>

        <div className="flex items-center justify-between">
          {listing.vendorName
            ? <p className="text-on-surface-variant text-xs truncate">{listing.vendorName}</p>
            : <span />}
          {rating && rating.count > 0 && (
            <span className="flex items-center gap-1 text-xs text-tertiary font-bold shrink-0">
              <Star size={10} fill="currentColor" />
              {rating.avg.toFixed(1)}
              <span className="text-outline font-normal">({rating.count})</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-black text-base">{listing.price.toLocaleString('vi-VN')} đ</span>
            <span className="text-outline text-xs line-through">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <StockBadge quantity={listing.quantityRemaining} />
        </div>
      </div>

      {/* Hover glow overlay */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 30px rgba(73,75,214,0.08)' }} />
    </article>
  )
}
