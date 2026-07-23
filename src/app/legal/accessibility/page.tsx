import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Accessibility | AuraStore',
  description: 'AuraStore accessibility commitment and conformance.',
}

const EFFECTIVE = '2026-07-01'

const SECTIONS = [
  {
    heading: 'Our commitment',
    body: 'AuraStore aims to meet WCAG 2.1 AA. We are not perfect; we fix issues we find and we welcome reports of new ones.',
  },
  {
    heading: 'What we have done so far',
    body: 'Semantic HTML, keyboard navigation across the cart and checkout, ARIA labels on icon-only buttons, focus rings on all interactive elements, 4.5:1 text contrast, alt text on product images, and reduced-motion support.',
  },
  {
    heading: 'Known gaps',
    body: 'Color contrast on the featured-products sale badge is currently borderline. Third-party media embeds (none today, but if added) may not be fully accessible. We test the primary flows and are extending to secondary flows.',
  },
  {
    heading: 'Reporting issues',
    body: 'If you find an accessibility issue, email accessibility@aurastore.dev. Include the page URL, the assistive technology you are using, and what you expected to happen. We aim to respond within 2 business days.',
  },
]

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility"
      description="Our accessibility goals, what we have done, and what is next."
      effectiveDate={EFFECTIVE}
      sections={SECTIONS}
    />
  )
}
