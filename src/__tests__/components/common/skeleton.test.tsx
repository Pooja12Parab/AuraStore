import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/common/skeleton'

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('animate-pulse')
  })

  it('accepts additional className', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('h-10')
    expect(div.className).toContain('w-20')
  })
})