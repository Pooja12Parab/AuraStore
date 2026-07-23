import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getOrdersForUser } from '@/lib/orders'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Orders | AuraStore',
}

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
      className="mx-auto max-w-4xl space-y-6 px-4 py-8"
      data-testid="orders-page"
    >
      <h1 className="text-3xl font-bold">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">
          You have no orders yet. Browse our{' '}
          <Link href="/products" className="text-primary underline">
            products
          </Link>{' '}
          to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border bg-background">
          {orders.map((order) => (
            <li key={order.documentId} data-testid="order-row">
              <Link
                href={`/orders/${order.documentId}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{order.documentId}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : 'pending'}
                    {' · '}
                    {order.items.reduce((acc, i) => acc + i.qty, 0)} items
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium" data-testid={`order-row-status-${order.status}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
