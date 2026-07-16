import { describe, it, expect, vi, beforeEach } from 'vitest'

const TEST_URL = 'http://localhost:1337'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_STRAPI_API_URL', TEST_URL)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('strapiMedia', () => {
  it('prepends STRAPI_API_URL to relative URLs', async () => {
    const { strapiMedia } = await import('@/lib/strapi')
    expect(strapiMedia({ url: '/uploads/img.jpg' })).toBe(`${TEST_URL}/uploads/img.jpg`)
  })

  it('passes through absolute URLs', async () => {
    const { strapiMedia } = await import('@/lib/strapi')
    expect(strapiMedia({ url: 'https://cdn.example.com/img.jpg' })).toBe('https://cdn.example.com/img.jpg')
  })

  it('returns empty string for empty/missing URL', async () => {
    const { strapiMedia } = await import('@/lib/strapi')
    expect(strapiMedia({ url: '' })).toBe('')
  })
})

describe('strapiFetch', () => {
  it('returns parsed JSON on success with Bearer token', async () => {
    vi.stubEnv('STRAPI_API_TOKEN', 'test-token-123')
    vi.resetModules()
    const { strapiFetch } = await import('@/lib/strapi')
    const result = await strapiFetch('/test')
    expect(result).toEqual({ data: [{ id: 1 }] })
  })

  it('throws with status on 404', async () => {
    vi.resetModules()
    const { strapiFetch } = await import('@/lib/strapi')
    await expect(strapiFetch('/not-found')).rejects.toThrow('Strapi API error 404')
  })

  it('throws with Strapi error message on 500', async () => {
    vi.resetModules()
    const { strapiFetch } = await import('@/lib/strapi')
    await expect(strapiFetch('/server-error')).rejects.toThrow('Internal server error')
  })
})