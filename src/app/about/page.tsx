import Link from 'next/link'

export const metadata = {
  title: 'About | AuraStore',
}

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About AuraStore</h1>
      <p className="mt-6 text-lg text-gray-600">
        AuraStore is a small e-commerce demo built with Next.js and Strapi.
        We focus on a clean, fast shopping experience with realistic product
        data and a working checkout flow.
      </p>

      <h2 className="mt-10 text-xl font-semibold">What we sell</h2>
      <p className="mt-3 text-gray-600">
        Curated electronics, clothing, home and living, books, and sports &
        outdoors essentials — all sourced from free, public-domain photography
        so the catalog demos look and feel real.
      </p>

      <h2 className="mt-10 text-xl font-semibold">How it's built</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
        <li><strong>Frontend:</strong> Next.js 16 with the App Router, React Server Components, and Clerk-powered auth.</li>
        <li><strong>Backend:</strong> Strapi 5 with a Postgres (Neon) database, content types for products and categories, and a media library for product imagery.</li>
        <li><strong>Imagery:</strong> Real product photos are pulled from Unsplash at seed time and stored in Strapi; the frontend uses Next.js Image Optimization for fast delivery.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Demo notes</h2>
      <p className="mt-3 text-gray-600">
        This storefront is a sandbox — no real orders are processed and no
        payment is captured. Phase 2 of the project will introduce the cart
        and checkout experience.
      </p>

      <div className="mt-12 flex gap-4">
        <Link
          href="/products"
          className="inline-block rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Browse products
        </Link>
        <Link
          href="/contact"
          className="inline-block rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:border-black hover:text-black"
        >
          Get in touch
        </Link>
      </div>
    </section>
  )
}
