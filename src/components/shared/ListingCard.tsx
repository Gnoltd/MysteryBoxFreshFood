import { Link } from 'react-router-dom'
import type { Listing } from '../../types'

interface ListingCardProps {
  listing: Listing
  href: string
}

export function ListingCard({ listing, href }: ListingCardProps) {
  const discount = Math.round((1 - listing.price / listing.originalPrice) * 100)
  const pickup = new Date(listing.pickupStart.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    + ' – ' + new Date(listing.pickupEnd.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <Link to={href} className="block group">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors">
        <div className="relative h-40 bg-slate-800">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>}
          <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
          {listing.status === 'sold_out' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SOLD OUT</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-white text-sm truncate">{listing.title}</p>
          <div className="flex items-center justify-between mt-1">
            <div>
              <span className="text-indigo-400 font-bold text-sm">{listing.price.toLocaleString('vi-VN')} đ</span>
              <span className="text-slate-500 text-xs line-through ml-2">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <span className="text-slate-400 text-xs">{listing.quantityRemaining} left</span>
          </div>
          <p className="text-slate-500 text-xs mt-1 truncate">Pickup {pickup}</p>
        </div>
      </div>
    </Link>
  )
}
