import Link from 'next/link'
import { Nav } from './nav'
import { AuthSection } from './auth-section'

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          AuraStore
        </Link>
        <Nav />
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="pointer-events-none opacity-0">
            <span data-testid="cart-slot" />
          </div>
          <AuthSection />
        </div>
      </div>
    </header>
  )
}
