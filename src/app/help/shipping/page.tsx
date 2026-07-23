import type { Metadata } from 'next'
import Link from 'next/link'
import { Truck, RotateCcw, Package, MapPin, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Shipping & returns | AuraStore',
  description: 'AuraStore shipping and returns policy.',
}

const SECTIONS = [
  {
    icon: Truck,
    title: 'Shipping',
    body: 'Most metro cities get next-day delivery. Pan-India in 2-4 days. We ship via Shiprocket from our Bengaluru hub; tracking link is emailed on dispatch.',
  },
  {
    icon: Package,
    title: 'Free shipping',
    body: 'Free standard shipping on orders over ₹499. Below that, a flat ₹49 fee applies at checkout.',
  },
  {
    icon: RotateCcw,
    title: '30-day returns',
    body: 'Not happy with your order? Send it back within 30 days for a full refund. We email a prepaid return label on request — print, drop at any partner location, done.',
  },
  {
    icon: Clock,
    title: 'Refunds',
    body: 'Refunds are issued to the original payment method within 5-7 business days after the returned item is received and inspected at our hub.',
  },
  {
    icon: MapPin,
    title: 'Order tracking',
    body: 'Every shipped order has a live tracking link in your order confirmation email and at /orders.',
  },
  {
    icon: Mail,
    title: 'Damaged or wrong item',
    body: 'Email us at hello@aurastore.dev within 48 hours of delivery with a photo. We replace or refund at our cost.',
  },
]

export default function HelpShippingPage() {
  return (
    <section
      data-testid="help-shipping"
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Help
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Shipping &amp; returns
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        Everything you need to know about how AuraStore gets your order to you
        and what to do if something isn't right.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {body}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-muted-foreground">
        Still have questions?{' '}
        <Link href="/contact" className="text-brand-700 underline">
          Contact us
        </Link>
        .
      </p>
    </section>
  )
}
