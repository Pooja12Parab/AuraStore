import { test as base } from '@playwright/test'
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright'
import { handlers } from '../src/__tests__/mocks/handlers'

export const test = base.extend<{ network: NetworkFixture }>({
  network: async ({ context }, use) => {
    const network = defineNetworkFixture({ context, handlers })
    await network.enable()
    await use(network)
    await network.disable()
  },
})

export { expect } from '@playwright/test'
