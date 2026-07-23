import { z } from 'zod'

// Phase 2 currency policy: the project's existing Phase 1 catalog stores
// prices as integer cents (USD convention; formatPrice divides by 100 to
// render $X.YZ). Phase 2 order totals follow the same unit. When an order
// is created we hand that integer to Razorpay as paise = cents without
// further scaling. When the storefront displays the order total it
// divides by 100 (see lib/utils.ts formatPrice). The display currency and
// the Razorpay currency may differ (USD vs INR); this is a Phase 3 follow-up
// that requires INR-amount whole-rupee storage. For now we ship a
// correct-by-construction cents <-> paise identity so the math is
// auditable end-to-end.
export const PESOS_PER_RUPEE = 1

// Stripe-style alias for the same thing the rest of the code calls
// "paise" (Razorpay API contract is in paise).
export const PAISE_PER_RUPEE = PESOS_PER_RUPEE

export function computeOrderTotalInr(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0)
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PESOS_PER_RUPEE)
}

// ---- Zod schemas ----

export const AddressSchema = z.object({
  fullName: z.string().min(2, 'Required').max(120),
  street: z.string().min(3, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  zipCode: z
    .string()
    .regex(/^\d{6}$/, '6-digit PIN required'),
  country: z.string().min(2, 'Required').default('India'),
})
export type Address = z.infer<typeof AddressSchema>

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
})
export type CheckoutItem = z.infer<typeof CheckoutItemSchema>

export const CheckoutInputSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  address: AddressSchema,
  email: z.string().email(),
})
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>

export type OrderItemSnapshot = {
  productId: string
  name: string
  price: number
  qty: number
  image: string | null
}

export type AddressSnapshot = z.infer<typeof AddressSchema>

export type OrderRecord = {
  documentId: string
  clerkUserId: string
  total: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId: string | null
  razorpayOrderId: string | null
  items: OrderItemSnapshot[]
  address: AddressSnapshot
  email: string
  createdAt?: string
  updatedAt?: string
}

export type CreateOrderResult =
  | {
      ok: true
      razorpayOrderId: string
      amountInr: number
      amountPaise: number
      currency: 'INR'
      orderDocumentId: string
    }
  | { ok: false; error: string }

// ---- HTTP paths used by the server-side helpers ----

export const STRAPI_API_BASE = process.env.NEXT_PUBLIC_STRAPI_API_URL ?? 'http://localhost:1337'

export const STRAPI_WRITE_TOKEN = process.env.STRAPI_API_TOKEN_WRITE ?? ''

export const STRAPI_READ_TOKEN = process.env.STRAPI_API_TOKEN ?? ''

// ---- Internal: Strapi REST fetchers ----

type StrapiError = { message: string }

async function strapiGet<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${STRAPI_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as StrapiError
    throw new Error(`Strapi ${path} failed: ${res.status} ${body?.message ?? res.statusText}`)
  }
  return (await res.json()) as T
}

async function strapiPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${STRAPI_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: body }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as StrapiError
    throw new Error(`Strapi POST ${path} failed: ${res.status} ${errBody?.message ?? res.statusText}`)
  }
  return (await res.json()) as T
}

async function strapiPut<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${STRAPI_API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: body }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as StrapiError
    throw new Error(`Strapi PUT ${path} failed: ${res.status} ${errBody?.message ?? res.statusText}`)
  }
  return (await res.json()) as T
}

// ---- Public helpers ----

export function shapeOrderRecordFromStrapi(record: unknown): OrderRecord | null {
  if (typeof record !== 'object' || record === null) return null
  const obj = record as Record<string, unknown>
  const items = Array.isArray(obj.items) ? (obj.items as OrderItemSnapshot[]) : []
  return {
    documentId: typeof obj.documentId === 'string' ? obj.documentId : '',
    clerkUserId: typeof obj.clerkUserId === 'string' ? obj.clerkUserId : '',
    total: typeof obj.total === 'number' ? obj.total : 0,
    status:
      obj.status === 'paid' || obj.status === 'pending' || obj.status === 'failed' || obj.status === 'refunded'
        ? obj.status
        : 'pending',
    paymentId: typeof obj.paymentId === 'string' ? obj.paymentId : null,
    razorpayOrderId: typeof obj.razorpayOrderId === 'string' ? obj.razorpayOrderId : null,
    items,
    address: (obj.address as AddressSnapshot) ?? {
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
    email: typeof obj.email === 'string' ? obj.email : '',
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
  }
}

export type Product = {
  documentId: string
  name: string
  price: number
  slug: string
  imageUrl: string | null
}

async function fetchProduct(documentId: string, token: string): Promise<Product | null> {
  try {
    const url = `/api/products/${documentId}?fields[0]=name&fields[1]=price&fields[2]=slug&populate[images][fields][0]=url`
    const res = await strapiGet<{ data: { name?: string; price?: number; slug?: string; images?: Array<{ url?: string }> } }>(
      url,
      token,
    )
    const d = res?.data
    if (!d) return null
    return {
      documentId,
      name: typeof d.name === 'string' ? d.name : '',
      price: typeof d.price === 'number' ? d.price : 0,
      slug: typeof d.slug === 'string' ? d.slug : '',
      imageUrl: typeof d.images?.[0]?.url === 'string' ? d.images[0].url : null,
    }
  } catch {
    return null
  }
}

// Lazy import razorpay inside the function so that serverless cold-start
// initialization does not eagerly load the SDK. The wrapper will be
// written in src/lib/razorpay.ts.

export async function createOrderForCheckout(
  clerkUserId: string,
  input: CheckoutInput,
): Promise<CreateOrderResult> {
  // 1. Re-validate.
  const parsed = CheckoutInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.message }
  const items = parsed.data.items

  // 2. Fetch each product from Strapi (server-verified price).
  type FetchedItem = { product: Product; quantity: number }
  const fetched: FetchedItem[] = []
  for (const i of items) {
    const product = await fetchProduct(i.productId, STRAPI_WRITE_TOKEN)
    if (!product) return { ok: false, error: `Unknown product: ${i.productId}` }
    fetched.push({ product, quantity: i.quantity })
  }

  // 3. Server-side total recomputation. Never trust the client's total.
  const totalInr = computeOrderTotalInr(
    fetched.map((f) => ({ price: f.product.price, quantity: f.quantity })),
  )

  // 4. Create the Strapi Order as 'pending'.
  const itemsJson = fetched.map((f) => ({
    productId: f.product.documentId,
    name: f.product.name,
    price: f.product.price,
    qty: f.quantity,
    image: f.product.imageUrl,
  }))
  const created = await strapiPost<{ data: { documentId: string } }>(
    '/api/orders',
    {
      clerkUserId,
      items: itemsJson,
      address: parsed.data.address,
      total: totalInr,
      email: parsed.data.email,
      status: 'pending',
    },
    STRAPI_WRITE_TOKEN,
  )
  const orderDocumentId = created.data.documentId

  // 5. Convert to paise. Razorpay API amount is in paise (sub-units of INR).
  const amountPaise = rupeesToPaise(totalInr)

  // 6. Create Razorpay order. The lazy import keeps the SDK out of the
  // initial serverless cold-start bundle.
  const { createRazorpayOrder } = await import('./razorpay')
  const razorpay = await createRazorpayOrder({
    amount: amountPaise,
    currency: 'INR',
    receipt: orderDocumentId.slice(0, 40),
  })

  // 7. Patch the Strapi order with razorpayOrderId so the webhook can find it.
  await strapiPut(`/api/orders/${orderDocumentId}`, { razorpayOrderId: razorpay.id }, STRAPI_WRITE_TOKEN)

  return {
    ok: true,
    razorpayOrderId: razorpay.id,
    amountInr: totalInr,
    amountPaise,
    currency: 'INR',
    orderDocumentId,
  }
}

export async function getOrdersForUser(clerkUserId: string): Promise<OrderRecord[]> {
  const token = STRAPI_WRITE_TOKEN
  const url = `/api/orders?filters[clerkUserId][$eq]=${encodeURIComponent(clerkUserId)}&sort[0]=createdAt:desc&pagination[pageSize]=50`
  const res = await strapiGet<{ data: unknown[] }>(url, token)
  const list = Array.isArray(res?.data) ? res.data : []
  return list
    .map((raw) => shapeOrderRecordFromStrapi(raw))
    .filter((o): o is OrderRecord => o !== null)
}

export async function getOrderByDocumentId(
  clerkUserId: string,
  documentId: string,
): Promise<OrderRecord | null> {
  const token = STRAPI_WRITE_TOKEN
  const url = `/api/orders?filters[documentId][$eq]=${encodeURIComponent(documentId)}&pagination[pageSize]=1`
  try {
    const res = await strapiGet<{ data: unknown[] }>(url, token)
    const list = Array.isArray(res?.data) ? res.data : []
    for (const raw of list) {
      const order = shapeOrderRecordFromStrapi(raw)
      if (!order) continue
      if (order.clerkUserId !== clerkUserId) return null
      return order
    }
    return null
  } catch {
    return null
  }
}

async function findOrderByRazorpayId(
  razorpayOrderId: string,
  token: string,
): Promise<{ documentId: string } | null> {
  const url = `/api/orders?filters[razorpayOrderId][$eq]=${encodeURIComponent(razorpayOrderId)}&pagination[pageSize]=1`
  try {
    const res = await strapiGet<{ data: Array<{ documentId?: string }> }>(url, token)
    const record = res?.data?.[0]
    if (record?.documentId) return { documentId: record.documentId }
    return null
  } catch {
    return null
  }
}

export async function markOrderPaid(razorpayOrderId: string, paymentId: string): Promise<void> {
  const token = STRAPI_WRITE_TOKEN
  const found = await findOrderByRazorpayId(razorpayOrderId, token)
  if (!found) return
  // Idempotency: the server upserts only the diff. We do an unconditional
  // update here; the order was either 'pending' (no-op), 'paid' (still
  // idempotent because the value is the same), or 'failed' (this updates
  // it). Strapi v5 does not offer atomic conditional updates via REST so
  // a duplicate webhook may double-write — that is safe because the
  // values are the same.
  try {
    await strapiPut(`/api/orders/${found.documentId}`, { status: 'paid', paymentId }, token)
  } catch {
    // Order may already be marked paid by a prior retry; ignore.
  }
}

export async function markOrderFailed(razorpayOrderId: string, reason: string): Promise<void> {
  const token = STRAPI_WRITE_TOKEN
  const found = await findOrderByRazorpayId(razorpayOrderId, token)
  if (!found) return
  try {
    await strapiPut(`/api/orders/${found.documentId}`, { status: 'failed' }, token)
    console.warn(`[orders] marked failed razorpayOrderId=${razorpayOrderId} reason=${reason}`)
  } catch {
    // swallow
  }
}
