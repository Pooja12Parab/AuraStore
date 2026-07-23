'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart'
import { AddressForm } from './address-form'
import { OrderSummary } from './order-summary'
import { RazorpayCheckout } from './razorpay-checkout'
import type { CheckoutAddress } from '@/lib/checkout-schema'

type CreatedOrder = {
  order_id: string
  amount: number
  amountInr: number
  orderDocumentId: string
}

export function CheckoutClient() {
  const router = useRouter()
  const { items, totalQuantity, subtotal, clear } = useCart()
  const [stage, setStage] = useState<'address' | 'payment'>('address')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedOrder | null>(null)
  const [email, setEmail] = useState('')

  async function submitAddress(address: CheckoutAddress): Promise<void> {
    setEmail(address.email)
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          address: {
            fullName: address.fullName,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
          },
          email: address.email,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
          details?: unknown
        }
        setError(body.error ?? `Failed to create order (${res.status})`)
        toast.error(body.error ?? 'Failed to create order')
        return
      }
      const order = (await res.json()) as CreatedOrder
      setCreated(order)
      setStage('payment')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      toast.error(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0 && stage === 'address' && !created) {
    return (
      <div
        className="rounded-md border border-border p-8 text-center text-muted-foreground"
        data-testid="checkout-empty"
      >
        <p>Your cart is empty.</p>
        <button
          type="button"
          onClick={() => router.push('/products')}
          className="mt-4 text-primary underline-offset-4 hover:underline"
        >
          Browse products
        </button>
      </div>
    )
  }

  if (stage === 'payment' && created) {
    return (
      <div data-testid="checkout-payment">
        <RazorpayCheckout
          orderId={created.order_id}
          amountPaise={created.amount}
          orderDocumentId={created.orderDocumentId}
          email={email}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hitting pay ₹{subtotal / 100}…
        </p>
        <button
          type="button"
          onClick={() => {
            void clear()
            router.push(`/orders`)
          }}
          className="mt-2 block text-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Cancel and view orders
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-semibold">Shipping details</h1>
        <AddressForm onSubmit={submitAddress} isSubmitting={submitting} defaultEmail={email} />
        {error ? (
          <p className="mt-4 text-sm text-destructive" data-testid="checkout-error">
            {error}
          </p>
        ) : null}
      </div>
      <div className="lg:col-span-1">
        <OrderSummary productLookup={{}} />
      </div>
    </div>
  )
}

