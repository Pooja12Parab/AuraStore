import { NextResponse } from 'next/server'
import { strapiFetch } from '@/lib/strapi'

// Server-side proxy for the public /products call used by the home page.
// The client cannot see STRAPI_API_TOKEN (no NEXT_PUBLIC_ prefix), so the
// public Strapi token must be applied server-side and proxied through
// Next.js. This route is intentionally public and is read-only.
//
// Note: do NOT export `dynamic = 'force-dynamic'` here. Next.js 16 with
// `cacheComponents: true` rejects explicit runtime declarations on route
// handlers. See the /api/orders/create and /api/webhooks/razorpay notes.

export async function GET() {
  try {
    const res = await strapiFetch<{ data: unknown[] }>(
      '/products?filters[featured][$eq]=true&populate=*&sort=price:asc&pagination[pageSize]=8',
    )
    return NextResponse.json({ data: res.data ?? [] })
  } catch (err) {
    return NextResponse.json(
      { data: [], error: err instanceof Error ? err.message : 'unknown' },
      { status: 200 }, // intentional: the home page should still render the empty state, not a 500
    )
  }
}
