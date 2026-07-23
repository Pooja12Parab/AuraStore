import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getOrderByDocumentId } from '@/lib/orders'
import { strapiMedia } from '@/lib/strapi'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Order details | AuraStore',
}

type Props = {
  params: Promise<{ documentId: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

export default async function OrderDetailPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) return null
  const { documentId } = await params
  const order = await getOrderByDocumentId(userId, documentId)
  if (!order) notFound()
  return (
    <article className="mx-auto max-w-4xl space-y-6 px-4 py-8" data-testid="order-detail">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order {order.documentId}</h1>
        <span className="rounded-full bg-muted px-3 py-1 text-sm" data-testid="order-detail-status">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <dl className="grid gap-3 rounded-md border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Placed</dt>
          <dd>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'pending'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{order.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Items</dt>
          <dd>{order.items.reduce((acc, i) => acc + i.qty, 0)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold" data-testid="order-detail-total">
            {formatPrice(order.total)}
          </dd>
        </div>
        {order.paymentId ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment ID</dt>
            <dd className="font-mono text-xs">{order.paymentId}</dd>
          </div>
        ) : null}
      </dl>
      <section className="rounded-md border bg-background p-4" data-testid="order-detail-items">
        <h2 className="mb-3 text-lg font-semibold">Items</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-start gap-3">
              <Link
                href={`/products/${item.slug}`}
                className="block size-14 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    {item.name.slice(0, 2)}
                  </span>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  Qty {item.qty} · {formatPrice(item.price)} each
                </div>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border bg-background p-4" data-testid="order-detail-address">
        <h2 className="mb-3 text-lg font-semibold">Shipping address</h2>
        <address className="not-italic text-sm text-muted-foreground">
          <div>{order.address.fullName}</div>
          <div>{order.address.street}</div>
          <div>
            {order.address.city}, {order.address.state} {order.address.zipCode}
          </div>
          <div>{order.address.country}</div>
        </address>
      </section>
      <p>
        <Link
          href="/orders"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to all orders
        </Link>
      </p>
    </article>
  )
}
