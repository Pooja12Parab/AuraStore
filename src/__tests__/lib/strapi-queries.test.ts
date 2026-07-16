import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { seedTestData } from '@/__tests__/mocks/seed'
import { db } from '@/__tests__/mocks/factories'

beforeAll(() => {
  seedTestData()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('query building integration', () => {
  it('getProducts returns seeded products via qs query', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', 'http://localhost:1337')
    vi.resetModules()
    const { getProducts } = await import('@/lib/strapi-queries')
    const result = await getProducts()
    expect(result.data.length).toBeGreaterThanOrEqual(2)
  })

  it('category filter via MSW returns subset', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', 'http://localhost:1337')
    vi.resetModules()
    const { getProducts } = await import('@/lib/strapi-queries')
    const result = await getProducts({ category: 'electronics' })
    const slugs = result.data.map((p: { slug: string }) => p.slug)
    expect(slugs).toContain('wireless-headphones')
    expect(slugs).not.toContain('cotton-tshirt')
  })

  it('getProductBySlug throws on missing product', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', 'http://localhost:1337')
    vi.resetModules()
    const { getProductBySlug } = await import('@/lib/strapi-queries')
    await expect(getProductBySlug('non-existent')).rejects.toThrow('Product not found')
  })
})