import type { Metadata } from 'next'
import { Leaf, Package, Recycle, Sun } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sustainability | AuraStore',
  description: 'How AuraStore minimizes its environmental impact.',
}

const PILLARS = [
  {
    icon: Package,
    title: 'Recyclable mailers',
    body: 'Every order ships in a recyclable kraft mailer. No plastic air pillows, no bubble wrap — paper tape only.',
  },
  {
    icon: Recycle,
    title: 'No virgin plastic in packaging',
    body: 'Our void fill is shredded cardboard off-cuts from the warehouse floor. Even the address label is recycled-content.',
  },
  {
    icon: Sun,
    title: 'Carbon-offset shipping',
    body: 'Every shipped order is offset through a verified Indian reforestation program at no extra cost to you.',
  },
  {
    icon: Leaf,
    title: 'Curated over churn',
    body: 'We sell fewer products on purpose. A small catalog means less inventory, fewer markdowns, and less waste.',
  },
]

export default function SustainabilityPage() {
  return (
    <section
      data-testid="about-sustainability"
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        About / Sustainability
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        How we try to do less harm
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        Sustainability is not a marketing tag for us. It's a set of
        small, unglamorous choices that add up.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {PILLARS.map(({ icon: Icon, title, body }) => (
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
    </section>
  )
}
