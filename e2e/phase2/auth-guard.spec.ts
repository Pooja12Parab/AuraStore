import { test, expect } from '../fixtures/auth'

// Redirects when unauthenticated. Tests the auth gate on the
// /checkout + /orders pages. Restricted to the chromium-unauth project
// because that's the project that visits routes as a guest.
test.describe('Phase 2: Auth gates', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ extraHTTPHeaders: {} })

  test('unauthenticated /checkout redirects to /sign-in', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-unauth', 'auth-guard only runs as guest')
    await page.context().clearCookies()
    await page.goto('/checkout')
    expect(page.url()).toMatch(/\/sign-in/)
  })

  test('unauthenticated /orders redirects to /sign-in', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-unauth', 'auth-guard only runs as guest')
    await page.context().clearCookies()
    await page.goto('/orders')
    expect(page.url()).toMatch(/\/sign-in/)
  })
})
