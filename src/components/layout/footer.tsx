import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
        <span className="text-sm font-bold">AuraStore</span>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link href="/products">Products</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}
