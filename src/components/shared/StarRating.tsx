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
          className={`transition-opacity ${onChange ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
          style={{ opacity: star <= value ? 1 : 0.25, filter: star <= value ? 'none' : 'grayscale(1)' }}
        >
          <img
            src="/images/icons/star.png"
            alt={`${star} star`}
            className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
          />
        </button>
      ))}
    </div>
  )
}
