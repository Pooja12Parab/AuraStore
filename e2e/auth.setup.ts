import { test as setup, expect } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  })
  await expect(page.getByTestId('user-button')).toBeVisible()
  await page.context().storageState({ path: authFile })
})
