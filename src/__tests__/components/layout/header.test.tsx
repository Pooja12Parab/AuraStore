import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Header } from '@/components/layout/header'
import { renderWithProviders } from '@/__tests__/utils/render-with-providers'

describe('Header', () => {
  it('renders logo linking to home', () => {
    renderWithProviders(<Header />)
    const logo = screen.getByRole('link', { name: /aurastore/i })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders nav links', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
  })

  it('renders auth section with Sign in when signed out', () => {
    renderWithProviders(<Header />, { isSignedIn: false })
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('renders the cart icon button (Phase 2 wiring)', () => {
    renderWithProviders(<Header />)
    expect(screen.getByTestId('cart-icon-button')).toBeInTheDocument()
  })
})
