import { http, HttpResponse } from 'msw'
import { db, orderPaidFixture, orderPendingFixture, type OrderSeedData } from './factories'

const STRAPI = 'http://localhost:1337'

function shapeOrder(seed: OrderSeedData) {
  const isPending = seed.status === 'pending'
  return {
    id: db.order.count() + 1,
    documentId: seed.documentId,
    clerkUserId: seed.clerkUserId,
    total: seed.total,
    status: seed.status,
    paymentId: isPending ? null : seed.paymentId,
    razorpayOrderId: seed.razorpayOrderId,
    email: seed.email,
    items: seed.items,
    address: seed.address,
    createdAt: '2026-07-22T18:18:05.000Z',
    updatedAt: '2026-07-22T18:18:05.000Z',
  }
}

function shapeOrderList() {
  const all = db.order.getAll().map((o: any) => ({
    id: o.id,
    documentId: o.documentId,
    clerkUserId: o.clerkUserId,
    total: o.total,
    status: o.status,
    paymentId: o.status === 'pending' ? null : o.paymentId,
    razorpayOrderId: o.razorpayOrderId,
    email: o.email,
    items: o.items,
    address: o.address,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }))
  return {
    data: all,
    meta: {
      pagination: { page: 1, pageSize: 25, pageCount: 1, total: all.length },
    },
  }
}

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
    if (categorySlug) products = products.filter((p: any) => p.category?.slug === categorySlug)
    if (productSlug) products = products.filter((p: any) => p.slug === productSlug)
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

  // Phase 2: Order handlers.
  http.get(`${STRAPI}/api/orders`, ({ request }) => {
    const url = new URL(request.url)
    const clerk = url.searchParams.get('filters[clerkUserId][$eq]')
    const all = clerk
      ? db.order.getAll().filter((o: any) => o.clerkUserId === clerk)
      : db.order.getAll()
    const data = all.map((o: any) => ({
      id: o.id,
      documentId: o.documentId,
      clerkUserId: o.clerkUserId,
      total: o.total,
      status: o.status,
      paymentId: o.status === 'pending' ? null : o.paymentId,
      razorpayOrderId: o.razorpayOrderId,
      email: o.email,
      items: o.items,
      address: o.address,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }))
    return HttpResponse.json({
      data,
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: data.length } },
    })
  }),

  http.get(`${STRAPI}/api/orders/:documentId`, ({ params }) => {
    const order = db.order.findFirst({
      where: { documentId: { equals: String(params.documentId) } },
    } as any)
    if (!order) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({
      data: {
        id: (order as any).id,
        documentId: (order as any).documentId,
        clerkUserId: (order as any).clerkUserId,
        total: (order as any).total,
        status: (order as any).status,
        paymentId: (order as any).status === 'pending' ? null : (order as any).paymentId,
        razorpayOrderId: (order as any).razorpayOrderId,
        email: (order as any).email,
        items: (order as any).items,
        address: (order as any).address,
        createdAt: (order as any).createdAt,
        updatedAt: (order as any).updatedAt,
      },
    })
  }),

  http.post(`${STRAPI}/api/orders`, async ({ request }) => {
    const body = (await request.json()) as { data?: Record<string, unknown> }
    const created = db.order.create({
      ...((body.data ?? {}) as any),
      id: db.order.count() + 1,
      createdAt: '2026-07-22T18:18:05.000Z',
      updatedAt: '2026-07-22T18:18:05.000Z',
    } as any)
    return HttpResponse.json({ data: created }, { status: 200 })
  }),

  http.put(`${STRAPI}/api/orders/:documentId`, async ({ params, request }) => {
    const body = (await request.json()) as { data?: Record<string, unknown> }
    const order = db.order.findFirst({
      where: { documentId: { equals: String(params.documentId) } },
    } as any)
    if (!order) return new HttpResponse(null, { status: 404 })
    const updated = db.order.update({
      where: { documentId: { equals: String(params.documentId) } },
      data: { ...((body.data ?? {}) as any), updatedAt: '2026-07-22T18:18:05.000Z' },
    } as any)
    return HttpResponse.json({ data: updated ?? order })
  }),
] 
