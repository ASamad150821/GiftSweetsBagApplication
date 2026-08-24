import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.email('Please enter a valid email address'),
  address: z.string().trim().min(5, 'Please enter your address'),
  city: z.string().trim().min(2, 'Please enter your city'),
  postcode: z.string().trim().min(4, 'Please enter your postcode')
});

export type CustomerFormValues = z.infer<typeof customerSchema>
