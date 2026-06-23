import { StockProgressBar } from 'mysterybox'

export function Normal() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, width: 260 }}>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>7 of 10 remaining</div>
        <StockProgressBar current={7} total={10} />
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>5 of 10 remaining</div>
        <StockProgressBar current={5} total={10} />
      </div>
    </div>
  )
}

export function Low() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, width: 260 }}>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>2 of 10 remaining (amber)</div>
        <StockProgressBar current={2} total={10} />
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>1 of 10 remaining (critical)</div>
        <StockProgressBar current={1} total={10} />
      </div>
    </div>
  )
}
