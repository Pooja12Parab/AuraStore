import { test, expect } from './fixtures/auth'

test('home page renders hero CTA that navigates to /products', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /shop curated essentials/i })).toBeVisible()
  await expect(page.getByTestId('hero-cta')).toBeVisible()
  await page.getByTestId('hero-cta').click()
  await expect(page).toHaveURL(/\/products$/)
})