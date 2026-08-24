-- Run this in your Supabase project's SQL Editor (Project > SQL Editor > New query).
-- It creates the table that stores every order placed through the site.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  quantity integer not null check (quantity between 1 and 10),
  personal_message text,
  customer_name text not null,
  customer_email text not null,
  customer_address text not null,
  customer_city text not null,
  customer_postcode text not null,
  total_price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: the app talks to Supabase using a public "anon" key,
-- so RLS is what stops a stranger from reading or editing everyone else's orders.
alter table public.orders enable row level security;

-- Anyone using the site can create an order...
create policy "Anyone can place an order"
  on public.orders
  for insert
  to anon
  with check (true);

-- ...but the public can't read, edit, or delete orders through the API.

-- Signed-in users (i.e. you, via the app's /login page) can view all orders.
-- There is no public sign-up in the app — create your own login under
-- Authentication > Users > Add user in the Supabase dashboard.
create policy "Signed-in users can view orders"
  on public.orders
  for select
  to authenticated
  using (true);

