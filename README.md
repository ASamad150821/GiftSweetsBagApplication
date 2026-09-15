# Sweet Bags

A storefront for a single product: the Sweet Surprise Gift Bag — a bag filled with a random
assortment of sweets, finished with a personalised kind-message label.

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

## Test

```bash
cd server && npm run test
```
