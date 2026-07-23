import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Circle, MapPin } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getOrderByDocumentId } from '@/lib/orders'
import { formatPrice, cn } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

export const metadata: Metadata = {
  title: 'Order details | AuraStore',
}

type Props = {
  params: Promise<{ documentId: string }>
}

const TIMELINE: { key: 'placed' | 'paid' | 'shipped' | 'delivered'; label: string; description: string }[] = [
  { key: 'placed', label: 'Placed', description: 'We received your order.' },
  { key: 'paid', label: 'Paid', description: 'Payment confirmed by Razorpay.' },
  { key: 'shipped', label: 'Shipped', description: 'On its way — tracking link coming soon.' },
  { key: 'delivered', label: 'Delivered', description: 'Out for delivery today.' },
]

function timelineStepForStatus(
  status: 'pending' | 'paid' | 'failed' | 'refunded',
): 0 | 1 | 2 | 3 {
  if (status === 'paid') return 2 // placed + paid; shipment/arrival are placeholders
  if (status === 'failed') return 0
  if (status === 'refunded') return 1
  return 0
}

export default async function OrderDetailPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) return null
  const { documentId } = await params
  const order = await getOrderByDocumentId(userId, documentId)
  if (!order) notFound()

  const stepIdx = timelineStepForStatus(order.status as 'pending' | 'paid' | 'failed' | 'refunded')

  return (
    <article
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-10"
      data-testid="order-detail"
    >
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All orders
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Order
          </p>
          <h1 className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {order.documentId}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} size="md" />
      </header>

      {/* Timeline */}
      <section
        data-testid="order-detail-timeline"
        className="rounded-2xl border border-border bg-background p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Status</h2>
        <ol className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {TIMELINE.map((step, i) => {
            const done = i <= stepIdx
            const current = i === stepIdx
            return (
              <li
                key={step.key}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border bg-background px-3 py-2.5',
                  done
                    ? 'border-brand-200 bg-brand-50/50'
                    : 'border-border bg-surface/40',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full',
                    done
                      ? 'bg-brand-600 text-primary-foreground'
                      : 'bg-border/60 text-muted-foreground',
                  )}
                >
                  {done && !current ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : done && current ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {step.description}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Order metadata */}
      <section className="rounded-2xl border border-border bg-background">
        <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
          Order details
        </h2>
        <dl className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Placed</dt>
            <dd className="mt-0.5 text-foreground">
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'pending'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="mt-0.5 text-foreground">{order.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Items</dt>
            <dd className="mt-0.5 text-foreground">
              {order.items.reduce((acc, i) => acc + i.qty, 0)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd
              className="mt-0.5 text-base font-semibold text-foreground"
              data-testid="order-detail-total"
            >
              {formatPrice(order.total)}
            </dd>
          </div>
          {order.paymentId ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Razorpay payment id</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground">
                {order.paymentId}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Items */}
      <section
        data-testid="order-detail-items"
        className="rounded-2xl border border-border bg-background"
      >
        <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
          Items in this order
        </h2>
        <ul className="divide-y divide-border/80">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-start gap-3 px-5 py-4"
            >
              <Link
                href={`/products/${item.slug}`}
                className="block size-16 shrink-0 overflow-hidden rounded-md bg-surface"
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
                  className="text-sm font-medium text-foreground hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Quantity {item.qty} · {formatPrice(item.price)} each
                </div>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {formatPrice(item.price * item.qty)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Shipping address */}
      <section
        data-testid="order-detail-address"
        className="rounded-2xl border border-border bg-background p-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-brand-700" aria-hidden /> Shipping address
        </h2>
        <address className="mt-3 not-italic text-sm leading-relaxed text-foreground/90">
          <div className="font-medium text-foreground">{order.address.fullName}</div>
          <div>{order.address.street}</div>
          <div>
            {order.address.city}, {order.address.state} {order.address.zipCode}
          </div>
          <div>{order.address.country}</div>
        </address>
      </section>
    </article>
  )
}
