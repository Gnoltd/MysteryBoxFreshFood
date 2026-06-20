import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from './useCountdown'

const NOW = new Date('2026-06-21T12:00:00Z')
const ts = (iso: string) => ({ seconds: new Date(iso).getTime() / 1000, nanoseconds: 0 }) as any

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  test('expired when pickupEnd is in the past', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T11:00:00Z')))
    expect(result.current.expired).toBe(true)
    expect(result.current.hoursLeft).toBe(0)
    expect(result.current.minutesLeft).toBe(0)
  })

  test('correct hours and minutes for future time', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T14:30:00Z')))
    expect(result.current.expired).toBe(false)
    expect(result.current.hoursLeft).toBe(2)
    expect(result.current.minutesLeft).toBe(30)
    expect(result.current.urgent).toBe(false)
  })

  test('urgent when 30 minutes or fewer remain', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T12:25:00Z')))
    expect(result.current.urgent).toBe(true)
    expect(result.current.hoursLeft).toBe(0)
    expect(result.current.minutesLeft).toBe(25)
  })

  test('not urgent at exactly 31 minutes', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T12:31:00Z')))
    expect(result.current.urgent).toBe(false)
  })

  test('updates on interval tick', () => {
    const { result } = renderHook(() => useCountdown(ts('2026-06-21T14:00:00Z')))
    expect(result.current.hoursLeft).toBe(2)
    act(() => { vi.advanceTimersByTime(60000) })
    expect(result.current.hoursLeft).toBe(1)
    expect(result.current.minutesLeft).toBe(59)
  })
})
