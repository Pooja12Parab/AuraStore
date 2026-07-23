import type { Metadata } from 'next'
import { Mail, FileText, Phone, Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Press | AuraStore',
  description: 'Press resources for AuraStore.',
}

const ASSETS = [
  { name: 'Brand mark (SVG)', size: '12 KB' },
  { name: 'Brand mark (PNG, light + dark)', size: '180 KB' },
  { name: 'Founders headshots', size: '3.4 MB' },
  { name: 'Product photography (4K)', size: '1.2 GB' },
]

export default function PressPage() {
  return (
    <section
      data-testid="press"
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Company / Press
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Press &amp; media
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        Reach out to the AuraStore press team for media inquiries, brand
        assets, or interview requests. We aim to respond within 24 hours.
      </p>

      <ul className="mt-10 space-y-4">
        <li className="rounded-lg border border-border bg-background p-5">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-brand-700" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Email
              </h2>
              <a
                href="mailto:press@aurastore.dev"
                className="text-sm text-brand-700 hover:underline"
              >
                press@aurastore.dev
              </a>
            </div>
          </div>
        </li>
        <li className="rounded-lg border border-border bg-background p-5">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-brand-700" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Phone
              </h2>
              <p className="text-sm text-muted-foreground">
                +91 80000 12345 (ask for the press team)
              </p>
            </div>
          </div>
        </li>
        <li className="rounded-lg border border-border bg-background p-5">
          <div className="flex items-start gap-3">
            <Newspaper className="mt-0.5 h-4 w-4 text-brand-700" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Brand assets
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {ASSETS.map((a) => (
                  <li
                    key={a.name}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-1.5"
                  >
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      {a.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Email us to receive the full asset bundle.
              </p>
            </div>
          </div>
        </li>
      </ul>
    </section>
  )
}
