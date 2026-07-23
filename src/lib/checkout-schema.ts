import { z } from 'zod'

export const CheckoutAddressSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Required')
    .max(120),
  email: z.string().email('Invalid email'),
  street: z.string().min(3, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  zipCode: z
    .string()
    .regex(/^\d{6}$/, '6-digit PIN required'),
  country: z.string().min(2, 'Required').default('India'),
})
export type CheckoutAddress = z.infer<typeof CheckoutAddressSchema>
