import { useState, useEffect } from 'react'
import type { Timestamp } from 'firebase/firestore'

export interface CountdownResult {
  hoursLeft: number
  minutesLeft: number
  urgent: boolean
  expired: boolean
}

export function useCountdown(pickupEnd: Timestamp): CountdownResult {
  const compute = (): CountdownResult => {
    const msLeft = pickupEnd.seconds * 1000 - Date.now()
    if (msLeft <= 0) return { hoursLeft: 0, minutesLeft: 0, urgent: false, expired: true }
    const totalMinutes = Math.floor(msLeft / 60000)
    return {
      hoursLeft: Math.floor(totalMinutes / 60),
      minutesLeft: totalMinutes % 60,
      urgent: totalMinutes <= 30,
      expired: false,
    }
  }

  const [result, setResult] = useState<CountdownResult>(compute)

  useEffect(() => {
    const id = setInterval(() => setResult(compute()), 60000)
    return () => clearInterval(id)
  }, [pickupEnd.seconds])

  return result
}
