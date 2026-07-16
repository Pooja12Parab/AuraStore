import { vi } from 'vitest'
import React from 'react'
import { clerkMockState } from '../clerk-state'

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }),
  SignInButton: () => React.createElement('button', null, 'Sign in'),
  SignUpButton: () => React.createElement('button', null, 'Sign up'),
  useUser: () => ({
    isSignedIn: clerkMockState.isSignedIn,
    user: { firstName: 'Test' },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
}))
