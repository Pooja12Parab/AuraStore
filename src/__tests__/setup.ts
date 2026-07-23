import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { server } from './mocks/server'
import './mocks/clerk'

// Mock @clerk/nextjs/server so Server Component tests and route handlers can
// resolve auth() without booting the real Clerk SDK.
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test_123' }),
  currentUser: vi.fn().mockResolvedValue({ id: 'user_test_123', emailAddresses: [{ emailAddress: 'clerk-test@example.com' }] }),
  clerkMiddleware: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  createRouteMatcher: vi.fn(() => () => false),
  ClerkProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }),
}))

// Stub Razorpay Checkout.js globally. Component tests use this; E2E uses the
// real modal against Test Mode.
type RazorpayCheckoutOptions = {
  key?: string
  order_id?: string
  amount?: number
  currency?: string
  name?: string
  description?: string
  handler?: (response: Record<string, unknown>) => void
  modal?: { ondismiss?: () => void; onDismiss?: () => void }
  prefill?: Record<string, unknown>
  notes?: Record<string, unknown>
  theme?: Record<string, unknown>
  [k: string]: unknown
}

interface RazorpayInstance {
  open(): void
  close(): void
  on(event: string, handler: (...args: unknown[]) => void): void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance
  }
}

beforeAll(() => {
  window.Razorpay = class MockRazorpay {
    private options: RazorpayCheckoutOptions
    constructor(options: RazorpayCheckoutOptions) {
      this.options = options
    }
    open(): void {
      const handler = this.options.handler
      if (handler) {
        handler({
          razorpay_order_id: this.options.order_id,
          razorpay_payment_id: `pay_test_${Math.random().toString(36).slice(2, 10)}`,
          razorpay_signature: 'test_signature',
        })
      }
    }
    close(): void {
      this.options.modal?.ondismiss?.()
    }
    on(): void {
      // no-op
    }
  }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
afterEach(() => cleanup())

const store: Record<string, string> = {}
const localStorageStub = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v
  },
  removeItem: (k: string) => {
    delete store[k]
  },
  clear: () => {
    for (const k in store) delete store[k]
  },
}
vi.stubGlobal('localStorage', localStorageStub)
if (typeof window !== 'undefined') {
  ;(window as unknown as { localStorage: typeof localStorageStub }).localStorage = localStorageStub
}

vi.stubGlobal('IntersectionObserver', vi.fn(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }
}))

// Sonner toast spies — tests assert against these for "did a toast fire?".
// We import after window stubs are set up to avoid cases where jsdom
// initializes the module before our stubs.
import { toast } from 'sonner'
vi.spyOn(toast, 'success')
vi.spyOn(toast, 'error')
vi.spyOn(toast, 'info')
vi.spyOn(toast, 'warning')
