'use client'

import Link from 'next/link'
import { Drawer } from '@base-ui/react/drawer'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart'
import { useCartUI } from '@/lib/cart-ui'
import { CartItemRow } from './cart-item'
import { CartSummary } from './cart-summary'

export function CartDrawer() {
  const isOpen = useCartUI((s) => s.isOpen)
  const close = useCartUI((s) => s.close)
  const { items } = useCart()

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) close()
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 z-40 bg-black/40"
          data-testid="cart-drawer-backdrop"
        />
        <Drawer.Viewport>
          <Drawer.Popup
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-0 border-l bg-background p-6 shadow-xl"
            data-testid="cart-drawer-popup"
          >
            <div className="flex items-center justify-between gap-2">
              <Drawer.Title className="flex items-center gap-2 text-lg font-semibold">
                <ShoppingCart className="h-5 w-5" aria-hidden /> Your cart
              </Drawer.Title>
              <Drawer.Close
                render={
                  <Button variant="ghost" size="sm">
                    Close
                  </Button>
                }
              />
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div
                  className="flex h-full flex-col items-center justify-center text-center text-muted-foreground"
                  data-testid="cart-empty"
                >
                  <ShoppingCart className="mb-2 h-10 w-10" aria-hidden />
                  <p className="text-sm">Your cart is empty.</p>
                  <Link
                    href="/products"
                    onClick={close}
                    className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                <div data-testid="cart-items">
                  {items.map((item) => (
                    <CartItemRow key={item.productId} item={item} />
                  ))}
                </div>
              )}
            </div>
            <CartSummary />
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
