'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CheckoutAddressSchema, type CheckoutAddress } from '@/lib/checkout-schema'

type Props = {
  defaultEmail?: string
  onSubmit: (address: CheckoutAddress) => void
  isSubmitting: boolean
}

export function AddressForm({ defaultEmail = '', onSubmit, isSubmitting }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutAddress>({
    resolver: zodResolver(CheckoutAddressSchema),
    defaultValues: {
      fullName: '',
      email: defaultEmail,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
  })
  return (
    <form
      onSubmit={handleSubmit((value) => {
        setServerError(null)
        onSubmit(value)
      })}
      className="space-y-4"
      noValidate
      data-testid="address-form"
    >
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          autoComplete="name"
          {...register('fullName')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {errors.fullName ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email for receipt
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {errors.email ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="street" className="mb-1 block text-sm font-medium">
          Street address
        </label>
        <input
          id="street"
          autoComplete="street-address"
          {...register('street')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {errors.street ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.street.message}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium">
            City
          </label>
          <input
            id="city"
            autoComplete="address-level2"
            {...register('city')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.city ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.city.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="state" className="mb-1 block text-sm font-medium">
            State
          </label>
          <input
            id="state"
            autoComplete="address-level1"
            {...register('state')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.state ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.state.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="zipCode" className="mb-1 block text-sm font-medium">
            PIN code
          </label>
          <input
            id="zipCode"
            inputMode="numeric"
            autoComplete="postal-code"
            {...register('zipCode')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.zipCode ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.zipCode.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium">
            Country
          </label>
          <input
            id="country"
            autoComplete="country-name"
            {...register('country')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {errors.country ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.country.message}
            </p>
          ) : null}
        </div>
      </div>
      {serverError ? (
        <p role="alert" className="text-sm text-destructive" data-testid="address-form-server-error">
          {serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        data-testid="address-form-submit"
      >
        {isSubmitting ? 'Preparing payment…' : 'Continue to payment'}
      </Button>
    </form>
  )
}
