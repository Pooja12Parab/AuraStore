import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/common/error-boundary'

const ThrowComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Safe content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <div>Safe content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('resets and re-renders children on reset', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()

    // Render with non-throwing children to simulate reset
    rerender(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <div>Recovered content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})