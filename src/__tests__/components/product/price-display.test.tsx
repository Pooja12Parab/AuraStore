import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceDisplay } from '@/components/product/price-display'

describe('PriceDisplay', () => {
  it('formats USD with two decimals', () => {
    render(<PriceDisplay price={249900} />)
    expect(screen.getByText('$2,499.00')).toBeInTheDocument()
  })

  it('shows strikethrough comparePrice when comparePrice > price', () => {
    render(<PriceDisplay price={249900} comparePrice={299900} />)
    expect(screen.getByText('$2,499.00')).toBeInTheDocument()
    const compareEl = screen.getByText('$2,999.00')
    expect(compareEl.className).toContain('line-through')
  })

  it('hides strikethrough when comparePrice <= price', () => {
    render(<PriceDisplay price={249900} comparePrice={100000} />)
    expect(screen.queryByText('$1,000.00')).not.toBeInTheDocument()
  })

  it('handles zero price', () => {
    render(<PriceDisplay price={0} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})