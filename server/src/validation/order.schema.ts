import { z } from 'zod'

// Mirrors the shape of the frontend's customerSchema (src/lib/validation.ts) so the same
// order is rejected on both sides — duplicated deliberately since the two apps deploy
// independently; a monorepo with a shared package would let this schema live in one place.
export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email address'),
  address: z.string().trim().min(4, 'Please enter your delivery address'),
  city: z.string().trim().min(2, 'Please enter your city or town'),
  postcode: z.string().trim().min(4, 'Please enter a valid postcode'),
})

export const createOrderSchema = z.object({
  quantity: z.number().int().min(1).max(10),
  personalMessage: z.string().trim().max(120).default(''),
  customer: customerSchema,
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
