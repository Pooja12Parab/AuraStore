import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrderByDocumentId } from '@/lib/orders'
import { formatPrice } from '@/lib/utils'
import { ClearCartOnMount } from '@/components/orders/clear-cart-on-mount'

export const metadata: Metadata = {
  title: 'Order confirmation | AuraStore',
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
      className="mx-auto max-w-2xl space-y-6 px-4 py-12 text-center"
      data-testid="confirmation-page"
    >
      <h1 className="text-3xl font-bold">Order confirmed</h1>
      {order ? (
        <>
          <p className="text-muted-foreground">
            Thank you, {order.address.fullName.split(' ')[0]}. Your order is{' '}
            <span className="rounded-full bg-muted px-2 py-1 font-medium" data-testid="confirmation-status">
              {order.status}
            </span>
            .
          </p>
          {order.status !== 'paid' ? (
            <p className="text-sm text-muted-foreground" data-testid="confirmation-processing">
              If the payment is still processing, this page will update
              shortly.
            </p>
          ) : null}
          <dl className="space-y-1 rounded-md border bg-background p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono">{order.documentId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold" data-testid="confirmation-total">
                {formatPrice(order.total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{order.email}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-muted-foreground" data-testid="confirmation-not-found">
          We could not find that order yet — it may still be processing.
        </p>
      )}
      <Link
        href="/orders"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        data-testid="confirmation-orders-link"
      >
        View your orders
      </Link>
      {cleared === '1' ? (
        <ClearCartOnMount shouldClear />
      ) : (
        <ClearCartOnMount shouldClear={false} />
      )}
    </section>
  )
}
