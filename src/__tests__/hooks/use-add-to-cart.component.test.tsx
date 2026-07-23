import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { cartStore } from '@/lib/cart'
import { renderWithProviders } from '@/__tests__/utils/render-with-providers'
import { toast } from 'sonner'
import { useAddToCart } from '@/hooks/use-add-to-cart'

describe('C-P2-hook: useAddToCart fires a toast (integration)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
  })

  it('U-P2-hook-1: adds item and shows success toast', () => {
    const Probe = () => {
      const add = useAddToCart()
      useEffect(() => {
        add({ productId: 'prod_x', slug: 'x', name: 'X', price: 50, imageUrl: null })
      }, [add])
      return null
    }
    renderWithProviders(<Probe />)
    expect(cartStore.getSnapshot().items).toHaveLength(1)
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('X'))
  })

  it('U-P2-hook-2: does not add when called with quantity 0', () => {
    const Probe = () => {
      const add = useAddToCart()
      add(
        { productId: 'prod_x', slug: 'x', name: 'X', price: 50, imageUrl: null },
        0,
      )
      return null
    }
    renderWithProviders(<Probe />)
    expect(cartStore.getSnapshot().items).toHaveLength(0)
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Invalid quantity')
  })
})
