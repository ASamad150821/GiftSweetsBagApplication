import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma'
import { ConflictError, UnauthorizedError } from '../lib/errors'
import { signAuthToken } from '../lib/jwt'
import type { LoginInput, RegisterInput } from '../validation/auth.schema'

const SALT_ROUNDS = 10

function toPublicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email }
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new ConflictError('An account with that email already exists')
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  })

  return { user: toPublicUser(user), token: signAuthToken({ userId: user.id }) }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new UnauthorizedError('Incorrect email or password')
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordMatches) {
    throw new UnauthorizedError('Incorrect email or password')
  }

  return { user: toPublicUser(user), token: signAuthToken({ userId: user.id }) }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new UnauthorizedError('User no longer exists')
  }
  return toPublicUser(user)
}
