import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Shop curated essentials
      </h1>
      <Link
        href="/products"
        data-testid="hero-cta"
        className="mt-8 inline-block rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
      >
        Browse products
      </Link>
    </section>
  )
}
