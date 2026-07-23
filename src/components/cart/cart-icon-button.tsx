'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart'
import { useCartUI } from '@/lib/cart-ui'

export function CartIconButton() {
  const { totalQuantity } = useCart()
  const open = useCartUI((s) => s.open)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Cart, ${totalQuantity} items`}
      onClick={open}
      data-testid="cart-icon-button"
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {totalQuantity > 0 ? (
        <span
          data-testid="cart-icon-badge"
          className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground"
        >
          {totalQuantity}
        </span>
      ) : null}
    </Button>
  )
}
