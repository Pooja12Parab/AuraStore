import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/__tests__/utils/render-with-providers'
import { cartStore } from '@/lib/cart'
import { CartIconButton } from '@/components/cart/cart-icon-button'
import { screen } from '@testing-library/react'

describe('U-P2-badge: CartIconButton badge', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
  })

  afterEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
  })

  it('U-P2-badge-1: shows no badge when cart is empty', () => {
    renderWithProviders(<CartIconButton />)
    expect(screen.queryByTestId('cart-icon-badge')).not.toBeInTheDocument()
    const button = screen.getByTestId('cart-icon-button')
    expect(button.textContent ?? '').not.toMatch(/\d/)
  })

  it('U-P2-badge-2: shows the total quantity when cart is non-empty', () => {
    cartStore.add(
      { productId: 'prod_a', slug: 'a', name: 'A', price: 100, imageUrl: null },
      3,
    )
    renderWithProviders(<CartIconButton />)
    expect(screen.getByTestId('cart-icon-badge')).toHaveTextContent('3')
  })
})
