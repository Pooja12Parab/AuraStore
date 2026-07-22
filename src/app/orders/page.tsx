import { auth } from '@clerk/nextjs/server'

export const metadata = {
  title: 'My Orders | AuraStore',
}

export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Orders</h1>
      <p className="text-gray-600">
        You have no orders yet. Browse our{' '}
        <a href="/products" className="text-blue-600 underline">
          products
        </a>{' '}
        to get started.
      </p>
    </section>
  )
}