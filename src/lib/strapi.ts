const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

interface StrapiFetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export async function strapiFetch<T>(
  endpoint: string,
  options: StrapiFetchOptions = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    ...options.headers,
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const text = await response.text()
    let message = `Strapi ${response.status}`
    try {
      const err = JSON.parse(text)
      message = err.error?.message || message
    } catch {}
    throw new Error(`Strapi API error ${response.status}: ${message}`)
  }

  return response.json()
}

export function strapiMedia(image: { url: string }): string {
  if (!image?.url) return ''
  if (image.url.startsWith('http')) return image.url
  return `${STRAPI_URL}${image.url}`
}

export async function fetchFeaturedProducts() {
  return strapiFetch<{ data: unknown[] }>(
    '/products?filters[featured][$eq]=true&populate=*&pagination[pageSize]=8',
    { cache: 'no-store' },
  )
}
