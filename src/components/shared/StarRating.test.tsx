import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  test('renders 5 star buttons', () => {
    render(<StarRating value={0} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  test('each star has an aria-label', () => {
    render(<StarRating value={0} />)
    expect(screen.getByLabelText('1 star')).toBeInTheDocument()
    expect(screen.getByLabelText('5 star')).toBeInTheDocument()
  })

  test('calls onChange with star number when clicked', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('3 star'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  test('does not throw when no onChange handler (display mode)', () => {
    render(<StarRating value={3} />)
    fireEvent.click(screen.getByLabelText('1 star'))
    // should not throw
  })
})
