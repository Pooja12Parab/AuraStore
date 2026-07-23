import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = {
  title: 'Cart | AuraStore',
  description: 'Your AuraStore cart.',
}

export default function CartPage() {
  return <CartView />
}
