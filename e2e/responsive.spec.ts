import { test, expect } from './playwright.setup'

test('mobile viewport shows hamburger and hides desktop nav', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const hamburger = page.getByTestId('nav-hamburger')
  await expect(hamburger).toBeVisible()
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  await expect(hamburger).toBeVisible()
})

test('desktop viewport hides hamburger and shows horizontal nav links', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByTestId('nav-hamburger')).toBeHidden()
  await expect(page.getByRole('link', { name: /products/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible()
})
