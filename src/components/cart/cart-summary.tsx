'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = {
  onCheckout?: () => void
}

export function CartSummary({ onCheckout }: Props) {
  const { subtotal, totalQuantity } = useCart()
  const empty = totalQuantity === 0
  return (
    <div className="border-t pt-4 space-y-3" data-testid="cart-summary">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
        </span>
        <span className="font-semibold" data-testid="cart-summary-subtotal">
          {formatPrice(subtotal)}
        </span>
      </div>
      <Link
        href="/checkout"
        aria-disabled={empty}
        tabIndex={empty ? -1 : 0}
        onClick={(event) => {
          if (empty) event.preventDefault()
          onCheckout?.()
        }}
        className={cn(
          'inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        )}
        data-testid="cart-summary-checkout"
      >
        Checkout
      </Link>
    </div>
  )
}
