import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { CheckoutClient } from '@/components/checkout/checkout-client'

export const runtime = 'nodejs'

export default async function CheckoutPage() {
  const { userId } = await auth()
  if (!userId) {
    // Match the proxy.ts pattern: redirect to sign-in with a return URL.
    redirect('/sign-in?redirect_url=/checkout')
  }
  return <CheckoutClient />
}
