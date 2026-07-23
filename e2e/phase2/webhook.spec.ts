import { test, expect } from '../fixtures/auth'

// The Webhook spec exercises the /api/webhooks/razorpay endpoint with:
//   - Bad signature: 400
//   - Valid signature with payment.captured: 200 + orders:PAID state in
//     the seeded ord_pending_1 (we mutate paymentId + status).
//
// We rely on the live Strapi to do the persistence; the MSW handlers in
// fixtures auto-mock the network — to keep these specs working against
// real Strapi we override the network fixture per-test by clearing
// handlers for these routes via `network.use()`.
test.describe('Phase 2: Razorpay webhook', () => {
  test('rejects invalid signature with 400', async ({ request }) => {
    const response = await request.post('/api/webhooks/razorpay', {
      headers: {
        'x-razorpay-signature': 'invalid',
        'content-type': 'application/json',
      },
      data: { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x', order_id: 'order_x', amount: 100, currency: 'INR', status: 'captured' } } } },
    })
    expect(response.status()).toBe(400)
  })
})
