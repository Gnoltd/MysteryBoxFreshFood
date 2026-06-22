import { useEffect, useState } from 'react'
import { getReviewsForListing } from '../../services/reviews'
import type { Review } from '../../types'
import { Timestamp } from 'firebase/firestore'

interface Props { listingId: string }

function relativeTime(ts: Timestamp): string {
  const diff = (Date.now() - ts.toMillis()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-sm ${s <= rating ? 'text-tertiary' : 'text-outline/40'}`}>★</span>
      ))}
    </div>
  )
}

export function ReviewsCarousel({ listingId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState(0)

  useEffect(() => {
    getReviewsForListing(listingId).then(r => {
      setReviews(r)
      if (r.length) setAvg(Math.round((r.reduce((s, x) => s + x.rating, 0) / r.length) * 10) / 10)
    })
  }, [listingId])

  if (reviews.length === 0) return (
    <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-5 text-center text-on-surface-variant text-body-sm">
      No reviews yet — be the first to review this box
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-tertiary font-bold text-lg">★ {avg}</span>
        <span className="text-on-surface-variant text-body-sm">· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
        {reviews.map(r => {
          const name = r.customerName || 'Customer'
          const firstName = name.split(' ')[0]
          const truncated = r.comment.length > 90 ? r.comment.slice(0, 90) + '…' : r.comment

          return (
            <div
              key={r.id}
              className="shrink-0 w-52 bg-surface-container/60 backdrop-blur border border-outline-variant rounded-2xl p-4 flex flex-col gap-2"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Stars rating={r.rating} />
              {r.comment ? (
                <p className="text-on-surface text-body-sm leading-snug flex-1">{truncated}</p>
              ) : (
                <p className="text-on-surface-variant text-body-sm italic flex-1">No comment</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {initials(name)}
                </div>
                <span className="text-on-surface-variant text-xs truncate">{firstName}</span>
                <span className="text-outline text-xs ml-auto shrink-0">{r.createdAt ? relativeTime(r.createdAt) : ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
