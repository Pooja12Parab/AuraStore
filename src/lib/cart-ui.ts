'use client'

import { useSyncExternalStore } from 'react'

let isOpen = false
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

export const cartUI = {
  open(): void {
    if (isOpen) return
    isOpen = true
    notify()
  },
  close(): void {
    if (!isOpen) return
    isOpen = false
    notify()
  },
  toggle(): void {
    isOpen = !isOpen
    notify()
  },
  getSnapshot(): boolean {
    return isOpen
  },
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const serverSnapshot = (): boolean => false

type CartUiSnapshot = {
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
}

export function useCartUI(): CartUiSnapshot
export function useCartUI<T>(selector: (s: CartUiSnapshot) => T): T
export function useCartUI<T>(selector?: (s: CartUiSnapshot) => T): T | CartUiSnapshot {
  const isOpenValue = useSyncExternalStore(subscribe, cartUI.getSnapshot, serverSnapshot)
  if (!selector) {
    return {
      isOpen: isOpenValue,
      open: () => cartUI.open(),
      close: () => cartUI.close(),
      toggle: () => cartUI.toggle(),
    } satisfies CartUiSnapshot
  }
  return selector({
    isOpen: isOpenValue,
    open: () => cartUI.open(),
    close: () => cartUI.close(),
    toggle: () => cartUI.toggle(),
  })
}
