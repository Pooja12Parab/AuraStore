'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-add-to-cart'
import type { StrapiProduct } from '@/types/strapi'

type Props = {
  product: StrapiProduct
  imageUrl: string | null
}

export function AddToCartButton({ product, imageUrl }: Props) {
  const add = useAddToCart()
  const price = typeof product.price === 'number' ? product.price : 0
  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      className="w-full"
      data-testid="add-to-cart"
      onClick={() =>
        add({
          productId: product.documentId,
          slug: product.slug,
          name: product.name,
          price,
          imageUrl,
        })
      }
    >
      <Plus className="h-4 w-4" aria-hidden /> Add to cart
    </Button>
  )
}
