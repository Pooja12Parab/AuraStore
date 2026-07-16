'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { StrapiCategory } from '@/types/strapi'

interface CategoryFilterProps {
  categories: StrapiCategory[]
  active?: string
}

const baseClasses = 'rounded-full border px-3 py-1 text-sm'
const activeClasses = 'border-black bg-black text-white'
const inactiveClasses = 'border-gray-300 text-gray-700'

export function CategoryFilter({ categories, active }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback(
    (slug?: string) => {
      const target = slug ? `${pathname}?category=${slug}` : pathname
      router.replace(target, { scroll: false })
    },
    [pathname, router]
  )

  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => navigate()}
        aria-current={active ? undefined : 'page'}
        data-active={active ? 'false' : 'true'}
        className={`${baseClasses} ${!active ? activeClasses : inactiveClasses}`}
      >
        All
      </button>
      {categories.map((category) => {
        const isActive = active === category.slug
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => navigate(category.slug)}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive ? 'true' : 'false'}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}

