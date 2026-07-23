import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/footer'

describe('Footer', () => {
  it('renders branding', () => {
    render(<Footer />)
    // Brand renders "Aura" + a gradient <span>Store</span>, so the text
    // is split across multiple spans. Verify the Brand component itself
    // is rendered (data-testid="brand" is on the outer span) and the
    // concatenated textContent contains "Aura" + "Store".
    const brand = screen.getByTestId('brand')
    expect(brand).toBeInTheDocument()
    expect(brand.textContent ?? '').toMatch(/Aura.*Store/)
  })

  it('renders footer links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /all products/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument()
  })
})
