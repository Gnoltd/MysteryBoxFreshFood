import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
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

const COMMITTED_STATUSES = ['paid', 'picked_up', 'pending_cod', 'pending_bank_transfer']

export function useDailyBoxStatus(uid: string | undefined): DailyBoxStatus {
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(2)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  // Real-time subscription plan listener
  useEffect(() => {
    if (!uid) return
    const unsub = subscribeToSubscription(uid, sub => {
      const p = sub?.status === 'active' ? (sub.plan ?? 'free') : 'free'
      setPlan(p)
      setLimit(PLAN_DAILY_LIMITS[p] ?? 2)
    })
    return unsub
  }, [uid])

  // Real-time today's order count
  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', uid),
      where('createdAt', '>=', startOfDay),
    )

    const unsub = onSnapshot(q, snap => {
      const count = snap.docs.filter(d =>
        COMMITTED_STATUSES.includes(d.data().status as string)
      ).length
      setUsed(count)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { used, limit, remaining: Math.max(0, limit - used), plan, loading }
}
