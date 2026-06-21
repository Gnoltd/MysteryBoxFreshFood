interface StockBadgeProps {
  quantity: number
}

export function StockBadge({ quantity }: StockBadgeProps) {
  const low = quantity <= 2
  return (
    <span className={`text-label-caps font-bold uppercase tracking-wider ${low ? 'text-error-token' : 'text-on-surface-variant'}`}>
      {quantity} left
    </span>
  )
}
