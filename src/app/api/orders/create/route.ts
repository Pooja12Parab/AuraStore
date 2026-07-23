import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  CheckoutInputSchema,
  createOrderForCheckout,
} from '@/lib/orders'

// Note: do NOT export `runtime = 'nodejs'` here — Next.js 16 with
// cacheComponents (PPR) rejects explicit runtime declarations on route
// handlers. Node APIs like `node:crypto` (used by lib/razorpay-webhook)
// are available in the default Node.js runtime that Next 16 selects.

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let rawJson: unknown
  try {
    rawJson = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CheckoutInputSchema.safeParse(rawJson)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await createOrderForCheckout(userId, parsed.data)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({
      order_id: result.razorpayOrderId,
      amount: result.amountPaise,
      amountInr: result.amountInr,
      currency: result.currency,
      orderDocumentId: result.orderDocumentId,
    })
  } catch (err) {
    console.error('[orders/create] failed', { userId, err })
    return NextResponse.json(
      { error: 'Failed to create order', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
