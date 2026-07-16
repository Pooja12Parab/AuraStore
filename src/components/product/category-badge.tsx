import type { StrapiCategory } from '@/types/strapi'

interface CategoryBadgeProps {
  category: StrapiCategory
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {category?.name || ''}
    </span>
  )
}