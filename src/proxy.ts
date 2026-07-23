import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

const isProtectedRoute = createRouteMatcher([
  '/orders(.*)',
  '/checkout',
  '/checkout/(.*)',
  '/account(.*)',
])

const PRODUCT_SLUG_RE = /^\/products\/([^\/]+)$/
const CATEGORY_SLUG_RE = /^\/category\/([^\/]+)$/

async function slugExists(collection: 'products' | 'categories', slug: string): Promise<boolean> {
  const params = new URLSearchParams({
    'filters[slug][$eq]': slug,
    'pagination[pageSize]': '1',
  })
  const res = await fetch(`${STRAPI_URL}/api/${collection}?${params.toString()}`, {
    headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    cache: 'no-store',
  })
  if (!res.ok) return true
  const data = (await res.json()) as { data?: unknown[] }
  return Array.isArray(data.data) && data.data.length > 0
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname

  // Rewrite unknown product/category slugs to the 404 page so static-export
  // routes (/products/[slug], /category/[slug]) never serve a blank page.
  const productMatch = pathname.match(PRODUCT_SLUG_RE)
  if (productMatch && !(await slugExists('products', decodeURIComponent(productMatch[1])))) {
    return NextResponse.rewrite(new URL('/__not-found', req.url), { status: 404 })
  }

  const categoryMatch = pathname.match(CATEGORY_SLUG_RE)
  if (categoryMatch && !(await slugExists('categories', decodeURIComponent(categoryMatch[1])))) {
    return NextResponse.rewrite(new URL('/__not-found', req.url), { status: 404 })
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}