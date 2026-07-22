import Link from 'next/link'

export const metadata = {
  title: 'Contact | AuraStore',
}

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
      <p className="mt-6 text-lg text-gray-600">
        Have a question about an order, a product, or the AuraStore demo
        itself? The fastest way to reach us is by email — we read every
        message and typically reply within one business day.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold">Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            General inquiries, support, and demo feedback
          </p>
          <a
            href="mailto:hello@aurastore.dev"
            className="mt-3 inline-block text-sm font-medium text-black underline-offset-4 hover:underline"
          >
            hello@aurastore.dev
          </a>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold">Mail</h2>
          <p className="mt-2 text-sm text-gray-600">
            AuraStore demo HQ
          </p>
          <p className="mt-3 text-sm text-gray-700">
            1 Demo Street<br />
            Bengaluru, KA 560001<br />
            India
          </p>
        </div>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Demo support</h2>
      <p className="mt-3 text-gray-600">
        Because AuraStore is a demo storefront, there's no live support
        team — but if you spot a bug or have a feature suggestion, please
        email us and we'll get back to you. The catalogue, prices, and
        product copy are illustrative.
      </p>

      <div className="mt-12 flex gap-4">
        <Link
          href="/products"
          className="inline-block rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Back to products
        </Link>
        <Link
          href="/about"
          className="inline-block rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:border-black hover:text-black"
        >
          About AuraStore
        </Link>
      </div>
    </section>
  )
}
