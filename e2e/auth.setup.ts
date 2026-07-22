import { test as setup, expect } from './fixtures/auth'
import { clerk, clerkSetup } from '@clerk/testing/playwright'

const authFile = 'playwright/.auth/user.json'

setup.beforeAll(async () => {
  await clerkSetup()
})

setup('authenticate', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  })
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeHidden()
  await expect(page.locator('.cl-userButtonTrigger')).toBeVisible()
  await page.context().storageState({ path: authFile })
})