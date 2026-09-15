import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email address'),
  address: z.string().trim().min(4, 'Please enter your delivery address'),
  city: z.string().trim().min(2, 'Please enter your city or town'),
  postcode: z.string().trim().min(4, 'Please enter a valid postcode'),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
