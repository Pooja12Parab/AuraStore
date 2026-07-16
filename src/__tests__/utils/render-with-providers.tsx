import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { clerkMockState } from '@/__tests__/mocks/clerk-state'

export function renderWithProviders(
  ui: ReactNode,
  { isSignedIn = false } = {}
) {
  clerkMockState.isSignedIn = isSignedIn
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}