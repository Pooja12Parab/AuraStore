import { test, expect } from './playwright.setup'

const hasClerkKeys =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY

test.skip(!hasClerkKeys, 'Clerk keys not set — skipping auth-guard E2E')

test('unauthenticated GET /orders does not return 200', async ({ request }) => {
  const response = await request.get('/orders', { maxRedirects: 0, failOnStatusCode: false })
  expect(response.status()).not.toBe(200)
  expect([301, 302, 307, 308]).toContain(response.status())
})

test('authenticated GET /orders loads without throwing', async ({ page }) => {
  const response = await page.goto('/orders')
  expect(response).not.toBeNull()
  await expect(page.locator('body')).not.toBeEmpty()
})
