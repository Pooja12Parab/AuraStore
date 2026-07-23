import type { Metadata } from 'next'
import Link from 'next/link'
import { LifeBuoy, Mail, Truck, RotateCcw, CreditCard, Headphones } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQs | AuraStore',
  description: 'Frequently asked questions about AuraStore.',
}

const FAQS = [
  {
    icon: LifeBuoy,
    q: 'How do I contact support?',
    a: 'Email hello@aurastore.dev or use the Contact form. Mon-Fri 10:00-18:00 IST; we reply within one business day.',
  },
  {
    icon: CreditCard,
    q: 'Which payment methods do you accept?',
    a: 'Razorpay supports Visa, Mastercard, American Express, PayPal, RuPay, UPI, and net-banking. All transactions are PCI-DSS compliant.',
  },
  {
    icon: Truck,
    q: 'How long does delivery take?',
    a: 'Next-day in major metros, 2-4 days pan-India. Tracking link is emailed on dispatch.',
  },
  {
    icon: RotateCcw,
    q: 'What is your return policy?',
    a: '30 days, full refund, prepaid return label. See /help/shipping for full details.',
  },
  {
    icon: Headphones,
    q: 'Do you offer customer support in Hindi / regional languages?',
    a: 'Currently English only. Multilingual support is on the roadmap.',
  },
  {
    icon: Mail,
    q: 'Can I cancel or change an order after placing it?',
    a: 'Email us within 2 hours of order placement. Once the order is shipped it cannot be cancelled, but you can return it after delivery.',
  },
]

export default function HelpFaqPage() {
  return (
    <section
      data-testid="help-faq"
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Help
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Frequently asked questions
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        The most common questions we get. If you don't see your answer,
        contact us.
      </p>
      <ul className="mt-10 space-y-4">
        {FAQS.map(({ icon: Icon, q, a }) => (
          <li
            key={q}
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{q}</h2>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">{a}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-muted-foreground">
        Need more?{' '}
        <Link href="/contact" className="text-brand-700 underline">
          Send a message
        </Link>
        .
      </p>
    </section>
  )
}
