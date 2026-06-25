import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { subscribeToSubscription } from '../services/subscriptions'
import { PLAN_DAILY_LIMITS } from '../utils/planLimits'

export interface DailyBoxStatus {
  used: number
  limit: number
  remaining: number
  plan: string
  loading: boolean
}

const COMMITTED = ['paid', 'picked_up', 'pending_cod', 'pending_bank_transfer']

export function useDailyBoxStatus(uid: string | undefined): DailyBoxStatus {
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(2)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  // Real-time plan listener
  useEffect(() => {
    if (!uid) return
    const unsub = subscribeToSubscription(uid, sub => {
      const p = sub?.status === 'active' ? (sub.plan ?? 'free') : 'free'
      setPlan(p)
      setLimit(PLAN_DAILY_LIMITS[p] ?? 2)
    })
    return unsub
  }, [uid])

  // Real-time order count — single equality filter only (no composite index needed)
  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', uid),
    )

    const unsub = onSnapshot(
      q,
      snap => {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const startTs = Timestamp.fromDate(startOfDay)

        const count = snap.docs.filter(d => {
          const data = d.data()
          const createdAt = data.createdAt as Timestamp | undefined
          return (
            createdAt &&
            createdAt.seconds >= startTs.seconds &&
            COMMITTED.includes(data.status as string)
          )
        }).length

        setUsed(count)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [uid])

  return { used, limit, remaining: Math.max(0, limit - used), plan, loading }
}
