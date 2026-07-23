'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, Check, Truck, Lock, RotateCcw } from 'lucide-react'
import { Brand } from './brand'
import { SocialIcon } from '@/components/icons/social'
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  PayPalLogo,
  RuPayLogo,
} from '@/components/icons/payment'

const SECTIONS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'Featured', href: '/products?featured=1' },
      { label: 'New arrivals', href: '/products?sort=newest' },
      { label: 'Categories', href: '/category' },
    ],
  },
  {
    title: 'Customer service',
    links: [
      { label: 'Contact us', href: '/contact' },
      { label: 'Shipping & returns', href: '/help/shipping' },
      { label: 'Order status', href: '/orders' },
      { label: 'FAQs', href: '/help/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About AuraStore', href: '/about' },
      { label: 'Sustainability', href: '/about/sustainability' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/legal/privacy' },
      { label: 'Terms of service', href: '/legal/terms' },
      { label: 'Cookie policy', href: '/legal/cookies' },
      { label: 'Accessibility', href: '/legal/accessibility' },
    ],
  },
] as const

const TRUST = [
  { icon: Truck, label: 'Free shipping over ₹499' },
  { icon: Lock, label: 'Secure Razorpay checkout' },
  { icon: RotateCcw, label: '30-day easy returns' },
] as const

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    // Phase 2 does not collect emails server-side; this is a UI-only
    // affordance. Future Phase 3 may wire this to a real provider.
    setStatus('submitted')
    setEmail('')
  }

  return (
    <footer
      data-testid="site-footer"
      className="mt-16 border-t border-border/80 bg-surface"
    >
      {/* Trust strip */}
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-foreground/90">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-12">
        {/* Brand + newsletter */}
        <div className="md:col-span-4">
          <Brand size="md" />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground text-pretty">
            Modern essentials, delivered fast. Curated drops, transparent
            pricing, hassle-free returns.
          </p>
          <form
            onSubmit={onSubmit}
            aria-label="Newsletter signup"
            className="mt-5 max-w-sm"
          >
            <label htmlFor="footer-newsletter" className="sr-only">
              Email address
            </label>
            <div className="flex h-10 overflow-hidden rounded-md border border-border bg-background focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-ring/40">
              <span className="grid place-items-center pl-3 text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <input
                id="footer-newsletter"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status !== 'idle') setStatus('idle')
                }}
                className="h-full flex-1 bg-transparent px-2 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                data-testid="footer-newsletter-submit"
                className="grid h-full w-12 place-items-center bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="Subscribe to newsletter"
              >
                {status === 'submitted' ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            <p
              className="mt-2 min-h-5 text-xs text-muted-foreground"
              data-testid="footer-newsletter-status"
              aria-live="polite"
            >
              {status === 'submitted'
                ? 'Thanks — check your inbox to confirm.'
                : 'No spam. Unsubscribe in one click.'}
            </p>
          </form>
        </div>

        {/* Link sections */}
        <div className="grid gap-8 sm:grid-cols-2 md:col-span-6 md:grid-cols-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social + payment */}
        <div className="md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Follow us
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <SocialIcon name="x" href="https://x.com" />
            <SocialIcon name="instagram" href="https://instagram.com" />
            <SocialIcon name="facebook" href="https://facebook.com" />
            <SocialIcon name="youtube" href="https://youtube.com" />
            <SocialIcon name="github" href="https://github.com" />
          </div>
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground">
            We accept
          </h2>
          <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            <li className="rounded-md border border-border bg-background px-2 py-1">
              <VisaLogo className="h-5" title="Visa" />
            </li>
            <li className="rounded-md border border-border bg-background px-2 py-1">
              <MastercardLogo className="h-5" title="Mastercard" />
            </li>
            <li className="rounded-md border border-border bg-background px-2 py-1">
              <AmexLogo className="h-5" title="American Express" />
            </li>
            <li className="rounded-md border border-border bg-background px-2 py-1">
              <PayPalLogo className="h-5" title="PayPal" />
            </li>
            <li className="rounded-md border border-border bg-background px-2 py-1">
              <RuPayLogo className="h-5" title="RuPay" />
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} AuraStore. All rights reserved.
          </p>
          <p>
            Built for a 21st-century e-commerce experience. Prices shown in
            your local currency.
          </p>
        </div>
      </div>
    </footer>
  )
}
