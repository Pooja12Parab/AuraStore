import { test, expect } from './playwright.setup'

const hasStrapi = !!process.env.NEXT_PUBLIC_STRAPI_API_URL && !!process.env.STRAPI_API_TOKEN

test.skip(!hasStrapi, 'Strapi env not set — skipping product listing E2E')

test('products page lists seeded products and supports category filter', async ({ page }) => {
  await page.goto('/products')
  await expect(page.getByRole('heading', { level: 1, name: /products/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /wireless headphones/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /cotton t-shirt/i }).first()).toBeVisible()

  await page.getByRole('button', { name: /^clothing$/i }).click()
  await expect(page).toHaveURL(/[?&]category=clothing\b/)
  await expect(page.getByRole('link', { name: /cotton t-shirt/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /wireless headphones/i })).toHaveCount(0)
})

test('category page shows products filtered to the slug', async ({ page }) => {
  await page.goto('/category/clothing')
  await expect(page.getByRole('heading', { level: 1, name: /clothing/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^clothing$/i })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: /cotton t-shirt/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /wireless headphones/i })).toHaveCount(0)
})

test('unknown category slug triggers not-found', async ({ page }) => {
  const response = await page.goto('/category/unknown-category', { waitUntil: 'load' })
  expect(response?.status()).toBe(404)
})