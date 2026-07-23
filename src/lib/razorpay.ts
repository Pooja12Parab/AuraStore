import Razorpay from 'razorpay'

let _client: Razorpay | null = null

function getClient(): Razorpay {
  if (_client) return _client
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''
  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay env vars are not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).',
    )
  }
  _client = new Razorpay({ key_id: keyId, key_secret: keySecret })
  return _client
}

export type CreateRazorpayOrderArgs = {
  amount: number
  currency: 'INR'
  receipt: string
}

export type RazorpayOrder = {
  id: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: 'INR'
  receipt: string
  status: 'created' | 'attempted' | 'paid'
  attempts: number
  created_at: number
}

export async function createRazorpayOrder(args: CreateRazorpayOrderArgs): Promise<RazorpayOrder> {
  const client = getClient()
  const order = (await client.orders.create({
    amount: args.amount,
    currency: args.currency,
    receipt: args.receipt,
  })) as unknown as RazorpayOrder
  return order
}

// Test-only helper: bypass the SDK so component/unit tests can run.
export function __resetRazorpayClientForTests(): void {
  _client = null
}
