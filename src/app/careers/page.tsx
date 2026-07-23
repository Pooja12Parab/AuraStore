import type { Metadata } from 'next'
import { Mail, Sparkles, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers | AuraStore',
  description: 'Join the AuraStore team.',
}

const ROLES = [
  { title: 'Senior Frontend Engineer', location: 'Remote (India)', type: 'Full-time' },
  { title: 'Product Designer', location: 'Bengaluru / Remote', type: 'Full-time' },
  { title: 'Customer Experience Lead', location: 'Bengaluru', type: 'Full-time' },
  { title: 'Warehouse Operations Associate', location: 'Bengaluru', type: 'Full-time' },
]

export default function CareersPage() {
  return (
    <section
      data-testid="careers"
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Company / Careers
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Join AuraStore
      </h1>
      <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
        We are a small, opinionated team that ships quickly. If you
        care about doing fewer things better, we should talk.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-foreground">
        Open roles
      </h2>
      <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-background">
        {ROLES.map((r) => (
          <li
            key={r.title}
            className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {r.title}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden /> {r.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden /> {r.type}
                </span>
              </div>
            </div>
            <a
              href={`mailto:hello@aurastore.dev?subject=Application: ${r.title}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Apply
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
