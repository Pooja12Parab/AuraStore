import Image from 'next/image'
import { PriceDisplay } from './price-display'
import { strapiMedia } from '@/lib/strapi'
import type { StrapiProduct } from '@/types/strapi'

interface ProductDetailProps {
  product: StrapiProduct
}

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {product.images.map((image) => (
            <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={strapiMedia(image)}
                alt={image.alternativeText || product.name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {product.category.name}
          </span>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <PriceDisplay price={product.price} comparePrice={product.comparePrice} />
          <div className="prose max-w-none text-gray-600">{product.description}</div>
          {product.featured && (
            <span className="inline-block rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              Featured
            </span>
          )}
        </div>
      </div>
    </div>
  )
}