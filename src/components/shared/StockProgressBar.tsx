interface StockProgressBarProps {
  current: number
  total: number
}

export function StockProgressBar({ current, total }: StockProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const low = current <= 2
  return (
    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${low ? 'bg-tertiary' : 'gradient-bg'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
