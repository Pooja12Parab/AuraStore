import Link from 'next/link'
import { Nav } from './nav'
import { AuthSection } from './auth-section'
import { CartIconButton } from '@/components/cart/cart-icon-button'

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          AuraStore
        </Link>
        <Nav />
        <div className="flex items-center gap-4">
          <CartIconButton />
          <AuthSection />
        </div>
      </div>
    </header>
  )
}
