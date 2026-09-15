import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'vitest/config'

loadEnv()

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Tests share one Postgres database that gets truncated between runs, so
    // test files can't safely run concurrently against it.
    fileParallelism: false,
    env: {
      // Point every test at the dedicated test database instead of the dev one,
      // set here (before any test file or Prisma client is imported) so the
      // override is guaranteed to win.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
})
