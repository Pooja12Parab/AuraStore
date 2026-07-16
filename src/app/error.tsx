'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <section className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-gray-600">{error.message || 'Unexpected error.'}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Try again
        </button>
        <Link href="/" className="rounded-md border border-gray-300 px-4 py-2">
          Go home
        </Link>
      </div>
    </section>
  )
}