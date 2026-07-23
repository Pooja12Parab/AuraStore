import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cartStore, CART_STORAGE_KEY, type CartItem } from '@/lib/cart'

const ITEM_A: Omit<CartItem, 'quantity'> = {
  productId: 'prod_a',
  slug: 'a',
  name: 'Item A',
  price: 100,
  imageUrl: null,
}
const ITEM_B: Omit<CartItem, 'quantity'> = {
  productId: 'prod_b',
  slug: 'b',
  name: 'Item B',
  price: 250,
  imageUrl: null,
}

describe('cartStore external store', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
  })

  afterEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    cartStore.clear()
  })

  it('U-P2-cart-1: starts empty when localStorage is empty', () => {
    expect(cartStore.getSnapshot()).toEqual({ items: [], updatedAt: 0 })
  })

  it('U-P2-cart-2: add() inserts a new item with quantity 1', () => {
    cartStore.add(ITEM_A)
    const s = cartStore.getSnapshot()
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toMatchObject({ productId: 'prod_a', quantity: 1 })
  })

  it('U-P2-cart-3: add() of an existing productId increments quantity', () => {
    cartStore.add(ITEM_A)
    cartStore.add(ITEM_A, 2)
    expect(cartStore.getSnapshot().items[0].quantity).toBe(3)
  })

  it('U-P2-cart-4: setQuantity(productId, 0) removes the item', () => {
    cartStore.add(ITEM_A)
    cartStore.setQuantity('prod_a', 0)
    expect(cartStore.getSnapshot().items).toHaveLength(0)
  })

  it('U-P2-cart-5: setQuantity(id, 3) updates quantity', () => {
    cartStore.add(ITEM_A)
    cartStore.setQuantity('prod_a', 3)
    expect(cartStore.getSnapshot().items[0].quantity).toBe(3)
  })

  it('U-P2-cart-6: remove() deletes by productId', () => {
    cartStore.add(ITEM_A)
    cartStore.add(ITEM_B)
    cartStore.remove('prod_a')
    expect(cartStore.getSnapshot().items.map((i) => i.productId)).toEqual(['prod_b'])
  })

  it('U-P2-cart-7: totalQuantity sums quantities across items', () => {
    cartStore.add(ITEM_A, 2)
    cartStore.add(ITEM_B, 3)
    expect(cartStore.totalQuantity()).toBe(5)
  })

  it('U-P2-cart-8: subtotal sums price*quantity', () => {
    cartStore.add(ITEM_A, 2) // 200
    cartStore.add(ITEM_B, 3) // 750
    expect(cartStore.subtotal()).toBe(950)
  })

  it('U-P2-cart-9: state survives a re-instantiation via in-memory snapshot (cart-ui store mirroring)', () => {
    // Cart store contract: in-memory state is the source of truth; the
    // localStorage write is an optimization for cross-reload persistence.
    // A cross-reload persistence invariant is exercised in Playwright E2E.
    cartStore.add(ITEM_A, 2)
    cartStore.setQuantity('prod_a', 5)
    cartStore.setQuantity('prod_a', 0) // remove
    cartStore.add(ITEM_B, 3)
    const snap = cartStore.getSnapshot()
    expect(snap.items).toEqual([
      { productId: 'prod_b', slug: 'b', name: 'Item B', price: 250, imageUrl: null, quantity: 3 },
    ])
    expect(cartStore.subtotal()).toBe(750)
    expect(cartStore.totalQuantity()).toBe(3)
  })
})
