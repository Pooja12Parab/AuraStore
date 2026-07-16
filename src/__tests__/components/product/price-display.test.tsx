import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceDisplay } from '@/components/product/price-display'

describe('PriceDisplay', () => {
  it('formats INR and shows price', () => {
    render(<PriceDisplay price={249900} />)
    expect(screen.getByText('₹2,49,900')).toBeInTheDocument()
  })

  it('shows strikethrough comparePrice when comparePrice > price', () => {
    render(<PriceDisplay price={249900} comparePrice={299900} />)
    expect(screen.getByText('₹2,49,900')).toBeInTheDocument()
    const compareEl = screen.getByText('₹2,99,900')
    expect(compareEl.className).toContain('line-through')
  })

  it('hides strikethrough when comparePrice <= price', () => {
    render(<PriceDisplay price={249900} comparePrice={100000} />)
    expect(screen.queryByText('₹1,00,000')).not.toBeInTheDocument()
  })

  it('handles zero price', () => {
    render(<PriceDisplay price={0} />)
    expect(screen.getByText('₹0')).toBeInTheDocument()
  })
})