import { test as base, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright'
import { handlers } from '../../src/__tests__/mocks/handlers'

type Fixtures = {
  network: NetworkFixture
}

export const test = base.extend<Fixtures>({
  network: async ({ context }, use) => {
    const network = defineNetworkFixture({ context, handlers })
    await network.enable()
    await use(network)
    await network.disable()
  },

  page: async ({ context, page }, use) => {
    await setupClerkTestingToken({ context, page })
    await use(page)
  },
})

export { expect }