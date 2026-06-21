import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusChip } from './StatusChip'

describe('StatusChip', () => {
  test('renders children text', () => {
    render(<StatusChip variant="emerald">Paid</StatusChip>)
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  test('renders amber variant', () => {
    const { container } = render(<StatusChip variant="amber">Urgent</StatusChip>)
    expect(container.firstChild).toHaveClass('text-tertiary')
  })

  test('renders rose variant', () => {
    const { container } = render(<StatusChip variant="rose">Error</StatusChip>)
    expect(container.firstChild).toHaveClass('text-error-token')
  })
})
