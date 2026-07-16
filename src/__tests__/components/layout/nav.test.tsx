import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Nav } from '@/components/layout/nav'

const usePathnameMock = vi.fn(() => '/products')
vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}))

describe('Nav (mobile)', () => {
  beforeAll(() => {
    usePathnameMock.mockReturnValue('/products')
  })

  it('renders a hamburger button on mobile and hides it on desktop', () => {
    render(<Nav />)
    const hamburger = screen.getByTestId('nav-hamburger')
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    expect(hamburger.className).toContain('md:hidden')
  })

  it('clicking the hamburger opens the collapsible panel and toggles aria-expanded', async () => {
    const user = userEvent.setup()
    render(<Nav />)
    const hamburger = screen.getByTestId('nav-hamburger')
    await user.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-mobile-panel')).toBeInTheDocument()
  })

  it('clicking a mobile link closes the panel', async () => {
    const user = userEvent.setup()
    render(<Nav />)
    await user.click(screen.getByTestId('nav-hamburger'))
    const link = screen.getAllByRole('link', { name: /products/i }).at(-1)!
    await user.click(link)
    expect(screen.queryByTestId('nav-mobile-panel')).not.toBeInTheDocument()
  })
})
