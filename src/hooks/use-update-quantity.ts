'use client'

import { useCallback } from 'react'
import { cartStore } from '@/lib/cart'

export function useUpdateQuantity(): (productId: string, quantity: number) => void {
  return useCallback((productId, quantity) => {
    if (quantity < 0) return
    cartStore.setQuantity(productId, quantity)
  }, [])
}
