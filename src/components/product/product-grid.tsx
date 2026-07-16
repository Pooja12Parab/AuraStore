import { ProductCard } from './product-card'
import { Skeleton } from '../common/skeleton'
import { EmptyState } from '../common/empty-state'
import type { StrapiProduct } from '@/types/strapi'

interface ProductGridProps {
  products: StrapiProduct[]
  isLoading?: boolean
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return <GridSkeleton />
  }

  if (products.length === 0) {
    return <EmptyState title="No products found" description="Check back later." />
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}