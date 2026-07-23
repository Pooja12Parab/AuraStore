'use client'

import { useEffect } from 'react'
import { cartStore } from '@/lib/cart'

type Props = { shouldClear: boolean }

export function ClearCartOnMount({ shouldClear }: Props) {
  useEffect(() => {
    if (shouldClear) {
      cartStore.clear()
    }
  }, [shouldClear])
  return null
}
