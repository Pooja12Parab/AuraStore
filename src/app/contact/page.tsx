﻿import type { Metadata } from 'next'
import { Clock, Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact | AuraStore',
  description: 'Get in touch with AuraStore. Email, phone, and our office address.',
}

const CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    body: 'For general questions, support, and feedback',
    value: 'hello@aurastore.dev',
    href: 'mailto:hello@aurastore.dev',
  },
  {
    icon: Phone,
    title: 'Phone',
    body: 'Mon\u2013Fri, 10am\u20136pm IST. We pick up fast.',
    value: '+91 80000 12345',
    href: 'tel:+918000012345',
  },
  {
    icon: MessageCircle,
    title: 'Live chat',
    body: 'In-app for signed-in customers. Avg. response: 90 seconds.',
    value: 'Open chat',
    href: '/help/chat',
  },
  {
    icon: MapPin,
    title: 'Mail',
    body: 'AuraStore demo HQ',
    value: '1 Demo Street, Bengaluru, KA 560001, India',
    href: null,
  },
]

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section
        data-testid="contact-hero"
        className="bg-brand-gradient border-b border-border/60"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
            <span>We read every message</span>
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            We’re here to help
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Have a question about an order, a product, or the AuraStore demo?
            Pick the channel that works for you — we typically reply within
            one business day.
          </p>
        </div>
      </section>

      {/* Channels + form */}
      <section
        data-testid="contact-channels"
        className="mx-auto max-w-7xl px-4 py-16 sm:py-20"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: contact channels */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Reach us directly
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              Most customers hear back within an hour during business
              hours. Our support team reads every message themselves — no
              chatbots.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {CHANNELS.map(({ icon: Icon, title, body, value, href }) => (
                <li
                  key={title}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                  {href ? (
                    <a
                      href={href}
                      className="mt-3 inline-block break-words text-sm font-medium text-brand-700 hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {value}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>
                Mon\u2013Fri 10:00\u201318:00 IST · Sat 10:00\u201314:00 IST · Sun closed
              </span>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Send a message
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              We’ll get back to you within one business day. For order
              questions, please include your order ID.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Office map placeholder */}
      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Visit
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Our Bengaluru HQ
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground text-pretty">
                We work out of a small studio in Indiranagar. Coffee is on
                us, but please drop us a line first so we can make sure
                someone is around.
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-foreground/90">
                <MapPin className="h-4 w-4 text-brand-700" aria-hidden />
                1 Demo Street, Bengaluru, KA 560001, India
              </p>
            </div>
            <div
              aria-hidden
              className="grid h-44 w-full place-items-center rounded-2xl border border-border bg-gradient-to-br from-brand-100 via-brand-50 to-surface text-xs uppercase tracking-wider text-muted-foreground sm:h-56 sm:w-96"
            >
              Map placeholder
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
