import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, ArrowRight, Mail, Package } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getOrderByDocumentId } from '@/lib/orders'
import { formatPrice, cn } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ClearCartOnMount } from '@/components/orders/clear-cart-on-mount'

export const metadata: Metadata = {
  title: 'Order confirmed | AuraStore',
}

type Props = {
  searchParams: Promise<{ order_id?: string; cleared?: string }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) return null
  const { order_id: orderIdParam, cleared } = await searchParams
  if (!orderIdParam) {
    redirect('/orders')
  }
  const order = await getOrderByDocumentId(userId, orderIdParam)
  return (
    <section
      className="mx-auto max-w-2xl px-4 py-12 sm:py-16"
      data-testid="confirmation-page"
    >
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success ring-8 ring-success/5">
          <CheckCircle2 className="h-9 w-9" aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
          Order confirmed
        </h1>
        {order ? (
          <p className="mt-2 text-pretty text-muted-foreground">
            Thank you, {order.address.fullName.split(' ')[0]}. We've emailed
            a receipt to {order.email}.
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Thank you. Your order is being processed.
          </p>
        )}
      </div>

      {order ? (
        <article
          className="mt-8 overflow-hidden rounded-2xl border border-border bg-background"
          data-testid="confirmation-summary"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Order
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                {order.documentId}
              </p>
            </div>
            <OrderStatusBadge status={order.status} size="md" />
          </header>
          <dl className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-foreground">{order.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Items</dt>
                <dd className="text-foreground">
                  {order.items.reduce((acc, i) => acc + i.qty, 0)}
                </dd>
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between border-t border-border/80 pt-3">
              <dt className="text-sm text-muted-foreground">Total paid</dt>
              <dd
                className="text-xl font-semibold text-foreground"
                data-testid="confirmation-total"
              >
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
          {order.status === 'pending' ? (
            <p
              className="border-t border-border/80 bg-surface px-5 py-3 text-xs text-muted-foreground"
              data-testid="confirmation-processing"
            >
              We're waiting for the payment to finalize — this page will
              update shortly. Refresh to check the status.
            </p>
          ) : null}
        </article>
      ) : (
        <p
          className="mt-6 rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="confirmation-not-found"
        >
          We could not find that order yet — it may still be processing.
        </p>
      )}

      <div
        className={cn(
          'mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center',
        )}
      >
        <Link
          href={order ? `/orders/${order.documentId}` : '/orders'}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 ring-focus"
          data-testid="confirmation-track-link"
        >
          Track this order
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ring-focus"
        >
          Continue shopping
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/orders"
          data-testid="confirmation-orders-link"
          className="text-brand-700 hover:underline"
        >
          View all your orders →
        </Link>
      </p>
      {cleared === '1' ? (
        <ClearCartOnMount shouldClear />
      ) : (
        <ClearCartOnMount shouldClear={false} />
      )}
    </section>
  )
}
