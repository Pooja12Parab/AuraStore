'use client'

import Link from 'next/link'
import { Truck, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice, cn } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD_CENTS = 49900 // ₹499

type Props = {
  onCheckout?: () => void
}

export function CartSummary({ onCheckout }: Props) {
  const { subtotal, totalQuantity } = useCart()
  const empty = totalQuantity === 0
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotal)
  const pct = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD_CENTS) * 100),
  )
  const unlocked = remaining === 0

  return (
    <div
      className="border-t border-border/80 bg-surface/60 px-6 py-4"
      data-testid="cart-summary"
    >
      {!empty ? (
        <div className="mb-3" data-testid="cart-summary-freeship">
          <div className="flex items-center gap-2 text-xs">
            <Truck
              className={cn(
                'h-3.5 w-3.5',
                unlocked ? 'text-success' : 'text-muted-foreground',
              )}
              aria-hidden
            />
            <p className="text-foreground/80">
              {unlocked
                ? 'You unlocked free shipping'
                : `Add ${formatPrice(remaining)} more for free shipping`}
            </p>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Free shipping progress"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                unlocked ? 'bg-success' : 'bg-brand-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}

      <dl className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
          </dt>
          <dd className="text-foreground" data-testid="cart-summary-subtotal">
            {formatPrice(subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-foreground">
            {unlocked ? (
              <span className="text-success">Free</span>
            ) : (
              'Calculated at checkout'
            )}
          </dd>
        </div>
      </dl>

      <Link
        href="/checkout"
        aria-disabled={empty}
        tabIndex={empty ? -1 : 0}
        onClick={(event) => {
          if (empty) event.preventDefault()
          onCheckout?.()
        }}
        className={cn(
          'mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors',
          'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        data-testid="cart-summary-checkout"
      >
        Checkout
        <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
      </Link>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Secure payment via Razorpay · 30-day easy returns
      </p>
    </div>
  )
}
