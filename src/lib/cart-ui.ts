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

export function useCartUI(): {
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
} {
  const open = useSyncExternalStore(subscribe, cartUI.getSnapshot, serverSnapshot)
  return {
    isOpen: open,
    open: cartUI.open,
    close: cartUI.close,
    toggle: cartUI.toggle,
  }
}
