import { TimerBadge } from 'mysterybox'

const twoHoursFromNow = { seconds: Math.floor(Date.now() / 1000) + 7200, nanoseconds: 0 } as any
const twentyMinutesFromNow = { seconds: Math.floor(Date.now() / 1000) + 1200, nanoseconds: 0 } as any

export function Active() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>2 hours left:</span>
        <TimerBadge pickupEnd={twoHoursFromNow} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>20 min (urgent):</span>
        <TimerBadge pickupEnd={twentyMinutesFromNow} />
      </div>
    </div>
  )
}
