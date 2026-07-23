import { describe, expect, it } from 'vitest'
import { computeOrderTotalInr, rupeesToPaise } from '@/lib/orders'

describe('U-P2-total: computeOrderTotalInr + rupeesToPaise', () => {
  it('U-P2-total-1: sums price*qty (whole INR rupees)', () => {
    expect(
      computeOrderTotalInr([
        { price: 249900, quantity: 2 },
        { price: 250, quantity: 3 },
      ]),
    ).toBe(500550)
  })

  it('U-P2-total-2: rupeesToPaise converts rupees to paise', () => {
    expect(rupeesToPaise(249900)).toBe(249900)
    expect(rupeesToPaise(0)).toBe(0)
  })
})
