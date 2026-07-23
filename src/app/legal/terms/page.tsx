import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Terms of service | AuraStore',
  description: 'Terms of using AuraStore.',
}

const EFFECTIVE = '2026-07-01'

const SECTIONS = [
  {
    heading: 'Acceptance',
    body: 'By placing an order or creating an account on AuraStore, you agree to these terms. If you do not agree, please do not use the service.',
  },
  {
    heading: 'Account',
    body: 'You are responsible for activity on your account. Keep your password safe. AuraStore is not liable for unauthorized access caused by compromised credentials.',
  },
  {
    heading: 'Orders &amp; pricing',
    body: 'All prices are in INR and include GST. We reserve the right to refuse or cancel orders (e.g. for stock errors or suspected fraud) and will refund the full amount in those cases.',
  },
  {
    heading: 'Shipping &amp; returns',
    body: 'See /help/shipping for the full shipping and returns policy.',
  },
  {
    heading: 'Intellectual property',
    body: 'All content on AuraStore (text, images, the AuraStore brand) is owned by us or our licensors. Please do not reproduce without permission.',
  },
  {
    heading: 'Disclaimers',
    body: 'AuraStore is provided "as is" without warranties of any kind. We are not liable for indirect or consequential damages arising from your use of the service.',
  },
  {
    heading: 'Governing law',
    body: 'These terms are governed by the laws of India. Disputes will be resolved in the courts of Bengaluru, Karnataka.',
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      description="The contract between AuraStore and you when you use the service."
      effectiveDate={EFFECTIVE}
      sections={SECTIONS}
    />
  )
}
