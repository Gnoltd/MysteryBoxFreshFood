interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-xl'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          aria-label={`${star} star`}
          className={`${sizeClass} transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-slate-600'
          } ${onChange ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
