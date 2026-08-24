# Sweet Bags — Gift Bag Ordering App

A small end-to-end storefront: customers order a "Sweet Surprise Gift Bag," and every order is saved to a real database. Built as a portfolio project to demonstrate a full client → API → database flow with authentication and authorization.

## Live demo

[giftsweetbagapplication.vercel.app](https://giftsweetbagapplication.vercel.app)

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Zod
- **Backend:** [Supabase](https://supabase.com) — Postgres database, auto-generated REST API, and Auth, secured with Row Level Security
- Postcode-to-town autofill via the free [postcodes.io](https://postcodes.io) API

## How it works

- A customer goes to `/order`, picks a quantity and an optional personal message, then enters delivery details at `/checkout`.
- On submit, the form is validated with Zod and the order is inserted into a Postgres `orders` table through the Supabase client SDK.
- Data access is enforced at the database level with Row Level Security policies:
  - Anyone can **insert** an order (place an order) — the public site never reads data back.
  - Nobody can **read** orders unless they're signed in.
- `/orders` is a protected admin view. Signing in at `/login` (Supabase Auth, email + password) is required to see the order list. There's no public sign-up — the one admin account is created directly in the Supabase dashboard.

## Architecture

```
React (Vite)  ──▶  Supabase client SDK  ──▶  Supabase
                                              ├─ Postgres (orders table)
                                              ├─ Auto-generated REST API (PostgREST)
                                              ├─ Auth (email/password)
                                              └─ Row Level Security policies
```

## Running it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a free [Supabase](https://supabase.com) project.
3. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the `orders` table and its security policies.
4. Create your admin login under **Authentication → Users → Add user** (this is what you'll use to sign into `/orders`).
5. Copy `.env.example` to `.env.local` and fill in your project's values, found under **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```

## Notes

This is a demo storefront — no real payments are processed.
