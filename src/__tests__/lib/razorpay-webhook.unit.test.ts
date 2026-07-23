import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyRazorpaySignature } from '@/lib/razorpay-webhook'

describe('U-P2-sig: HMAC-SHA256 signature verification', () => {
  const secret = 'whsec_test'
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 49980000, currency: 'INR', status: 'captured' } },
    },
  })
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')

  it('U-P2-sig-1: returns true for a valid signature', () => {
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true)
  })

  it('U-P2-sig-2: returns false for a tampered signature', () => {
    expect(verifyRazorpaySignature(body, sig + 'deadbeef', secret)).toBe(false)
  })

  it('U-P2-sig-3: returns false when secret is empty', () => {
    expect(verifyRazorpaySignature(body, sig, '')).toBe(false)
  })

  it('U-P2-sig-4: returns false when header signature is missing', () => {
    expect(verifyRazorpaySignature(body, '', secret)).toBe(false)
  })

  it('U-P2-sig-5: returns false for body tampered post-signing', () => {
    expect(verifyRazorpaySignature(body + 'x', sig, secret)).toBe(false)
  })
})
