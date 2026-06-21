import { useCountdown } from '../../hooks/useCountdown'
import type { Timestamp } from 'firebase/firestore'

interface TimerBadgeProps {
  pickupEnd: Timestamp
}

export function TimerBadge({ pickupEnd }: TimerBadgeProps) {
  const { hoursLeft, minutesLeft, urgent, expired } = useCountdown(pickupEnd)
  if (expired) return null
  return (
    <span className={`inline-flex items-center gap-1 text-label-caps font-bold uppercase tracking-wider ${urgent ? 'text-error-token' : 'text-tertiary'}`}>
      ⏱{' '}
      {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
    </span>
  )
}
