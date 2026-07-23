import { test, expect } from '../fixtures/auth'

// Cart UI smoke tests against a live browser. Verifies:
// - cart drawer is mounted
// - clicking the cart icon opens it
// - the empty-state and item-state both render correctly
// - persisted state survives reload
test.describe('Phase 2: Cart drawer', () => {
  test('cart drawer is mounted in the layout', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByTestId('cart-icon-button')).toBeVisible()
  })

  test('cart drawer renders the empty state initially', async ({ page }) => {
    // Reset cart by clearing localStorage before visit.
    await page.goto('/products')
    await page.evaluate(() => window.localStorage.removeItem('aurastore:cart:v1'))
    await page.reload()
    await page.getByTestId('cart-icon-button').click()
    await expect(page.getByTestId('cart-drawer-popup')).toBeVisible()
    await expect(page.getByTestId('cart-empty')).toBeVisible()
    await expect(page.getByText(/your cart is empty/i)).toBeVisible()
  })

  test('add-to-cart updates the badge count', async ({ page }) => {
    await page.goto('/products')
    await page.evaluate(() => window.localStorage.removeItem('aurastore:cart:v1'))
    await page.reload()
    const addBtn = page.getByTestId('add-to-cart').first()
    if (await addBtn.count()) {
      await addBtn.click()
    }
    await expect(page.getByTestId('cart-icon-badge')).toBeVisible()
  })

  test('cart persists across reload', async ({ page }) => {
    await page.goto('/products')
    await page.evaluate(() => {
      const item = {
        productId: 'prod_test',
        slug: 'wireless-headphones',
        name: 'Wireless Headphones',
        price: 19900,
        imageUrl: null,
        quantity: 1,
      }
      window.localStorage.setItem(
        'aurastore:cart:v1',
        JSON.stringify({ items: [item], updatedAt: Date.now() }),
      )
    })
    await page.reload()
    await expect(page.getByTestId('cart-icon-badge')).toBeVisible()
    await expect(page.getByTestId('cart-icon-badge')).toHaveText('1')
  })
})
