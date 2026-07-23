import { Truck, ShieldCheck, RotateCcw } from 'lucide-react'

const ITEMS = [
  {
    icon: Truck,
    title: 'Free shipping over ₹499',
    body: 'Most metro cities get next-day delivery. Pan-India in 2–4 days.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Razorpay checkout',
    body: 'PCI-DSS compliant payment flow with tokenized card storage.',
  },
  {
    icon: RotateCcw,
    title: '30-day easy returns',
    body: 'Hassle-free returns with a printed label included on every order.',
  },
]

export function ValueProps() {
  return (
    <section
      data-testid="home-value-props"
      className="mx-auto max-w-7xl px-4 py-12 sm:py-14"
    >
      <ul className="grid gap-6 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
