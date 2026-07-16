import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Nothing here yet" />)
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('renders CTA link when actionLabel and actionHref provided', () => {
    render(<EmptyState title="No items" actionLabel="Browse" actionHref="/products" />)
    const link = screen.getByRole('link', { name: 'Browse' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/products')
  })

  it('renders without CTA when actionLabel missing', () => {
    render(<EmptyState title="No items" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})