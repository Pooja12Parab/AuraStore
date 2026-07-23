'use client'

import Link from 'next/link'
import { Drawer } from '@base-ui/react/drawer'
import { ShoppingBag, X, Sparkles } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useCartUI } from '@/lib/cart-ui'
import { CartItemRow } from './cart-item'
import { CartSummary } from './cart-summary'
import { cn } from '@/lib/utils'

const SUGGESTED = [
  { href: '/products?sort=newest', label: 'New arrivals' },
  { href: '/products?featured=1', label: 'Bestsellers' },
  { href: '/category/audio', label: 'Audio' },
  { href: '/category/home', label: 'Home' },
] as const

export function CartDrawer() {
  const isOpen = useCartUI((s) => s.isOpen)
  const close = useCartUI((s) => s.close)
  const { items, subtotal } = useCart()
  const empty = items.length === 0

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) close()
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
          data-testid="cart-drawer-backdrop"
        />
        <Drawer.Viewport>
          <Drawer.Popup
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-0 border-l border-border bg-background shadow-2xl"
            data-testid="cart-drawer-popup"
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between gap-3 border-b border-border/80 px-6 py-4',
                empty ? 'bg-brand-tint' : 'bg-background',
              )}
            >
              <div>
                <Drawer.Title className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <ShoppingBag className="h-5 w-5 text-brand-700" aria-hidden />
                  Your cart
                  {!empty ? (
                    <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
                      {items.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                  ) : null}
                </Drawer.Title>
                <Drawer.Description className="sr-only">
                  Cart contents
                </Drawer.Description>
                {!empty ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Subtotal {subtotal > 0 ? `₹${(subtotal / 100).toFixed(2)}` : '—'}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Free shipping over ₹499
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {empty ? (
                <div
                  className="flex h-full flex-col items-center justify-center text-center"
                  data-testid="cart-empty"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <ShoppingBag className="h-7 w-7" aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Your cart is empty
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Start exploring — we'll keep your picks here until you're ready.
                  </p>
                  <Link
                    href="/products"
                    onClick={close}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 ring-focus"
                  >
                    Browse products
                  </Link>
                  <div className="mt-8 w-full">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden /> Popular right now
                    </p>
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {SUGGESTED.map((s) => (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            onClick={close}
                            className="block rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                          >
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div data-testid="cart-items" className="space-y-0">
                  {items.map((item) => (
                    <CartItemRow key={item.productId} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!empty ? <CartSummary /> : null}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
