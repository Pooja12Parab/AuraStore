import type { Metadata } from 'next'

type Props = {
  title: string
  description?: string
  effectiveDate: string
  sections: Array<{ heading: string; body: string }>
}

export function LegalPage({ title, description, effectiveDate, sections }: Props) {
  return (
    <section
      className="mx-auto max-w-3xl px-4 py-12 sm:py-16"
      data-testid="legal-page"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        Legal
      </p>
      <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-pretty text-muted-foreground">{description}</p>
      ) : null}
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        Effective {effectiveDate}
      </p>
      <div className="prose prose-neutral mt-10 max-w-none text-foreground/90">
        {sections.map((s, i) => (
          <section key={i} className="mt-8 first:mt-0">
            <h2 className="text-xl font-semibold text-foreground">
              {s.heading}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground text-pretty">
              {s.body}
            </p>
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Questions about this document? Email{' '}
        <a
          href="mailto:legal@aurastore.dev"
          className="text-brand-700 underline"
        >
          legal@aurastore.dev
        </a>
        .
      </p>
    </section>
  )
}
