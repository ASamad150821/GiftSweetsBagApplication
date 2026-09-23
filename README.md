# Sweet Bags

A storefront for a single product: the Sweet Surprise Gift Bag — a bag filled with a random
assortment of sweets, finished with a personalised kind-message label.

**Live demo:** https://gift-sweets-bag-application.vercel.app

Frontend on Vercel, API on Render, Postgres on Neon. The API runs on a free instance that sleeps
when idle, so the first request after a quiet spell can take up to a minute.

## The user journey

1. **Register / log in** — an account is required to place an order
2. **Product page** — pick a quantity, write a message for the label, see the live price
3. **Checkout** — delivery details, validated with Zod, with an order summary
4. **Confirmation** — a real, server-issued order reference
5. **My Orders** — past orders, persisted in a real database

Checkout is real: orders are validated, priced, and stored by a hand-written backend — no
payment is taken, but nothing here is faked or mocked.

## Stack

**Frontend:** React + TypeScript, Vite, Tailwind CSS v4, React Router, Zustand, Zod.

**Backend** (`server/`): Node.js + Express + TypeScript, PostgreSQL + Prisma, JWT auth
(`bcryptjs` + `jsonwebtoken`), Zod validation, Vitest + Supertest. Written from scratch — no
backend-as-a-service.

See [TUTORIAL.md](TUTORIAL.md) for how the frontend was built and
[TUTORIAL_BACKEND.md](TUTORIAL_BACKEND.md) for how the backend was built — both walk through the
project step by step so you can rebuild it yourself.

## Run it locally

```bash
# 1. Database (pick one)
docker compose up -d                   # or: brew services start postgresql@16

# 2. API
cd server
cp .env.example .env                   # then set a real JWT_SECRET (see TUTORIAL_BACKEND.md)
npm install
npx prisma migrate dev --name init
npm run dev                            # http://localhost:4000

# 3. Frontend (new terminal, repo root)
cp .env.example .env
npm install
npm run dev                            # http://localhost:5173
```

Needs Docker Desktop, or Postgres 16 installed with Homebrew. A fresh Homebrew install also
needs the `giftbags` role and database creating by hand; see
[TUTORIAL_BACKEND.md](TUTORIAL_BACKEND.md) step 1 for the commands.

## Test

14 tests (Vitest + Supertest) cover registration and login, and the orders API: auth checks,
server-side pricing that ignores a client-sent price, users only seeing their own orders, and
deleting an order. They run against a real Postgres database, `giftbags_test` (see
`TEST_DATABASE_URL` in `server/.env`), which is wiped between tests so it never touches your
dev data.

One-time setup: create the test database, then apply the migrations to it:

```bash
# Docker:
docker compose exec postgres createdb -U giftbags giftbags_test
# Homebrew:
psql postgres -c "CREATE DATABASE giftbags_test OWNER giftbags;"

cd server
DATABASE_URL="postgresql://giftbags:giftbags@localhost:5432/giftbags_test" npx prisma migrate deploy
```

Then run the tests:

```bash
cd server && npm run test
```

If you see `Database "giftbags_test" does not exist`, the one-time setup above hasn't been run
yet on this machine.
