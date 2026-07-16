'use client'

import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export function AuthSection() {
  const { isSignedIn } = useUser()

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton>
        <button className="rounded-md bg-black px-4 py-2 text-sm text-white">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton>
        <button className="rounded-md border border-black px-4 py-2 text-sm">
          Sign up
        </button>
      </SignUpButton>
    </div>
  )
}
