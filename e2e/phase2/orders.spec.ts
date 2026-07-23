import { test, expect } from '../fixtures/auth'

// Verify the seeded Strapi orders reach /orders for the test user.
// Restricted to chromium-auth (and the other auth-storage-state projects)
// so that Clerk auth is established.
test.describe('Phase 2: Orders history', () => {
  test('shows the seeded paid + pending orders', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-unauth', 'orders requires Clerk auth')
    await page.goto('/orders')
    await expect(page.getByTestId('orders-page')).toBeVisible()
    await expect(page.getByText('ord_paid_1')).toBeVisible()
    await expect(page.getByText('ord_pending_1')).toBeVisible()
    await expect(page.getByTestId('order-row-status-paid').first()).toBeVisible()
  })

  test('order detail page renders for the seeded paid order', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-unauth', 'orders requires Clerk auth')
    await page.goto('/orders')
    await page.getByText('ord_paid_1').click()
    await expect(page.getByTestId('order-detail')).toBeVisible()
    await expect(page.getByTestId('order-detail-status')).toHaveText('Paid')
    await expect(page.getByTestId('order-detail-total')).toBeVisible()
  })
})
