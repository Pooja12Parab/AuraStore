import { describe, it, expect } from 'vitest'
import { cn, formatINR } from '@/lib/utils'

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

describe('formatINR', () => {
  it('formats whole rupees in Indian numbering', () => {
    expect(formatINR(249900)).toBe('₹2,49,900')
    expect(formatINR(79900)).toBe('₹79,900')
    expect(formatINR(1000)).toBe('₹1,000')
  })

  it('returns ₹0 for zero', () => {
    expect(formatINR(0)).toBe('₹0')
  })

  it('returns ₹0 for null or NaN', () => {
    expect(formatINR(null as unknown as number)).toBe('₹0')
    expect(formatINR(NaN)).toBe('₹0')
    expect(formatINR(undefined as unknown as number)).toBe('₹0')
  })
})