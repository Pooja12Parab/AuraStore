'use client'

import { useSyncExternalStore } from 'react'

const CART_STORAGE_KEY = 'aurastore:cart:v1'
const EMPTY_STATE = Object.freeze({ items: [] as CartItem[], updatedAt: 0 }) as CartState

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

export type CartState = {
  items: CartItem[]
  updatedAt: number
}

function readFromStorage(): CartState {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage : (globalThis as any).localStorage
    if (!ls) return { items: [], updatedAt: 0 }
    const raw = ls.getItem(CART_STORAGE_KEY) as string | null
    if (!raw) return { items: [], updatedAt: 0 }
    const parsed = JSON.parse(raw) as Partial<CartState>
    const items = Array.isArray(parsed?.items) ? parsed.items.filter(isCartItem) : []
    return { items, updatedAt: typeof parsed?.updatedAt === 'number' ? parsed.updatedAt : 0 }
  } catch {
    return { items: [], updatedAt: 0 }
  }
}

function writeToStorage(state: CartState): void {
  try {
    const ls: Storage | undefined =
      typeof window !== 'undefined'
        ? window.localStorage
        : (globalThis as { localStorage?: Storage }).localStorage
    if (!ls) return
    ls.setItem(CART_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (Safari private mode); fail silently.
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.productId === 'string' &&
    typeof obj.slug === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.quantity === 'number' &&
    obj.quantity >= 1 &&
    (obj.imageUrl === null || typeof obj.imageUrl === 'string')
  )
}

function areItemsEqual(a: CartItem[], b: CartItem[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]
    const bi = b[i]
    if (
      ai.productId !== bi.productId ||
      ai.quantity !== bi.quantity ||
      ai.price !== bi.price ||
      ai.name !== bi.name ||
      ai.slug !== bi.slug ||
      ai.imageUrl !== bi.imageUrl
    ) {
      return false
    }
  }
  return true
}

let _state: CartState =
  typeof window === 'undefined' ? EMPTY_STATE : readFromStorage()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== CART_STORAGE_KEY) return
    const next = readFromStorage()
    _state = next
    emit()
  })
}

export type CartStoreApi = {
  getSnapshot(): CartState
  subscribe(listener: () => void): () => void
  add(item: Omit<CartItem, 'quantity'>, quantity?: number): void
  setQuantity(productId: string, quantity: number): void
  remove(productId: string): void
  clear(): void
  totalQuantity(): number
  subtotal(): number
}

export const cartStore: CartStoreApi = {
  getSnapshot(): CartState {
    return _state
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  add(item, quantity = 1) {
    if (quantity < 1) return
    const existing = _state.items.find((i) => i.productId === item.productId)
    const nextItems = existing
      ? _state.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        )
      : [..._state.items, { ...item, quantity }]
    const next: CartState = { items: nextItems, updatedAt: Date.now() }
    if (areItemsEqual(_state.items, next.items) && _state.updatedAt === next.updatedAt) {
      return
    }
    _state = next
    writeToStorage(next)
    emit()
  },
  setQuantity(productId, quantity) {
    if (quantity < 1) {
      cartStore.remove(productId)
      return
    }
    const idx = _state.items.findIndex((i) => i.productId === productId)
    if (idx === -1) return
    const existing = _state.items[idx]
    if (existing.quantity === quantity) return
    const nextItems = _state.items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i,
    )
    const next: CartState = { items: nextItems, updatedAt: Date.now() }
    _state = next
    writeToStorage(next)
    emit()
  },
  remove(productId) {
    const nextItems = _state.items.filter((i) => i.productId !== productId)
    if (nextItems.length === _state.items.length) return
    const next: CartState = { items: nextItems, updatedAt: Date.now() }
    _state = next
    writeToStorage(next)
    emit()
  },
  clear() {
    if (_state.items.length === 0) return
    const next: CartState = { items: [], updatedAt: Date.now() }
    _state = next
    writeToStorage(next)
    emit()
  },
  totalQuantity() {
    let total = 0
    for (const i of _state.items) total += i.quantity
    return total
  },
  subtotal() {
    let total = 0
    for (const i of _state.items) total += i.price * i.quantity
    return total
  },
}

export function useCart(): {
  items: CartItem[]
  totalQuantity: number
  subtotal: number
  add: CartStoreApi['add']
  setQuantity: CartStoreApi['setQuantity']
  remove: CartStoreApi['remove']
  clear: CartStoreApi['clear']
} {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    () => EMPTY_STATE,
  )
  const totalQuantity = state.items.reduce((acc, i) => acc + i.quantity, 0)
  const subtotal = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  return {
    items: state.items,
    totalQuantity,
    subtotal,
    add: cartStore.add,
    setQuantity: cartStore.setQuantity,
    remove: cartStore.remove,
    clear: cartStore.clear,
  }
}
