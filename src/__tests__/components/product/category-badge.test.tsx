import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryBadge } from '@/components/product/category-badge'
import type { StrapiCategory } from '@/types/strapi'

const mockCategory: StrapiCategory = {
  id: 1,
  documentId: 'cat1',
  name: 'Electronics',
  slug: 'electronics',
}

describe('CategoryBadge', () => {
  it('renders category name', () => {
    render(<CategoryBadge category={mockCategory} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('handles missing category gracefully', () => {
    const { container } = render(<CategoryBadge category={undefined as unknown as StrapiCategory} />)
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()
  })
})