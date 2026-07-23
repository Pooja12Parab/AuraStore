'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { strapiMedia } from '@/lib/strapi'
import type { StrapiProduct } from '@/types/strapi'
import { formatPrice } from '@/lib/utils'

type Props = {
  productLookup: Record<string, StrapiProduct | undefined>
}

// On the checkout page we want a clean product summary. We may not have
// the full StrapiProduct but at minimum have the cart snapshot. We can
// either fetch additional product metadata by slug here, or use the
// last-known-good product lookup. For Phase 2 we keep it simple: just the
// name, price, qty, and image from the cart snapshot.
export function OrderSummary({ productLookup }: Props) {
  const { items, subtotal, totalQuantity } = useCart()
  return (
    <aside
      className="sticky top-4 space-y-3 rounded-md border border-border bg-background p-4"
      data-testid="order-summary"
    >
      <h2 className="text-lg font-semibold">Order summary</h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const product = productLookup[item.productId]
          const src = product?.images?.[0]
            ? strapiMedia(product.images[0])
            : item.imageUrl
          return (
            <li key={item.productId} className="flex items-start gap-3" data-testid="order-summary-item">
              <Link
                href={`/products/${item.slug}`}
                className="block size-14 shrink-0 overflow-hidden rounded-md bg-muted"
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
                <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:underline">
                  {item.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.price)}
                </div>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          )
        })}
      </ul>
      <div className="border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{totalQuantity} items</span>
          <span className="font-semibold" data-testid="order-summary-total">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>Calculated at payment</span>
        </div>
      </div>
    </aside>
  )
}
