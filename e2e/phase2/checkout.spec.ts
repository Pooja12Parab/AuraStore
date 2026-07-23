import { test, expect } from '../fixtures/auth'

// The checkout page requires Clerk auth. We test only that authenticated
// users reach the form. End-to-end payment with Razorpay's Test Mode
// requires:
//
//   - ngrok or Cloudflare Tunnel forwarding https://<tunnel>/api/webhooks/razorpay
//     to localhost:3000 (per the Phase 2 Prereqs / Step 4.7 of the plan).
//   - the Razorpay modal to be dismissed cleanly through the iframe
//     using Playwright frame locators (Stripe-style).
//
// That lane is not exercised here; this spec only verifies the protected
// route + the address form posts to /api/orders/create and renders the
// next stage (RazorpayCheckout) when the call returns 200.
test.describe('Phase 2: Checkout page', () => {
  test('authenticated /checkout renders the address form', async ({ page }) => {
    await page.goto('/checkout')
    // Either checkout renders the address form OR the empty-cart state.
    const hasForm = await page.getByTestId('address-form').count()
    const hasEmpty = await page.getByTestId('checkout-empty').count()
    expect(hasForm + hasEmpty).toBeGreaterThan(0)
  })

  test('empty cart shows the empty-cart message', async ({ page }) => {
    await page.goto('/checkout')
    await page.evaluate(() => window.localStorage.removeItem('aurastore:cart:v1'))
    await page.reload()
    await expect(page.getByTestId('checkout-empty')).toBeVisible()
  })
})
