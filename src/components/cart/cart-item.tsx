'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from './quantity-selector'
import { useRemoveFromCart } from '@/hooks/use-remove-from-cart'
import { useUpdateQuantity } from '@/hooks/use-update-quantity'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/cart'

type Props = { item: CartItem }

export function CartItemRow({ item }: Props) {
  const update = useUpdateQuantity()
  const remove = useRemoveFromCart()
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0" data-testid="cart-item">
      <Link
        href={`/products/${item.slug}`}
        className="block size-16 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
            {item.name.slice(0, 2)}
          </span>
        )}
      </Link>
      <div className="flex-1 space-y-1">
        <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {item.name}
        </Link>
        <div className="text-xs text-muted-foreground">{formatPrice(item.price)} each</div>
        <div className="flex items-center gap-2">
          <QuantitySelector quantity={item.quantity} onChange={(q) => update(item.productId, q)} />
          <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Remove ${item.name}`}
        onClick={() => remove(item.productId, item.name)}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  )
}
