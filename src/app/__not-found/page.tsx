import Link from 'next/link'

export const metadata = {
  title: 'Not found | AuraStore',
}

export default function NotFoundProxy() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you were looking for does not exist.</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-md bg-black px-4 py-2 text-white"
      >
        Browse products
      </Link>
    </section>
  )
}