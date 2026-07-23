'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ProductCard } from '@/components/product/product-card'
import { ChevronRight } from 'lucide-react'

type ProductLite = {
  documentId: string
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number | null
  images?: Array<{ url?: string; alternativeText?: string }>
  category?: unknown
  stock?: number
  featured?: boolean
}

export function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/featured-products', { cache: 'no-store' })
        if (!res.ok) return []
        const body = (await res.json()) as { data?: ProductLite[] }
        return body.data ?? []
      } catch {
        return []
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return (
    <section
      data-testid="home-featured"
      className="mx-auto max-w-7xl px-4 pb-12 sm:pb-16"
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Featured this week
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-picked pieces our team is wearing this week.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Shop all
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <ul
          data-testid="home-featured-skeleton"
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-72 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </ul>
      ) : data && data.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {data.slice(0, 8).map((p) => (
            <li key={p.documentId}>
              <ProductCard
                product={
                  p as unknown as Parameters<typeof ProductCard>[0]['product']
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="home-featured-empty"
        >
          Featured products are loading — visit{' '}
          <Link href="/products" className="text-brand-700 underline">
            the full catalog
          </Link>{' '}
          in the meantime.
        </p>
      )}
    </section>
  )
}
