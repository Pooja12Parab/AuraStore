'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CategoryBadge } from './category-badge'
import { PriceDisplay } from './price-display'
import { strapiMedia } from '@/lib/strapi'
import { cn } from '@/lib/utils'
import { useAddToCart } from '@/hooks/use-add-to-cart'
import type { StrapiProduct } from '@/types/strapi'

interface ProductCardProps {
  product: StrapiProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0] ? strapiMedia(product.images[0]) : null
  const altText = product.images?.[0]?.alternativeText || product.name
  const onSale =
    typeof product.comparePrice === 'number' &&
    product.comparePrice > product.price
  const add = useAddToCart()
  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md"
      data-testid="product-card"
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={altText}
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent transition-opacity duration-300 group-hover:from-black/10"
          />
          {onSale ? (
            <span
              className="absolute left-3 top-3 inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground shadow-sm"
              data-testid="product-card-sale-badge"
            >
              Sale
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-center justify-between">
          <CategoryBadge category={product.category} />
          {typeof product.stock === 'number' && product.stock <= 5 ? (
            <span
              className="text-[11px] font-medium uppercase tracking-wider text-warning"
              data-testid="product-card-low-stock"
            >
              Only {product.stock} left
            </span>
          ) : null}
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-brand-700"
        >
          {product.name}
        </Link>
        <PriceDisplay
          price={product.price}
          comparePrice={product.comparePrice}
        />
        <button
          type="button"
          data-testid="add-to-cart"
          onClick={() =>
            add({
              productId: product.documentId,
              slug: product.slug,
              name: product.name,
              price: product.price,
              imageUrl,
            })
          }
          className={cn(
            'mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground',
            'transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          )}
        >
          <Plus className="h-4 w-4" aria-hidden /> Add to cart
        </button>
      </div>
    </div>
  )
}
