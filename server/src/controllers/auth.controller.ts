import type { Request, Response } from 'express'
import { UnauthorizedError, ValidationError } from '../lib/errors'
import { flattenZodError } from '../lib/flattenZodError'
import { getUserById, loginUser, registerUser } from '../services/auth.service'
import { loginSchema, registerSchema } from '../validation/auth.schema'

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Invalid registration details', flattenZodError(parsed.error))
  }

  const result = await registerUser(parsed.data)
  res.status(201).json(result)
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new ValidationError('Invalid login details', flattenZodError(parsed.error))
  }

  const result = await loginUser(parsed.data)
  res.status(200).json(result)
}

export async function me(req: Request, res: Response) {
  if (!req.userId) throw new UnauthorizedError()
  const user = await getUserById(req.userId)
  res.status(200).json({ ...user }) 
}

