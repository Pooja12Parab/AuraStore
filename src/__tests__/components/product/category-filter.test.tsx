import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter } from '@/components/product/category-filter'
import { seedTestData } from '@/__tests__/mocks/seed'

const replaceMock = vi.fn()
const usePathnameMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => usePathnameMock(),
}))

beforeAll(() => {
  seedTestData()
})

beforeEach(() => {
  replaceMock.mockReset()
  usePathnameMock.mockReturnValue('/products')
})

describe('CategoryFilter', () => {
  it('renders an "All" button plus one button per category', () => {
    const categories = [
      { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
      { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
    ]
    render(<CategoryFilter categories={categories} />)
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /electronics/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clothing/i })).toBeInTheDocument()
  })

  it('marks the active category button with aria-current="page"', () => {
    const categories = [
      { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
      { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
    ]
    render(<CategoryFilter categories={categories} active="clothing" />)
    expect(screen.getByRole('button', { name: /clothing/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: /electronics/i })).not.toHaveAttribute('aria-current')
  })

  it('clicking a category calls router.replace with ?category=<slug>', async () => {
    const user = userEvent.setup()
    const categories = [
      { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
      { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
    ]
    render(<CategoryFilter categories={categories} />)
    await user.click(screen.getByRole('button', { name: /clothing/i }))
    expect(replaceMock).toHaveBeenCalledWith('/products?category=clothing', { scroll: false })
  })

  it('clicking "All" calls router.replace with the base path and no query', async () => {
    const user = userEvent.setup()
    const categories = [
      { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
      { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
    ]
    render(<CategoryFilter categories={categories} active="clothing" />)
    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(replaceMock).toHaveBeenCalledWith('/products', { scroll: false })
  })

  it('preserves existing query string when a category is selected', async () => {
    usePathnameMock.mockReturnValue('/products')
    const user = userEvent.setup()
    const categories = [
      { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
    ]
    render(<CategoryFilter categories={categories} />)
    await user.click(screen.getByRole('button', { name: /electronics/i }))
    expect(replaceMock).toHaveBeenCalledWith('/products?category=electronics', { scroll: false })
  })
})

