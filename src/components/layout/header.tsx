import Link from 'next/link'
import { Search } from 'lucide-react'
import { Nav } from './nav'
import { AuthSection } from './auth-section'
import { Brand } from './brand'
import { CartIconButton } from '@/components/cart/cart-icon-button'

export function Header() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65"
      data-testid="site-header"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6">
        <Link
          href="/"
          aria-label="AuraStore home"
          className="ring-focus rounded-md"
        >
          <Brand size="md" />
        </Link>
        <Nav />
        <form
          role="search"
          action="/products"
          method="get"
          className="ml-auto hidden max-w-md flex-1 items-center md:flex"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Search for products, brands, and more"
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground ring-focus"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <CartIconButton />
          <div data-testid="auth-section-wrapper">
            <AuthSection />
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <form
          role="search"
          action="/products"
          method="get"
          className="border-t border-border/60 px-4 py-2"
        >
          <label htmlFor="site-search-mobile" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="site-search-mobile"
              type="search"
              name="q"
              placeholder="Search for products"
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground ring-focus"
            />
          </div>
        </form>
      </div>
    </header>
  )
}
