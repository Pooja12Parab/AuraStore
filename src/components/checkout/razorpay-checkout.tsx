'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { toast } from 'sonner'

type Props = {
  orderId: string
  amountPaise: number
  orderDocumentId: string
  email: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open(): void
      on(event: string, handler: (...args: unknown[]) => void): void
    }
  }
}

export function RazorpayCheckout({ orderId, amountPaise, orderDocumentId, email }: Props) {
  const openedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.Razorpay) return
    if (openedRef.current) return
    openedRef.current = true

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
      order_id: orderId,
      amount: amountPaise,
      currency: 'INR',
      name: 'AuraStore',
      description: `Order ${orderDocumentId}`,
      handler: (resp: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
        const params = new URLSearchParams({
          order_id: orderDocumentId,
          payment_id: resp.razorpay_payment_id ?? '',
        })
        window.location.href = `/checkout/confirmation?${params.toString()}`
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled')
        },
      },
      prefill: { email },
    })

    const handlePaymentFailed = () => {
      toast.error('Payment failed. Please retry.')
      window.location.href = `/checkout?order_id=${orderDocumentId}&status=failed`
    }
    rzp.on('payment.failed', handlePaymentFailed)

    rzp.open()
  }, [orderId, amountPaise, orderDocumentId, email])

  return (
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
    />
  )
}
