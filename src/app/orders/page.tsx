import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Truck, Lock, RotateCcw } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { getOrdersForUser } from '@/lib/orders'
import { formatPrice, cn } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

export const metadata: Metadata = {
  title: 'My Orders | AuraStore',
}

const TRUST = [
  { icon: Truck, label: 'Trackable shipping' },
  { icon: Lock, label: 'Secured by Razorpay' },
  { icon: RotateCcw, label: '30-day returns' },
] as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) return null
  const orders = await getOrdersForUser(userId)
  return (
    <section
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-10"
      data-testid="orders-page"
    >
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length === 0
            ? 'No orders yet — but that\u2019s about to change.'
            : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} on file`}
        </p>
      </header>

      {orders.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center"
          data-testid="orders-empty"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
            <ShoppingBag className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            Nothing here yet
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Browse the catalog and place your first order — it'll show up here with live tracking and receipts.
          </p>
          <Link
            href="/products"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 ring-focus"
          >
            Browse products
          </Link>
          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-background">
          {orders.map((order, idx) => (
            <li
              key={order.documentId}
              className={cn(
                'border-border/80 last:border-b-0',
                idx > 0 ? 'border-t' : '',
              )}
            >
              <Link
                href={`/orders/${order.documentId}`}
                className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
                data-testid="order-row"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {order.documentId}
                    </span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : 'pending'}
                    </span>
                    <span>·</span>
                    <span>
                      {order.items.reduce((acc, i) => acc + i.qty, 0)} items
                    </span>
                    <span>·</span>
                    <span>
                      {order.address.fullName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                  <span className="text-base font-semibold text-foreground">
                    {formatPrice(order.total)}
                  </span>
                  <span className="text-xs text-brand-700">View details →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
