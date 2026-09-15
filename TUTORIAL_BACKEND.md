# Building a hand-written backend for "Sweet Bags"

`TUTORIAL.md` walks through the frontend. This document walks through everything built on top of
it: a real Node.js + Express + PostgreSQL API with user accounts, written from scratch — **no
backend-as-a-service** (no Supabase, no Firebase). Follow it in order to rebuild the backend
yourself from an empty `server/` folder.

## Why write your own backend instead of using a BaaS

A BaaS (Supabase, Firebase) gives you a database, an auto-generated API, and auth out of the box.
That's great for shipping fast, but it also means you never actually build the parts interviewers
ask about: how a REST API is laid out, how passwords are hashed and sessions are issued, how a
server validates input it doesn't trust, how errors are handled consistently, how a database
schema and its relations are designed. Hand-writing those things — even a simple version of each —
is what this tutorial is for.

**Stack:** Node.js, TypeScript, Express 4, PostgreSQL, Prisma (ORM + migrations), Zod (validation,
reused from the frontend's approach), `bcryptjs` + `jsonwebtoken` (auth), Vitest + Supertest
(testing).

> **How to use this document:** for files with real logic or a non-obvious decision behind them,
> the code is shown in full below. For thin, mechanical files — a controller that's just
> "validate, call the service, return JSON," a router that wires paths to handlers — only the
> pattern is shown once, with a link to the actual file in this repo for the exact listing. Treat
> this doc and the linked source files together as the tutorial; if you're rebuilding into a fresh
> `server/` folder rather than reading this alongside the existing code, open the linked file
> before moving to the next step so you're never typing from a description alone.

---

## 1. Get a Postgres database running locally

You have two options — use whichever you have available. Both end up with the same thing: a
Postgres server on `localhost:5432` with a `giftbags` user/password/database.

**Option A — Docker (what production will mirror most closely):**

```yaml
# docker-compose.yml, at the repo root
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: giftbags
      POSTGRES_PASSWORD: giftbags
      POSTGRES_DB: giftbags
    ports:
      - '5432:5432'
    volumes:
      - giftbags-postgres-data:/var/lib/postgresql/data

volumes:
  giftbags-postgres-data:
```

```bash
docker compose up -d
```

**Option B — no Docker, native Postgres via Homebrew (macOS):**

> **Hit while building this:** the machine this was built on doesn't have Docker installed at
> all — no `docker` binary, no Docker Desktop. Rather than blocking on installing Docker Desktop
> (a GUI installer), Postgres was installed directly with Homebrew instead. Both routes end at
> the exact same place — a Postgres server on `localhost:5432` — so the rest of this tutorial
> doesn't care which one you used.

```bash
brew install postgresql@16
brew services start postgresql@16
```

Then create the role and databases by hand (Docker's `POSTGRES_USER`/`POSTGRES_DB` env vars do
this automatically; the native install doesn't):

```bash
psql -d postgres -c "CREATE ROLE giftbags LOGIN PASSWORD 'giftbags' CREATEDB;"
psql -d postgres -c "CREATE DATABASE giftbags OWNER giftbags;"
```

Either way, create a **second** database for the test suite to use later — tests truncate tables
between runs, so they must never point at your real dev data:

```bash
# Docker:
docker compose exec postgres createdb -U giftbags giftbags_test
# Homebrew:
psql -d postgres -c "CREATE DATABASE giftbags_test OWNER giftbags;"
```

## 2. Scaffold the server project

```bash
mkdir server && cd server
npm init -y
npm install express cors helmet express-rate-limit bcryptjs jsonwebtoken zod dotenv @prisma/client
npm install -D typescript tsx prisma vitest supertest \
  @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/node @types/supertest
```

`server/tsconfig.json` — a standard CommonJS Node setup (simpler than ESM for a first backend;
matches most real-world Express codebases):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

`server/package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy"
  }
}
```

`tsx` runs TypeScript directly in dev (no separate `ts-node` config, fast restarts on save);
`tsc` compiles it for production.

## 3. Environment variables, validated

Never trust `process.env` to have what you expect — validate it once, at startup, with the same
Zod library the frontend already uses for form validation:

`server/src/config/env.ts`:

```ts
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
```

`server/.env` (copy from `.env.example`, then generate a real secret):

```bash
cp .env.example .env
# then replace JWT_SECRET's placeholder with:
openssl rand -base64 32
```

```env
DATABASE_URL="postgresql://giftbags:giftbags@localhost:5432/giftbags"
TEST_DATABASE_URL="postgresql://giftbags:giftbags@localhost:5432/giftbags_test"
JWT_SECRET="<paste the generated value here>"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

Every module that needs config imports `env` from here instead of touching `process.env`
directly — one validated source of truth.

## 4. The data model — Prisma schema and first migration

```bash
npx prisma init --datasource-provider postgresql
```

`server/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  orders       Order[]
}

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  quantity        Int
  personalMessage String
  pricePerBag     Decimal  @db.Decimal(10, 2)
  totalPrice      Decimal  @db.Decimal(10, 2)
  customerName    String
  customerEmail   String
  address         String
  city            String
  postcode        String
  createdAt       DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

Two design choices worth calling out:

- **Delivery details live on the order, not the user.** Even though there's now a login, the
  checkout form still asks for name/address/city/postcode every time — realistic (people ship
  gifts to other addresses) and it avoids needing a separate "manage my address book" feature that
  nothing else in the app needs yet.
- **Price is stored, not just computed on the fly.** `pricePerBag` and `totalPrice` are snapshotted
  at order time. If `PRICE_PER_BAG` changes in the future, past orders should still show what was
  actually charged — a real e-commerce concern, not over-engineering.

Apply it:

```bash
npx prisma migrate dev --name init
```

This creates `prisma/migrations/<timestamp>_init/migration.sql` and generates a typed
`PrismaClient` into `node_modules/@prisma/client`.

One `PrismaClient` for the whole process (`server/src/db/prisma.ts`):

```ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

Prisma pools connections internally — constructing a new client per request would exhaust the
database's connection limit under any real load.

## 5. Errors and the two pieces of middleware that make them work

A small hierarchy of typed errors, each carrying the HTTP status it should produce:

`server/src/lib/errors.ts`:

```ts
export class AppError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(401, message) }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(404, message) }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(409, message) }
}
export class ValidationError extends AppError {
  details: Record<string, string>
  constructor(message: string, details: Record<string, string> = {}) {
    super(422, message)
    this.details = details
  }
}
```

Controllers just `throw new ConflictError('...')` and never touch `res` for the error case — one
place turns any thrown error into the right JSON response:

`server/src/middleware/errorHandler.ts`:

```ts
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details })
    return
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error(err) // anything unexpected — log it, don't leak it to the client
  res.status(500).json({ error: 'Something went wrong' })
}
```

Express 4 only catches **synchronous** throws automatically — a rejected promise from an `async`
route handler becomes an unhandled rejection instead of reaching `errorHandler`. Fix it once with
a wrapper instead of a `try/catch` in every controller:

`server/src/middleware/asyncHandler.ts`:

```ts
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}
```

Every route gets wired as `router.post('/register', asyncHandler(controller.register))`.

## 6. Auth: bcrypt + JWT, built up piece by piece

**Hashing.** Never store plaintext passwords — `bcryptjs` (pure JS, no native build step, so it
installs the same way on every machine) hashes with a random salt baked in:

```ts
import bcrypt from 'bcryptjs'
const passwordHash = await bcrypt.hash(input.password, 10)
// later:
const matches = await bcrypt.compare(input.password, user.passwordHash)
```

**Tokens.** On successful register/login, sign a JWT containing just the user's id:

`server/src/lib/jwt.ts`:

```ts
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function signAuthToken(payload: { userId: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}
export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string }
}
```

**Validation** for the two request bodies lives in
[server/src/validation/auth.schema.ts](server/src/validation/auth.schema.ts) — `registerSchema`
(name/email/`password.min(8)`) and `loginSchema` (email/password), same `.trim()`/`.email()`
pattern as `customerSchema` in step 7.

**The service layer** (`server/src/services/auth.service.ts`) owns the actual logic —
`registerUser`, `loginUser`, `getUserById` — so controllers stay thin (parse input, call the
service, shape the response). `registerUser` checks for an existing email first and throws
`ConflictError`; `loginUser` throws the *same* `UnauthorizedError` message ("Incorrect email or
password") whether the email doesn't exist or the password is wrong — never reveal which one it
was, or you've handed an attacker a way to enumerate registered emails.

**The middleware** that protects routes (`server/src/middleware/auth.ts`):

```ts
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new UnauthorizedError('Missing or invalid Authorization header')

  try {
    req.userId = verifyAuthToken(token).userId
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
```

**The controller** ([server/src/controllers/auth.controller.ts](server/src/controllers/auth.controller.ts))
is deliberately thin — `safeParse` the body, throw `ValidationError` on failure (using the shared
[flattenZodError](server/src/lib/flattenZodError.ts) helper to turn Zod's issue list into
`{ field: message }`), otherwise call the service and set the response. `register`/`login` return
`{ user, token }`; `me` reads `req.userId` (set by `requireAuth` below) and returns the current
user.

**Routes** ([server/src/routes/auth.routes.ts](server/src/routes/auth.routes.ts)), with rate
limiting on the two endpoints most worth protecting from brute force:

```ts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 })
authRouter.post('/register', authLimiter, asyncHandler(authController.register))
authRouter.post('/login', authLimiter, asyncHandler(authController.login))
authRouter.get('/me', requireAuth, asyncHandler(authController.me))
```

> **Design tradeoff worth knowing for an interview:** the token is returned in the JSON body and
> the frontend keeps it in `localStorage` (via a persisted Zustand store, below). That's simple
> and fine for a project like this, but it means a successful XSS attack on the frontend can read
> the token. The more defensive alternative is an httpOnly cookie, which JavaScript can't read at
> all — but it requires CSRF protection in exchange, and more moving parts (`credentials:
> 'include'`, `SameSite` config, cookie-parsing middleware) than this project needs. Knowing this
> tradeoff — and being able to explain it — matters more than which one you pick for a demo app.

## 7. Validation with Zod, reused from the frontend's pattern

`server/src/validation/order.schema.ts` intentionally mirrors the shape of the frontend's
`customerSchema` in [src/lib/validation.ts](src/lib/validation.ts):

```ts
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
```

This is **deliberately duplicated**, not imported — the frontend and backend are two independent
apps that deploy separately, so there's no shared module to import it from without adding monorepo
tooling (npm workspaces, a shared package) that this project doesn't otherwise need. If the app
grew a lot more shared validation, that would be the point to introduce one.

Every controller follows the same shape: `schema.safeParse(req.body)`, and on failure throw
`ValidationError` with the field-level messages flattened out — never trust `req.body` past this
line.

## 8. The orders API — the part that actually matters for this app

The rule that makes this a *real* backend rather than a thin proxy: **the price is never trusted
from the client.**

`server/src/services/orders.service.ts`:

```ts
export const PRICE_PER_BAG = 6.5

export async function createOrder(userId: string, input: CreateOrderInput) {
  const totalPrice = Number((input.quantity * PRICE_PER_BAG).toFixed(2))
  // orderNumber generated here, not accepted from the client — see below
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      quantity: input.quantity,
      pricePerBag: PRICE_PER_BAG,
      totalPrice,
      customerName: input.customer.name,
      /* ...customerEmail, address, city, postcode... */
      userId,
    },
  })
  return formatOrder(order)
}
```

Even if a malicious client posts `{ ..., "totalPrice": 0.01 }`, that field is never read — the
test suite (below) asserts this directly.

**Order numbers are random** (`SB-XXXXX`), which means a collision — while very unlikely — is
possible. Rather than trust randomness alone, the create call retries on Postgres's unique-
constraint violation:

```ts
for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
  try {
    return await prisma.order.create({ data: { orderNumber: generateOrderNumber(), /* ... */ } })
  } catch (error) {
    const isCollision =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[])?.includes('orderNumber')
    if (!isCollision) throw error
  }
}
```

> **Bug hit while building this:** Prisma's `Decimal` fields (used for `pricePerBag`/`totalPrice`
> so money is never stored as an imprecise floating-point column) come back from the database as
> `Prisma.Decimal` objects, not plain numbers. Returning one straight from `res.json()` would have
> sent `"19.50"` as a *string* to the frontend, which then silently breaks `.toFixed()` calls
> expecting a number. The fix is the `formatOrder()` helper in the service, which explicitly calls
> `.toNumber()` on both fields before the response is built — worth remembering any time an ORM's
> decimal type meets a JSON API.

`GET /api/orders` and `GET /api/orders/:id` both filter by `userId` from the verified token —
`getOrderForUser` does `prisma.order.findFirst({ where: { id, userId } })` and throws
`NotFoundError` if it doesn't match, so one user can never see (or even detect the existence of)
another user's order, even by guessing an id.

The controller ([server/src/controllers/orders.controller.ts](server/src/controllers/orders.controller.ts))
and routes ([server/src/routes/orders.routes.ts](server/src/routes/orders.routes.ts)) follow the
exact same thin-controller/`asyncHandler` pattern as auth above — the only difference is
`ordersRouter.use(requireAuth)` once at the top, instead of picking per-route, since every orders
endpoint needs a logged-in user.

## 9. Wiring it into an Express app

`server/src/app.ts`:

```ts
export function createApp() {
  const app = express()
  app.use(helmet())                          // sets a batch of security-related HTTP headers
  app.use(cors({ origin: env.CORS_ORIGIN }))  // only the frontend's origin may call this API
  app.use(express.json())

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
```

`apiRouter` ([server/src/routes/index.ts](server/src/routes/index.ts)) is two lines —
`apiRouter.use('/auth', authRouter)` and `apiRouter.use('/orders', ordersRouter)` — mounting each
feature's router under its path.

`createApp()` is a factory rather than a module-level `app` — that's what lets the test suite spin
up a fresh app per test file without also starting a real HTTP listener.
[server/src/index.ts](server/src/index.ts) is the only place that actually calls `app.listen()`:

```ts
import { createApp } from './app'
import { env } from './config/env'

const app = createApp()
app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`))
```

## 10. Testing with Vitest + Supertest, against a real database

Integration tests here hit a real Postgres test database rather than mocking Prisma — the whole
point is testing that validation, auth, and ownership checks work through the real stack.

`server/vitest.config.ts`:

```ts
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'vitest/config'

loadEnv()

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false, // tests share one DB that gets truncated between runs
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? '' },
  },
})
```

> **Bug hit while building this:** the first attempt set `process.env.DATABASE_URL =
> process.env.TEST_DATABASE_URL` inside `tests/setup.ts` itself. That's too late — `db/prisma.ts`
> constructs its `PrismaClient` the moment it's *imported*, and there's no guarantee a setup file
> finishes running before a test file's own top-level imports pull in the Prisma client with the
> wrong `DATABASE_URL` already baked in. Vitest's `test.env` config option (above) applies the
> override to the whole worker process *before* any file — setup or test — runs, which removes the
> race entirely. If you see a test suite quietly hitting your real dev database, this is the class
> of bug to look for.

`server/tests/setup.ts` truncates the two tables between every test, and refuses to run at all if
`DATABASE_URL` doesn't look like a test database — a deliberate safety check against ever wiping
real data by accident:

```ts
beforeAll(() => {
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Refusing to run tests: DATABASE_URL does not look like a test database.')
  }
})

afterEach(async () => {
  await prisma.order.deleteMany() // Order first — it has a foreign key onto User
  await prisma.user.deleteMany()
})
```

A representative test, `server/tests/orders.test.ts` — this is the one that actually proves the
price-trust rule from step 8:

```ts
it('ignores a client-supplied price and recomputes it server-side', async () => {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validOrder, totalPrice: 0.01 })

  expect(res.status).toBe(201)
  expect(res.body.order.totalPrice).toBe(13) // 2 x £6.50, not the £0.01 sent
})
```

13 tests in total cover: register (success, duplicate email, invalid input), login (success, wrong
password), `/auth/me` (missing token, valid token), and orders (unauthenticated rejected, invalid
input rejected, price recomputed, listing scoped to the caller, `GET /:id` 404s for another user's
order). Full listings: [server/tests/auth.test.ts](server/tests/auth.test.ts) and
[server/tests/orders.test.ts](server/tests/orders.test.ts).

Apply your migrations to the test database once (the dev database already got them from `migrate
dev` in step 4 — this is the same migrations, applied to the second database instead):

```bash
DATABASE_URL="postgresql://giftbags:giftbags@localhost:5432/giftbags_test" npx prisma migrate deploy
```

Then run the suite:

```bash
npm run test
```

## 11. Wiring the frontend to the real API

**A typed fetch wrapper**, in the same plain-`fetch` style as the frontend's existing
[postcode.ts](src/lib/postcode.ts):

`src/lib/api.ts`:

```ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, data?.error ?? 'Something went wrong', data?.details)
  return data as T
}
```

**An auth store**, using Zustand's `persist` middleware (the project already depends on Zustand
for `orderStore`, so this is the same tool, not a new one) to survive page refreshes via
`localStorage`:

`src/store/authStore.ts`:

```ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (input) => {
        const result = await apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
          method: 'POST',
          body: input,
        })
        set({ user: result.user, token: result.token })
      },
      // register: same shape, hits /auth/register
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'giftbags-auth' },
  ),
)
```

**A route guard** so `/checkout` and `/orders` require a token, and remembers where the user was
headed so login can bounce them back:

`src/components/ProtectedRoute.tsx`:

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
```

`LoginPage` reads `location.state.from` and navigates there after a successful login, instead of
always going to `/order` — so someone who got bounced from `/checkout` lands back on `/checkout`.

**`orderStore.ts`** ([src/store/orderStore.ts](src/store/orderStore.ts)) changed shape: it used to
fake an order number client-side with `generateOrderNumber()`. That function is gone —
`placeOrder()` is replaced by `setLastOrder()`, which stores whatever the server actually returned
(including the *real*, server-issued `orderNumber`) as a new `PlacedOrder` type.

**`CheckoutPage.tsx`** ([full listing](src/pages/CheckoutPage.tsx)) now calls
`apiRequest('/orders', { method: 'POST', token, body })` on submit instead of a synchronous local
update, with `submitting`/`submitError` state around it since this is now a real network call that
can fail — the submit button shows "Placing order…" and disables itself while the request is in
flight, and any `ApiError` message is rendered above it.

**`ConfirmationPage.tsx`** ([full listing](src/pages/ConfirmationPage.tsx)) reads
`lastOrder` from the store instead of the old `orderNumber`/`quantity`/`customer` triplet — same
redirect-home-if-missing guard as before, just against the new shape.

**Two new pages** round out the auth flow:
[LoginPage.tsx](src/pages/LoginPage.tsx)/[RegisterPage.tsx](src/pages/RegisterPage.tsx) (plain
controlled forms, same styling conventions as `CheckoutPage`'s fields — `LoginPage` also reads
`location.state.from` to bounce back to whatever page redirected it here) and
[OrdersHistoryPage.tsx](src/pages/OrdersHistoryPage.tsx) — a `GET /api/orders` on mount, rendered
as a list. This last one is the natural place to *show* that the backend persists data: place an
order, log out, log back in, and it's still there.

[Header.tsx](src/components/Header.tsx) becomes auth-aware — "My Orders" and "Log out" when signed
in, "Log in" otherwise — and [App.tsx](src/App.tsx) adds routes for `/login`, `/register`, and
`/orders`, and wraps `/checkout` and `/orders` in `<ProtectedRoute>`.

## 12. Running it all locally

```bash
# once:
cp server/.env.example server/.env   # then paste in a real JWT_SECRET
cp .env.example .env                 # frontend — VITE_API_URL, defaults are fine locally

# terminal 1 — database (skip if already running as a service)
docker compose up -d                 # or: brew services start postgresql@16

# terminal 2 — API
cd server
npm install
npx prisma migrate dev --name init
npm run dev                          # http://localhost:4000

# terminal 3 — frontend
npm install
npm run dev                          # http://localhost:5173
```

Click through the whole golden path: **Register** → land on **Order** (header now shows "My
Orders"/"Log out") → set a quantity and a message → **Buy now** → **Checkout**, type a real UK
postcode and confirm the town autofills → **Place order** → **Confirmation** shows a real,
server-issued order reference → **My Orders** shows it → **Log out** → try to visit `/checkout`
directly and confirm it redirects to `/login` → log back in and confirm the order is still there.

## 13. Deploying it (so you have a live link to put on a CV)

**Database — Neon** (free, serverless Postgres; used here purely as a database, not as a BaaS —
nothing but Prisma talks to it):

1. Create a free project at Neon and copy the connection string it gives you.
2. Locally, temporarily point `DATABASE_URL` at that string and run `npx prisma migrate deploy` —
   this applies your existing migrations (created in step 4) to the production database.

**API — Render** (free Node web service):

1. Push this repo to GitHub.
2. New → Web Service → connect the repo, set the **root directory** to `server`.
3. Build command: `npm install && npx prisma generate && npm run build`. Start command:
   `npm run start`.
4. Environment variables: `DATABASE_URL` (the Neon string), `JWT_SECRET` (a *different* one than
   local dev — generate a fresh one), `CORS_ORIGIN` (your deployed frontend's URL — set this after
   step below), `PORT` (Render sets this for you automatically; the app already reads it from
   `env.PORT`).

**Frontend — Vercel or Netlify:**

1. Import the same repo, root directory `/` (the default).
2. Build command `npm run build`, output directory `dist` (Vercel/Netlify both detect this for
   Vite automatically).
3. Environment variable `VITE_API_URL` = your Render URL + `/api`, e.g.
   `https://sweet-bags-api.onrender.com/api`.
4. Once deployed, go back to Render and set `CORS_ORIGIN` to this frontend's real URL, then
   redeploy the API — until that's set, the browser will block every request with a CORS error.

Confirm the same golden path from step 12 works end-to-end on the live URLs.

## What to try extending next

- Add an **admin** role and an endpoint to update an order's status (placed → shipped →
  delivered) — introduces role-based authorization on top of the auth already built here.
- Add **refresh tokens** so the JWT can have a short expiry without forcing frequent re-logins —
  a good way to explore the access-token/refresh-token pattern hinted at in the JWT section above.
- Move the checkout postcode lookup ([src/lib/postcode.ts](src/lib/postcode.ts)) *behind* the
  backend instead of calling it from the browser — practice proxying a third-party API through
  your own server, including caching repeated lookups.
- Add pagination to `GET /api/orders` once there's enough data for it to matter — a common,
  concrete "make this production-ready" interview question.
