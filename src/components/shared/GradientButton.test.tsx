import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GradientButton } from './GradientButton'

describe('GradientButton', () => {
  test('renders children', () => {
    render(<GradientButton>Claim Box</GradientButton>)
    expect(screen.getByText('Claim Box')).toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const fn = vi.fn()
    render(<GradientButton onClick={fn}>Go</GradientButton>)
    fireEvent.click(screen.getByText('Go'))
    expect(fn).toHaveBeenCalledOnce()
  })

  test('is disabled when disabled prop is true', () => {
    render(<GradientButton disabled>Go</GradientButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
