import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/product/product-card'
import type { StrapiProduct } from '@/types/strapi'

const mockProduct: StrapiProduct = {
  id: 1,
  documentId: 'prod1',
  name: 'Wireless Headphones',
  slug: 'wireless-headphones',
  description: 'Premium noise-cancelling',
  price: 249900,
  comparePrice: 299900,
  images: [
    { id: 1, url: '/uploads/headphones.jpg', alternativeText: 'Headphones', width: 800, height: 800 },
  ],
  category: { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
  stock: 50,
  featured: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockProductNoImage: StrapiProduct = {
  ...mockProduct,
  id: 2,
  slug: 'no-image-product',
  images: [],
}

describe('ProductCard', () => {
  it('renders product name and formatted price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument()
    expect(screen.getByText('₹2,49,900')).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('renders image with alt text', () => {
    render(<ProductCard product={mockProduct} />)
    const img = screen.getByAltText('Headphones')
    expect(img).toBeInTheDocument()
  })

  it('renders link to product detail page', () => {
    render(<ProductCard product={mockProduct} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/products/wireless-headphones')
  })

  it('shows missing image fallback when no images', () => {
    render(<ProductCard product={mockProductNoImage} />)
    expect(screen.getByText('No image')).toBeInTheDocument()
  })
})