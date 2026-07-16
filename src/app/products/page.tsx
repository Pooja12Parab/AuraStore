import { Suspense } from 'react'
import { getCategories, getProducts } from '@/lib/strapi-queries'
import { CategoryFilter } from '@/components/product/category-filter'
import { GridSkeleton, ProductGrid } from '@/components/product/product-grid'

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>
}

export const metadata = {
  title: 'Products | AuraStore',
}

async function ProductsContent({ category }: { category?: string }) {
  const [{ data: categories }, { data: products }] = await Promise.all([
    getCategories(),
    getProducts({ category }),
  ])

  return (
    <>
      <CategoryFilter categories={categories} active={category} />
      <ProductGrid products={products} isLoading={false} />
    </>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Products</h1>
      <Suspense fallback={<GridSkeleton />}>
        <ProductsContent category={category} />
      </Suspense>
    </section>
  )
}
