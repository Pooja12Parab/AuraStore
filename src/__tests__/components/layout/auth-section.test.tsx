import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { AuthSection } from '@/components/layout/auth-section'
import { renderWithProviders } from '@/__tests__/utils/render-with-providers'

describe('AuthSection', () => {
  it('shows Sign in / Sign up buttons when signed out', () => {
    renderWithProviders(<AuthSection />, { isSignedIn: false })
    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('shows UserButton when signed in', () => {
    renderWithProviders(<AuthSection />, { isSignedIn: true })
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })
})
