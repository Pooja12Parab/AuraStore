import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Cookie policy | AuraStore',
  description: 'How AuraStore uses cookies.',
}

const EFFECTIVE = '2026-07-01'

const SECTIONS = [
  {
    heading: 'Strictly necessary cookies',
    body: 'AuraStore sets a single cookie to keep your cart contents in sync with the server. The cookie is required for the cart to work. It expires after 7 days.',
  },
  {
    heading: 'Authentication cookies',
    body: 'Clerk (our authentication provider) sets its own cookies to keep you signed in. These are required for the sign-in flow to work.',
  },
  {
    heading: 'What we do not use',
    body: 'No advertising cookies, no third-party analytics tracking pixels, no Facebook / Google / TikTok trackers. We use only what is necessary to operate the store.',
  },
  {
    heading: 'Control',
    body: 'You can clear cookies in your browser at any time. Doing so will sign you out and empty your cart.',
  },
]

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      description="Short, honest, and accurate: cookies we use, cookies we don't."
      effectiveDate={EFFECTIVE}
      sections={SECTIONS}
    />
  )
}
