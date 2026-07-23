import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted() runs before any import — required because vi.mock is
// hoisted above module-level consts.
const { createOrderForCheckoutMock } = vi.hoisted(() => ({
  createOrderForCheckoutMock: vi.fn(),
}))

vi.mock('@/lib/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/orders')>()
  return {
    ...actual,
    createOrderForCheckout: createOrderForCheckoutMock,
  }
})

import { POST } from '@/app/api/orders/create/route'
import { auth } from '@clerk/nextjs/server'

const validBody = {
  items: [{ productId: 'prod1', quantity: 2 }],
  address: {
    fullName: 'Jane Doe',
    street: '221B Baker Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
  },
  email: 'jane@example.com',
}

beforeAll(() => {
  process.env.STRAPI_API_TOKEN_WRITE = 'write-test'
  process.env.STRAPI_API_TOKEN = 'read-test'
})

beforeEach(() => {
  createOrderForCheckoutMock.mockReset()
  vi.mocked(auth).mockReset()
  vi.mocked(auth).mockResolvedValue({ userId: 'user_test_123' } as never)
})

afterAll(() => {
  createOrderForCheckoutMock.mockReset()
})

function makeReq(body: unknown): Request {
  return new Request('http://localhost:3000/api/orders/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Request
}

describe('I-P2-create: POST /api/orders/create', () => {
  it('I-P2-create-1: 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(401)
  })

  it('I-P2-create-2: 400 when body fails zod validation', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_test_123' } as never)
    const res = await POST(makeReq({ ...validBody, email: 'not-an-email' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid input')
  })

  it('I-P2-create-3: 200 with order_id on success', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_test_123' } as never)
    createOrderForCheckoutMock.mockResolvedValueOnce({
      ok: true,
      razorpayOrderId: 'order_test_1',
      amountInr: 499800,
      amountPaise: 49980000,
      currency: 'INR',
      orderDocumentId: 'ord_abc123',
    })
    const res = await POST(makeReq(validBody))
    if (res.status !== 200) {
      const body = await res.json()
      console.error('--- DEBUG body:', JSON.stringify(body))
    }
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.order_id).toBe('order_test_1')
    expect(json.amount).toBe(49980000)
    expect(json.orderDocumentId).toBe('ord_abc123')
    expect(json.currency).toBe('INR')
  })

  it('I-P2-create-4: 500 when createOrderForCheckout throws', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_test_123' } as never)
    createOrderForCheckoutMock.mockRejectedValueOnce(new Error('strapi 503'))
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(500)
  })
})
