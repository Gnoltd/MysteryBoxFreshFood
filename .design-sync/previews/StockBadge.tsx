import { StockBadge } from 'mysterybox'

export function Plenty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>8 boxes:</span>
        <StockBadge quantity={8} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>5 boxes:</span>
        <StockBadge quantity={5} />
      </div>
    </div>
  )
}

export function Low() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>2 boxes (urgent):</span>
        <StockBadge quantity={2} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>1 box (critical):</span>
        <StockBadge quantity={1} />
      </div>
    </div>
  )
}
