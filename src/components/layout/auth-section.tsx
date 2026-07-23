'use client'

import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

export function AuthSection() {
  const { isSignedIn } = useUser()

  if (isSignedIn) {
    return (
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 ring-1 ring-border',
            },
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button
          type="button"
          data-testid="sign-in"
          className={cn(
            'rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground',
            'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ring-focus',
          )}
        >
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          type="button"
          data-testid="sign-up"
          className={cn(
            'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm ring-focus',
            'hover:bg-primary/90',
          )}
        >
          Sign up
        </button>
      </SignUpButton>
    </div>
  )
}
