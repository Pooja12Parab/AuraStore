import { describe, it, expect } from 'vitest'
import { cn, formatPrice } from '@/lib/utils'

describe('cn', () => {
  it('merges truthy classes and drops falsy ones', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('a', false, 'b')).toBe('a b')
    expect(cn('a', undefined, 'b')).toBe('a b')
    expect(cn('a', '', 'b')).toBe('a b')
  })

  it('joins with space', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
})

describe('formatPrice', () => {
  it('formats cents as USD', () => {
    expect(formatPrice(249900)).toBe('$2,499.00')
    expect(formatPrice(79900)).toBe('$799.00')
    expect(formatPrice(1000)).toBe('$10.00')
    expect(formatPrice(9900)).toBe('$99.00')
  })

  it('returns $0.00 for zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('returns $0 for null or NaN', () => {
    expect(formatPrice(null as unknown as number)).toBe('$0')
    expect(formatPrice(NaN)).toBe('$0')
    expect(formatPrice(undefined as unknown as number)).toBe('$0')
  })
})
