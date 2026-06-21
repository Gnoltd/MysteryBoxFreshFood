import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockBadge } from './StockBadge'

describe('StockBadge', () => {
  test('renders quantity', () => {
    render(<StockBadge quantity={5} />)
    expect(screen.getByText('5 left')).toBeInTheDocument()
  })

  test('applies rose color at quantity 2 or below', () => {
    const { container } = render(<StockBadge quantity={2} />)
    expect(container.firstChild).toHaveClass('text-error-token')
  })

  test('applies normal color above 2', () => {
    const { container } = render(<StockBadge quantity={3} />)
    expect(container.firstChild).not.toHaveClass('text-error-token')
  })
})
