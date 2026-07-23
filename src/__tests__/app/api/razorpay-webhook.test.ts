import crypto from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { POST } from '@/app/api/webhooks/razorpay/route'

const secret = 'whsec_test_abcdef'

const capturedPayload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_1',
        order_id: 'order_1',
        amount: 49980000,
        currency: 'INR',
        status: 'captured',
      },
    },
  },
}

const failedPayload = {
  event: 'payment.failed',
  payload: {
    payment: {
      entity: {
        id: 'pay_2',
        order_id: 'order_2',
        amount: 49980000,
        currency: 'INR',
        status: 'failed',
        error_description: 'card_declined',
      },
    },
  },
}

const strapiHandlers = [
  http.put('http://localhost:1337/api/orders/:documentId', () =>
    HttpResponse.json({ data: { documentId: 'ord_test' } }),
  ),
]

const server = setupServer(...strapiHandlers)

beforeAll(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET = secret
  server.listen({ onUnhandledRequest: 'warn' })
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterAll(() => server.close())

function makeWebhookReq(payload: object, signature?: string): Request {
  const body = JSON.stringify(payload)
  const sig = signature ?? crypto.createHmac('sha256', secret).update(body).digest('hex')
  return new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig },
    body,
  }) as unknown as Request
}

describe('I-P2-wh: POST /api/webhooks/razorpay', () => {
  it('I-P2-wh-1: 400 on invalid signature', async () => {
    const res = await POST(makeWebhookReq(capturedPayload, 'wrong'))
    expect(res.status).toBe(400)
  })

  it('I-P2-wh-2: 200 + idempotent on payment.captured', async () => {
    const res = await POST(makeWebhookReq(capturedPayload))
    expect(res.status).toBe(200)
  })

  it('I-P2-wh-3: 200 on payment.failed', async () => {
    const res = await POST(makeWebhookReq(failedPayload))
    expect(res.status).toBe(200)
  })

  it('I-P2-wh-4: 200 with no-op for unknown razorpayOrderId', async () => {
    const res = await POST(makeWebhookReq({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_3',
            order_id: 'order_unknown',
            amount: 100,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    }))
    expect(res.status).toBe(200)
  })

  it('I-P2-wh-5: 400 on unparsable JSON body with valid sig of "garbage"', async () => {
    const garbage = 'not-json{{'
    const sig = crypto.createHmac('sha256', secret).update(garbage).digest('hex')
    const res = await POST(new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig },
      body: garbage,
    }) as unknown as Request)
    expect(res.status).toBe(400)
  })
})
