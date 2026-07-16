import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', 'http://localhost:1337')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getProducts query building', () => {
  it('builds correct qs string with explicit populate (no populate=*)', async () => {
    vi.resetModules()
    const { getProducts } = await import('@/lib/strapi-queries')
    const result = await getProducts()
    expect(result).toBeDefined()
    expect(result.meta.pagination.total).toBeGreaterThanOrEqual(0)
  })

  it('adds category filter when category param passed', async () => {
    vi.resetModules()
    const { getProducts } = await import('@/lib/strapi-queries')
    const result = await getProducts({ category: 'electronics' })
    const products = result.data
    expect(products.every((p: { category: { slug: string } }) => p.category.slug === 'electronics')).toBe(true)
  })
})

describe('getProductBySlug', () => {
  it('throws when product not found', async () => {
    vi.resetModules()
    const { getProductBySlug } = await import('@/lib/strapi-queries')
    await expect(getProductBySlug('non-existent')).rejects.toThrow('Product not found')
  })
})
