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

### If you don't have Docker or Homebrew yet

The `docker compose up -d` / `brew services start postgresql@16` step above assumes one of those
is already on your machine. On a fresh Mac, neither is guaranteed to be. Pick one path:

**Option A — install Docker Desktop**

Download and install it from [docker.com](https://www.docker.com/products/docker-desktop/), open
it once so the daemon starts, then run `docker compose up -d` as above. This is the simplest
option since `docker-compose.yml` already has the right user/password/database configured.

**Option B — install Homebrew, then Postgres**

```bash
# Install Homebrew (prompts for your Mac password — run this in your own terminal, not a script)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add it to your PATH (the installer prints the exact line for your shell; for zsh on Apple
# Silicon it's this — then restart your terminal or run the same line directly)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install and start Postgres
brew install postgresql@16
brew services start postgresql@16
```

The Homebrew installer clones a large repo over git — on a slow or restricted network it can
stall. If it sits idle for a few minutes with no progress, `Ctrl+C` and re-run the same command;
it resumes rather than starting over.

Unlike Docker (whose `docker-compose.yml` creates the database automatically), a fresh Homebrew
Postgres install is empty, so create the role and database the backend's `.env.example` expects:

```bash
psql postgres -c "CREATE ROLE giftbags WITH LOGIN PASSWORD 'giftbags' CREATEDB;"
psql postgres -c "CREATE DATABASE giftbags OWNER giftbags;"
```

Then continue with step 2 (API) above as normal.

## Test

The test suite runs against a dedicated `giftbags_test` database (see `TEST_DATABASE_URL` in
`server/.env`) so it never touches your dev data. That database isn't created automatically —
do it once, then apply the Prisma migrations to it:

```bash
# One-time setup: create the test database and apply migrations to it
psql postgres -c "CREATE DATABASE giftbags_test OWNER giftbags;"
cd server
DATABASE_URL="postgresql://giftbags:giftbags@localhost:5432/giftbags_test" npx prisma migrate deploy
```

Then run the tests as normal:

```bash
cd server && npm run test
```

If you see `Database "giftbags_test" does not exist`, it means the one-time setup above hasn't
been run yet on this machine.
