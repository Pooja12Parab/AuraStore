import { test, expect } from './playwright.setup'

const hasStrapi = !!process.env.NEXT_PUBLIC_STRAPI_API_URL && !!process.env.STRAPI_API_TOKEN

test.skip(!hasStrapi, 'Strapi env not set — skipping product detail E2E')

test('product detail page renders seeded wireless headphones', async ({ page }) => {
  await page.goto('/products/wireless-headphones')
  await expect(page.getByRole('heading', { level: 1, name: /wireless headphones/i })).toBeVisible()
  await expect(page.getByText(/premium noise-cancelling/i)).toBeVisible()
  await expect(page.getByText('₹2,49,900')).toBeVisible()
  await expect(page.getByRole('link', { name: /^electronics$/i }).first()).toBeVisible()
})

test('unknown product slug triggers not-found', async ({ page }) => {
  const response = await page.goto('/products/this-product-does-not-exist', { waitUntil: 'load' })
  expect(response?.status()).toBe(404)
})

