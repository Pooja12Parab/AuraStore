'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Trash2, ArrowRight, Truck } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useCartUI } from '@/lib/cart-ui'
import { useRemoveFromCart } from '@/hooks/use-remove-from-cart'
import { useUpdateQuantity } from '@/hooks/use-update-quantity'
import { formatPrice, cn } from '@/lib/utils'
import { strapiMedia } from '@/lib/strapi'
import type { StrapiProduct } from '@/types/strapi'

type Props = {
  productLookup?: Record<string, StrapiProduct>
}

export function CartView({ productLookup = {} }: Props) {
  const { items, subtotal, totalQuantity } = useCart()
  const { open } = useCartUI()
  const remove = useRemoveFromCart()
  const update = useUpdateQuantity()
  const freeShippingThresholdCents = 49900
  const remaining = Math.max(0, freeShippingThresholdCents - subtotal)
  const unlocked = remaining === 0

  // Open the side-drawer automatically on mount so users with the JS
  // drawer still see something useful. The page body remains visible
  // for non-JS users.
  useEffect(() => {
    if (items.length > 0) open()
  }, [items.length, open])

  if (items.length === 0) {
    return (
      <div
        data-testid="cart-view-empty"
        className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center"
      >
        <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a few things to get started. We ship to all metro cities in
          India.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div
      data-testid="cart-view"
      className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Your cart ({totalQuantity} item{totalQuantity === 1 ? '' : 's'})
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review the items below, then continue to checkout.
      </p>

      <ul
        data-testid="cart-view-items"
        className="mt-6 divide-y divide-border rounded-md border border-border bg-background"
      >
        {items.map((item) => {
          const product = productLookup[item.productId]
          const src = product?.images?.[0]
            ? strapiMedia(product.images[0])
            : item.imageUrl
          return (
            <li
              key={item.productId}
              className="flex items-start gap-4 p-4"
              data-testid="cart-view-item"
            >
              <Link
                href={`/products/${item.slug}`}
                className="block size-20 shrink-0 overflow-hidden rounded-md bg-surface"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={item.name} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    {item.name.slice(0, 2)}
                  </span>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium text-foreground hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatPrice(item.price)} each
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-background">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => update(item.productId, item.quantity - 1)}
                    className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-surface"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => update(item.productId, item.quantity + 1)}
                    className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-surface"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.productId, item.name)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" aria-hidden /> Remove
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 space-y-3 rounded-md border border-border bg-background p-4">
        <div
          className={cn(
            'flex items-center gap-2 text-xs',
            unlocked ? 'text-success' : 'text-muted-foreground',
          )}
          data-testid="cart-view-freeship"
        >
          <Truck className="h-3.5 w-3.5" aria-hidden />
          {unlocked
            ? 'You unlocked free shipping'
            : `Add ${formatPrice(remaining)} more for free shipping`}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span
            className="text-base font-semibold text-foreground"
            data-testid="cart-view-total"
          >
            {formatPrice(subtotal)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Continue to checkout
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
