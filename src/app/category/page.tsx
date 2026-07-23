import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { getCategories } from '@/lib/strapi-queries'
import { strapiMedia } from '@/lib/strapi'

export const metadata: Metadata = {
  title: 'Categories | AuraStore',
  description: 'Browse AuraStore by category.',
}

export default async function CategoriesIndexPage() {
  const res = await getCategories()
  const categories = res.data

  return (
    <section
      data-testid="categories-index"
      className="mx-auto max-w-7xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Browse
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        All categories
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        Pick a category to see what's inside. We curate every product
        ourselves; the catalog is small on purpose.
      </p>

      {categories.length === 0 ? (
        <p className="mt-10 rounded-md border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const img = (c as unknown as { image?: { url?: string } }).image
            const imgUrl = img?.url ? strapiMedia({ url: img.url }) : null
            return (
              <li key={c.documentId}>
                <Link
                  href={`/category/${c.slug}`}
                  className="group flex h-40 flex-col justify-end overflow-hidden rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
                  data-testid="category-card"
                >
                  <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-30"
                    style={{
                      backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                        <Tag className="h-3 w-3" aria-hidden /> {c.name}
                      </span>
                      {c.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand-700 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
