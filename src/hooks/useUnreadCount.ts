import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useUnreadCount(uid: string | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'notifications', uid, 'items'),
      where('read', '==', false)
    )
    const unsub = onSnapshot(q, snap => setCount(snap.size), () => setCount(0))
    return unsub
  }, [uid])

  return count
}
