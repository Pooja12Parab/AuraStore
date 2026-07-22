import Image from 'next/image'
import Link from 'next/link'
import { CategoryBadge } from './category-badge'
import { PriceDisplay } from './price-display'
import { strapiMedia } from '@/lib/strapi'
import type { StrapiProduct } from '@/types/strapi'

interface ProductCardProps {
  product: StrapiProduct
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        {product.images?.[0] ? (
          <Image
            src={strapiMedia(product.images[0])}
            alt={product.images[0].alternativeText || product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="mt-3">
        <CategoryBadge category={product.category} />
        <h3 className="mt-1 font-medium">{product.name}</h3>
        <PriceDisplay price={product.price} comparePrice={product.comparePrice} />
      </div>
    </Link>
  )
}
