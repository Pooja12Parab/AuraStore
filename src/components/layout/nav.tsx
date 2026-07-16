'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <nav aria-label="Primary" className="flex items-center">
      <div className="hidden gap-4 text-sm md:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-gray-700 hover:text-black">
            {link.label}
          </Link>
        ))}
      </div>
      <button
        type="button"
        data-testid="nav-hamburger"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="nav-mobile-panel"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm md:hidden"
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <div
          id="nav-mobile-panel"
          data-testid="nav-mobile-panel"
          className="absolute left-0 right-0 top-full z-20 flex flex-col gap-2 border-b bg-white px-4 py-3 shadow-md md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-700 hover:text-black"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
