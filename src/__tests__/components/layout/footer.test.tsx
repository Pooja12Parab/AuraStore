import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/footer'

describe('Footer', () => {
  it('renders branding', () => {
    render(<Footer />)
    expect(screen.getByText('AuraStore')).toBeInTheDocument()
  })

  it('renders footer links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument()
  })
})
