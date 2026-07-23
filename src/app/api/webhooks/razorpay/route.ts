import { NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay-webhook'
import { markOrderPaid, markOrderFailed } from '@/lib/orders'

// See orders/create/route.ts for why we do not declare `runtime = 'nodejs'`.

type RazorpayEvent = {
  event?: string
  payload?: {
    payment?: {
      entity?: {
        order_id?: string
        id?: string
        amount?: number
        currency?: string
        status?: string
        error_description?: string
      }
    }
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

  if (!verifyRazorpaySignature(rawBody, sig, secret)) {
    console.warn('[webhook] invalid signature')
    return new NextResponse('invalid signature', { status: 400 })
  }

  let payload: RazorpayEvent
  try {
    payload = JSON.parse(rawBody) as RazorpayEvent
  } catch {
    return new NextResponse('bad json', { status: 400 })
  }

  const event = payload.event
  const entity = payload.payload?.payment?.entity
  if (!entity || !entity.order_id) {
    return new NextResponse('ok', { status: 200 })
  }

  try {
    if (event === 'payment.captured') {
      if (entity.id) {
        await markOrderPaid(entity.order_id, entity.id)
      }
    } else if (event === 'payment.failed') {
      await markOrderFailed(
        entity.order_id,
        entity.error_description ?? 'unknown',
      )
    }
    return new NextResponse('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook] persistence failed', { err, event })
    return new NextResponse('retry', { status: 500 })
  }
}
