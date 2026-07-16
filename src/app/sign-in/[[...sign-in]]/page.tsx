import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Sign in | AuraStore',
}

export default function SignInPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md items-center justify-center px-4 py-12">
      <SignIn />
    </section>
  )
}
