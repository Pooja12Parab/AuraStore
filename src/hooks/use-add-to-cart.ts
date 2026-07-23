'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { cartStore, type CartItem } from '@/lib/cart'

export function useAddToCart(): (item: Omit<CartItem, 'quantity'>, quantity?: number) => void {
  return useCallback((item, quantity = 1) => {
    if (quantity <= 0) {
      toast.error('Invalid quantity')
      return
    }
    cartStore.add(item, quantity)
    toast.success(`Added "${item.name}" to cart`)
  }, [])
}
