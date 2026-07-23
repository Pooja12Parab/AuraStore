import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Privacy policy | AuraStore',
  description: 'How AuraStore handles your data.',
}

const EFFECTIVE = '2026-07-01'

const SECTIONS = [
  {
    heading: 'What we collect',
    body: 'Account email and name (from Clerk), shipping address (provided at checkout), order history, and basic usage analytics. We do not collect payment card details — all payments are processed by Razorpay.',
  },
  {
    heading: 'What we do not collect',
    body: 'We do not sell your data. We do not run third-party tracking pixels. We do not maintain a behavioural advertising profile.',
  },
  {
    heading: 'How we use it',
    body: 'To process and ship orders, to provide order tracking, to handle returns, and to send transactional emails. Marketing emails are only sent to people who opted in.',
  },
  {
    heading: 'Cookies',
    body: 'Strictly necessary cookies for the cart and authentication. No third-party tracking cookies, no advertising cookies.',
  },
  {
    heading: 'Your rights',
    body: 'You can request export or deletion of your data at any time by emailing privacy@aurastore.dev. We respond within 30 days.',
  },
  {
    heading: 'Data residency',
    body: 'Order data is stored with Strapi on a Neon-hosted PostgreSQL instance in the US-east region. Authentication is handled by Clerk.',
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="A short, honest description of the data we collect and how we use it."
      effectiveDate={EFFECTIVE}
      sections={SECTIONS}
    />
  )
}
