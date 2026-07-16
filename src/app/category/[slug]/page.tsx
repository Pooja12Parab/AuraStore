import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategories, getCategoryBySlug, getProducts } from '@/lib/strapi-queries'
import { CategoryFilter } from '@/components/product/category-filter'
import { GridSkeleton, ProductGrid } from '@/components/product/product-grid'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export const metadata = {
  title: 'Category | AuraStore',
}

async function CategoryContent({ slug }: { slug: string }) {
  const [{ data: categories }, { data: products }] = await Promise.all([
    getCategories(),
    getProducts({ category: slug }),
  ])

  return (
    <>
      <CategoryFilter categories={categories} active={slug} />
      <ProductGrid products={products} isLoading={false} />
    </>
  )
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  let category
  try {
    category = await getCategoryBySlug(slug)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Category not found')) {
      notFound()
    }
    throw error
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{category.name}</h1>
      <Suspense fallback={<GridSkeleton />}>
        <CategoryContent slug={slug} />
      </Suspense>
    </section>
  )
}