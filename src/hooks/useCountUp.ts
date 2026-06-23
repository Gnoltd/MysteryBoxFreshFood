import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1200, start = 0) {
  const [count, setCount] = useState(start)
  const prevTarget = useRef(start)

  useEffect(() => {
    const from = prevTarget.current
    prevTarget.current = target
    if (from === target) return

    const startTime = performance.now()
    const diff = target - from

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(from + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return count
}
