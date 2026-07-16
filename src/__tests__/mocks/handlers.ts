import { http, HttpResponse } from 'msw'
import { db } from './factories'

const STRAPI = 'http://localhost:1337'

export const handlers = [
  http.get(`${STRAPI}/api/test`, () => {
    return HttpResponse.json({ data: [{ id: 1 }] })
  }),

  http.get(`${STRAPI}/api/not-found`, () => {
    return new HttpResponse(null, { status: 404 })
  }),

  http.get(`${STRAPI}/api/server-error`, () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }),

http.get(`${STRAPI}/api/products`, ({ request }) => {
    const url = new URL(request.url)
    const categorySlug = url.searchParams.get('filters[category][slug][$eq]')
    const productSlug = url.searchParams.get('filters[slug][$eq]')
    let products = db.product.getAll()
    if (categorySlug) products = products.filter((p) => p.category?.slug === categorySlug)
    if (productSlug) products = products.filter((p) => p.slug === productSlug)
    return HttpResponse.json({
      data: products,
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 1,
          total: products.length,
        },
      },
    })
  }),

  http.get(`${STRAPI}/api/products/:slug`, ({ params }) => {
    const p = db.product.findFirst({
      where: { slug: { equals: String(params.slug) } },
    })
    if (!p) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ data: p })
  }),

  http.get(`${STRAPI}/api/categories`, () => {
    return HttpResponse.json({
      data: db.category.getAll(),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 1,
          total: db.category.count(),
        },
      },
    })
  }),

  http.get(`${STRAPI}/api/categories/:slug`, ({ params }) => {
    const c = db.category.findFirst({
      where: { slug: { equals: String(params.slug) } },
    })
    if (!c) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ data: c })
  }),
]
