import { afterAll, afterEach, beforeAll } from 'vitest'
import { prisma } from '../src/db/prisma'

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL does not look like a test database. ' +
        'Check TEST_DATABASE_URL in server/.env.',
    )
  }
})

afterEach(async () => {
  // Order depends on User via a foreign key, so it must be cleared first.
  await prisma.order.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
