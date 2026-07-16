import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductGrid } from '@/components/product/product-grid'
import type { StrapiProduct } from '@/types/strapi'

const mockProducts: StrapiProduct[] = [
  {
    id: 1,
    documentId: 'prod1',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Premium noise-cancelling',
    price: 249900,
    comparePrice: 299900,
    images: [{ id: 1, url: '/uploads/hp.jpg', alternativeText: 'HP', width: 800, height: 800 }],
    category: { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    documentId: 'prod2',
    name: 'Cotton T-Shirt',
    slug: 'cotton-tshirt',
    description: 'Comfortable cotton',
    price: 79900,
    images: [{ id: 2, url: '/uploads/tshirt.jpg', alternativeText: 'T-Shirt', width: 800, height: 800 }],
    category: { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

describe('ProductGrid', () => {
  it('renders one card per product', () => {
    render(<ProductGrid products={mockProducts} />)
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    expect(screen.getByText('Cotton T-Shirt')).toBeInTheDocument()
  })

  it('shows EmptyState when products array is empty', () => {
    render(<ProductGrid products={[]} />)
    expect(screen.getByText('No products found')).toBeInTheDocument()
  })

  it('shows skeleton when isLoading is true', () => {
    const { container } = render(<ProductGrid products={[]} isLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })
})

import { Suspense } from 'react'
import { waitFor } from '@testing-library/react'
import { createWrapper } from '@/__tests__/utils/create-wrapper'

describe('ProductGrid integration', () => {
  it('renders products after loading via Suspense', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <ProductGrid products={mockProducts} />
      </Suspense>,
      { wrapper: createWrapper() }
    )
    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    })
  })

  it('shows empty state when no products', async () => {
    render(<ProductGrid products={[]} />, { wrapper: createWrapper() })
    expect(screen.getByText('No products found')).toBeInTheDocument()
  })
})