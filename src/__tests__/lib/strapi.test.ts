import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', 'http://localhost:1337')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('strapiFetch integration', () => {
  it('throws on 404 with status in message', async () => {
    vi.stubEnv('STRAPI_API_TOKEN', 'test-token')
    vi.resetModules()
    const { strapiFetch } = await import('@/lib/strapi')
    await expect(strapiFetch('/not-found')).rejects.toThrow('Strapi API error 404')
  })
})