import { StarRating } from 'mysterybox'

export function DisplayOnly() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StarRating value={5} size="lg" />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>5 stars</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StarRating value={4} size="md" />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>4 stars</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StarRating value={3} size="sm" />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>3 stars (sm)</span>
      </div>
    </div>
  )
}

export function Interactive() {
  return (
    <div>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Rate your experience:</div>
      <StarRating value={3} onChange={() => {}} size="lg" />
    </div>
  )
}
