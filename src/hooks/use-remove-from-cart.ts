'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { cartStore } from '@/lib/cart'

export function useRemoveFromCart(): (productId: string, name?: string) => void {
  return useCallback((productId, name) => {
    cartStore.remove(productId)
    toast.success(name ? `Removed "${name}"` : 'Removed from cart')
  }, [])
}
