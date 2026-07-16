import { test, expect } from './playwright.setup'
import { clerk } from '@clerk/testing/playwright'

const hasClerkKeys =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY

test.skip(!hasClerkKeys, 'Clerk keys not set — skipping E2E auth tests')

test('signed-in user sees profile menu', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  })
  await expect(page.getByTestId('user-button')).toBeVisible()
})

test('signed-out user sees sign-in button', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})