﻿import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Leaf, Package, ShieldCheck, Sparkles, Truck, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | AuraStore',
  description: 'Our story, mission, and what makes AuraStore different.',
}

const STATS = [
  { label: 'Founded', value: '2024' },
  { label: 'Categories', value: '5' },
  { label: 'Products', value: '16+' },
  { label: 'Avg. rating', value: '4.8' },
]

const VALUES = [
  {
    icon: Sparkles,
    title: 'Curated, not crammed',
    body: 'We pick a small number of products per category, all of which we would buy ourselves. No infinite aisles of mediocre.',
  },
  {
    icon: Truck,
    title: 'Fast, trackable shipping',
    body: 'Most metro cities get next-day delivery. Pan-India in 2–4 days. You can watch your order move in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure checkout',
    body: 'PCI-DSS compliant payment flow via Razorpay. We never store your full card details on our servers.',
  },
  {
    icon: Leaf,
    title: 'Sustainable packaging',
    body: 'Recyclable mailers, paper tape, no plastic air pillows. We offset carbon on every shipment at no cost to you.',
  },
  {
    icon: Users,
    title: 'Real human support',
    body: 'A real person replies to every message within one business day — no chatbots, no scripts.',
  },
  {
    icon: Package,
    title: '30-day easy returns',
    body: 'Didn’t love it? Send it back within 30 days for a full refund. We pay the return shipping label.',
  },
]

const TIMELINE = [
  {
    year: '2024',
    title: 'AuraStore is born',
    body: 'Founded in a 1-bedroom apartment with three employees, one warehouse, and a manifesto that said: "stop selling people things they don’t need."',
  },
  {
    year: '2025',
    title: 'First 1,000 customers',
    body: 'We hit our first 1,000 orders in May 2025, expanded into three new categories (Home, Books, Sports), and rolled out a same-day delivery pilot in Bengaluru.',
  },
  {
    year: '2026',
    title: 'Sustainability commitment',
    body: 'Switched to 100% recyclable packaging, partnered with Pachama to offset our carbon footprint, and started publishing a yearly sustainability report.',
  },
  {
    year: 'Today',
    title: 'Building for the next decade',
    body: 'Now in 12 cities. A team of 28. Still answering our own customer emails. Still pick the products ourselves.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section
        data-testid="about-hero"
        className="bg-brand-gradient border-b border-border/60"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              <span>Our story</span>
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              We sell fewer things,
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                on purpose.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              AuraStore started in 2024 with a simple question: why do most
              online stores feel like a thousand-yard aisle of stuff you don’t
              want? We chose curation over catalog, and we’ve been rewarded
              with customers who care about what they buy.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 ring-focus"
              >
                Browse the catalog
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ring-focus"
              >
                Get in touch
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <dl className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-background/80 p-5 backdrop-blur"
                >
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section
        data-testid="about-mission"
        className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          Our mission
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Make it easy to buy things you’ll keep.
        </h2>
        <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
          E-commerce has become a chore. Endless scrolling, dubious reviews,
          subscriptions you forgot about. We think buying things should be
          quick, transparent, and satisfying. So we’ve built AuraStore to be
          the store we’d want to use ourselves.
        </p>
      </section>

      {/* Values */}
      <section
        data-testid="about-values"
        className="border-y border-border bg-surface/60"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What we care about
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Six principles that shape every decision we make — from what
              we stock to how we ship it.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section
        data-testid="about-timeline"
        className="mx-auto max-w-3xl px-4 py-16 sm:py-20"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How we got here
        </h2>
        <ol className="mt-8 space-y-8 border-l border-border pl-6">
          {TIMELINE.map(({ year, title, body }) => (
            <li key={year} className="relative">
              <span
                aria-hidden
                className="absolute -left-[33px] top-1 h-3 w-3 rounded-full border-2 border-brand-600 bg-background"
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {year}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-brand-tint">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Like what you see?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Browse the catalog or reach out — we love hearing from
            customers.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 ring-focus"
            >
              Browse products
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ring-focus"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
