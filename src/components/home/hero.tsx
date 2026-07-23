import Link from 'next/link'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { Brand } from '@/components/layout/brand'

export function Hero() {
  return (
    <section
      data-testid="home-hero"
      className="bg-brand-gradient border-b border-border/60"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-20 md:grid-cols-12 md:gap-12 md:py-28">
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
            <span>New autumn collection is live</span>
          </div>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Modern essentials,
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              delivered fast.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Curated audio, home, and lifestyle gear from brands we'd
            buy ourselves — at prices that don't make you wince.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              data-testid="home-hero-cta-primary"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 ring-focus"
            >
              Shop new arrivals
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ring-focus"
            >
              Our story
            </Link>
          </div>
          <div className="mt-7 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center -space-x-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-brand-500 text-brand-500"
                  aria-hidden
                />
              ))}
            </div>
            <span>
              4.8 average from 12,000+ verified customers
            </span>
          </div>
        </div>

        <div className="relative md:col-span-5">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-100 via-brand-50 to-surface shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-md">
                  <Brand size="lg" />
                </div>
                <p className="mt-5 text-sm font-medium text-foreground">
                  A curated store
                </p>
                <p className="text-xs text-muted-foreground">
                  for the next decade
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              Free shipping
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-background/85 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <span className="text-muted-foreground">From</span>
              <span className="text-base font-semibold text-foreground">
                ₹199
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
