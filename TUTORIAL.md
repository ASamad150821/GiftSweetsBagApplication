# Building "Sweet Bags" — a gift-bag storefront with a mock checkout and a live external API

> This document covers the frontend, where checkout is a mock (nothing is persisted). For the
> real backend that replaced the mock — Node/Express/PostgreSQL, hand-written, with accounts and
> order history — see [TUTORIAL_BACKEND.md](TUTORIAL_BACKEND.md).

This walks through everything that was done to build this project, in order, so you can
rebuild it yourself from scratch. The brief it answers:

> Build a website that offers a service for people to buy gift bags containing sweets for
> children. There's no product photo — the bag contains a random assortment of sweets and is
> labelled with a kind message. The page for placing an order shouldn't be the home page: the
> home page should describe the product with a button to go and order, and there should be a
> nav menu for moving between pages. Somewhere in the app, fetch and handle real data from an
> external API.

**Stack:** Vite + React + TypeScript, Tailwind CSS v4, React Router, Zustand, Zod. This mirrors
the stack used in the noise-reporter project, so the patterns should feel familiar.

**External API:** [postcodes.io](https://postcodes.io) — free, no API key required, so there's
zero account/billing setup before you can fetch real data. It's used on the checkout page: type
a real UK postcode, blur the field, and it looks up the real town/district for that postcode
and fills it in.

---

## 1. Scaffold the project

```bash
npm create vite@latest GiftBagSweets-Application -- --template react-ts
cd GiftBagSweets-Application
npm install
```

Install the libraries the app needs:

```bash
npm install react-router-dom zustand zod
npm install tailwindcss @tailwindcss/vite
```

> **Note on Tailwind version:** plain `npm install tailwindcss` pulls the latest major version
> (v4 at the time of writing), which drops the classic `npx tailwindcss init` /
> `tailwind.config.js` / PostCSS workflow in favour of a Vite plugin plus an `@theme` block
> directly in CSS. That's what this tutorial uses. If you're following older tutorials that
> assume `tailwind.config.js` and `@tailwind base/components/utilities`, that's Tailwind v3 —
> either pin `tailwindcss@^3` or use the v4 approach below.

## 2. Configure Tailwind v4

`vite.config.ts` — add the Tailwind plugin alongside the React plugin:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` — one `@import`, then an `@theme` block that both defines custom design tokens
*and* generates real utility classes for them (`bg-berry`, `text-plum/70`, `border-plum/10`,
etc. all come from this one block — no separate config file needed):

```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Poppins', system-ui, 'Segoe UI', Roboto, sans-serif;

  --color-cream: #fff8ef;
  --color-berry: #e0457b;
  --color-berry-dark: #c22f61;
  --color-plum: #3d1f3a;
  --color-mint: #46c6a4;
  --color-sunny: #ffc94a;
  --color-sky: #6ec9e8;
}

body {
  margin: 0;
  background: var(--color-cream);
  color: var(--color-plum);
  -webkit-font-smoothing: antialiased;
}
```

Delete the generated cruft you won't use: `src/App.css`, `src/assets/*`, `public/vite.svg`.

## 3. Plan the folder structure

```
src/
  components/   reusable UI (Header, Footer, GiftBagIllustration)
  pages/        one file per route (Home, Order, Checkout, Confirmation)
  store/        the zustand order store
  lib/          validation schema + the postcode API call
```

Much smaller than a multi-resource app — there's one product, so there's no need for a
`api/` + `hooks/` split like a project with a real backend would have. The one external call
lives directly in `lib/postcode.ts` and is called straight from the page that needs it.

## 4. No product photo — draw one

The brief said there's no picture of the gift bag, so the product image is a hand-built SVG
illustration (`src/components/GiftBagIllustration.tsx`) rather than a placeholder or a stock
photo: a paper bag shape, two ribbon "handles," three sweets peeking out of the top, and a
small heart-tag hanging off the side to represent the kind-message label.

```tsx
export function GiftBagIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 460" className={className} role="img" aria-label="...">
      {/* bag body, folded top rim, two mint ribbon handles */}
      <path d="M95 190 L120 420 A20 20 0 0 0 140 438 H280 A20 20 0 0 0 300 420 L325 190 Z" fill="var(--color-berry)" />
      <path d="M92 150 H328 L325 190 H95 Z" fill="var(--color-plum)" />
      <rect x="150" y="120" width="30" height="70" rx="8" fill="var(--color-mint)" />
      <rect x="240" y="120" width="30" height="70" rx="8" fill="var(--color-mint)" />

      {/* three sweets peeking above the rim: a swirl lollipop, a round gummy, a wrapped bonbon */}
      {/* ...see the file for the full candy + tag markup... */}
    </svg>
  )
}
```

> **Bug hit during testing:** the first pass gave the wrapped-bonbon candy the same mint fill
> as the ribbon handle sitting right behind it, so on screen they merged into one shape and the
> third candy effectively disappeared. Same problem a second time with a lollipop drawn as a
> circle plus a `+`-shaped "stick," which rendered as a cross/badge rather than a lollipop. The
> fix in both cases was the same: screenshot the SVG in the browser rather than trusting the
> path coordinates on paper, then simplify each shape to at most two overlapping elements in
> clearly distinct colours. Hand-coded SVG illustrations are very easy to get subtly wrong —
> always render-check them.

Colour tokens (`var(--color-berry)`, etc.) come straight from the `@theme` block in step 2, so
the illustration and the rest of the UI always share the same palette.

## 5. Order state and validation

**Why Zustand:** the order details (quantity, gift message, delivery address) need to survive
navigating between the Order page, the Checkout page, and the Confirmation page. A single
store holding all of it is simpler than prop-drilling or URL state for a flow this small.

`src/store/orderStore.ts`:

```ts
import { create } from 'zustand'

export interface CustomerDetails {
  name: string
  email: string
  address: string
  city: string
  postcode: string
}

export const PRICE_PER_BAG = 6.5
const emptyCustomer: CustomerDetails = { name: '', email: '', address: '', city: '', postcode: '' }

function generateOrderNumber() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `SB-${random}`
}

interface OrderState {
  quantity: number
  personalMessage: string
  customer: CustomerDetails
  orderNumber: string | null
  setQuantity: (quantity: number) => void
  setPersonalMessage: (message: string) => void
  setCustomer: (customer: CustomerDetails) => void
  placeOrder: () => string
  reset: () => void
}

export const useOrderStore = create<OrderState>((set, get) => ({
  quantity: 1,
  personalMessage: '',
  customer: emptyCustomer,
  orderNumber: null,
  setQuantity: (quantity) => set({ quantity }),
  setPersonalMessage: (personalMessage) => set({ personalMessage }),
  setCustomer: (customer) => set({ customer }),
  placeOrder: () => {
    const orderNumber = get().orderNumber ?? generateOrderNumber()
    set({ orderNumber })
    return orderNumber
  },
  reset: () => set({ quantity: 1, personalMessage: '', customer: emptyCustomer, orderNumber: null }),
}))
```

**Why Zod:** the checkout form has real validation rules (a proper name, a valid email, a
non-empty address/city/postcode), and Zod gives you the runtime check and the TypeScript type
from one definition.

`src/lib/validation.ts`:

```ts
import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email address'),
  address: z.string().trim().min(4, 'Please enter your delivery address'),
  city: z.string().trim().min(2, 'Please enter your city or town'),
  postcode: z.string().trim().min(4, 'Please enter a valid postcode'),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
```

## 6. The four pages

The flow is deliberately linear: **Home** (marketing, no order state) → **Order** (configure
quantity + message) → **Checkout** (delivery details + validation) → **Confirmation** (fake
order reference).

`src/pages/HomePage.tsx` — describes the product and has a single call to action. It reads
*nothing* from the order store; it's pure marketing copy plus a button:

```tsx
export function HomePage() {
  const navigate = useNavigate()
  return (
    <main>
      {/* illustration + headline + description + price */}
      <button type="button" onClick={() => navigate('/order')}>
        Order a gift bag
      </button>
      {/* three feature cards: random assortment / kind message / delivered with care */}
    </main>
  )
}
```

`src/pages/OrderPage.tsx` — the actual configurator. Quantity stepper and a message textarea
both write straight into the zustand store on every change, so the price and character count
update live:

```tsx
const quantity = useOrderStore((state) => state.quantity)
const setQuantity = useOrderStore((state) => state.setQuantity)
// ...
<button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
<span aria-live="polite">{quantity}</span>
<button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
```

`src/pages/CheckoutPage.tsx` — a controlled form validated with `customerSchema.safeParse` on
submit. On success it calls `setCustomer` + `placeOrder` (which mints the fake order number)
and navigates to `/confirmation`.

`src/pages/ConfirmationPage.tsx` — reads `orderNumber` from the store and shows the recap. If
someone lands on `/confirmation` directly without having placed an order, it redirects home
instead of showing a broken page:

```tsx
if (!orderNumber) {
  return <Navigate to="/" replace />
}
```

## 7. The external API — postcodes.io

**Why a postcode lookup fits naturally here:** the brief asked for a real external API "fetch
and handle real data" somewhere in the app. A UK checkout form already has a postcode field, so
rather than bolting on an unrelated API call, this makes the *existing* field smarter: type a
real postcode, and the town/district autofills from a real government-backed postcode dataset.

`src/lib/postcode.ts` — a plain typed `fetch` wrapper, no API key, CORS-enabled:

```ts
export interface PostcodeLookupResult {
  city: string
  region: string
}

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult | null> {
  const trimmed = postcode.trim()
  if (!trimmed) return null

  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`)
  if (!response.ok) return null

  const data = await response.json()
  if (!data.result) return null

  const city = data.result.admin_district ?? data.result.parish ?? data.result.region ?? ''
  return { city, region: data.result.region ?? '' }
}
```

Wired into the checkout page's postcode field via `onBlur` (not on every keystroke — that would
fire a request per character):

```tsx
async function handlePostcodeBlur() {
  const postcode = form.postcode.trim()
  if (!postcode) return setPostcodeStatus('idle')

  setPostcodeStatus('loading')
  try {
    const result = await lookupPostcode(postcode)
    setForm((previous) => {
      // guard: only apply the result if the postcode field hasn't changed
      // again while the request was in flight
      if (previous.postcode.trim() !== postcode || !result) return previous
      return { ...previous, city: result.city }
    })
    setPostcodeStatus(result ? 'found' : 'not-found')
  } catch {
    setPostcodeStatus('error')
  }
}
```

A small status message under the field (`aria-live="polite"`) reports "Looking up postcode…",
a success message, or "we couldn't find that postcode — please enter your town manually" —
the real API can legitimately 404 on a made-up postcode, so that path has to render something
sensible rather than silently failing.

> **Race condition worth knowing about:** if you fetch on blur and the user re-focuses the
> field, edits the postcode, and blurs again before the first request has resolved, the first
> response can land *after* the second request started and overwrite the city with stale data.
> The `previous.postcode.trim() !== postcode` check above closes that gap — it only applies a
> response if the field still holds the exact postcode that response was for.

## 8. Navigation

`src/components/Header.tsx` — a small pill-style nav using `NavLink`, which gives you
`isActive` for free so the current page is visibly highlighted:

```tsx
const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/order', label: 'Order', end: false },
]

<nav aria-label="Primary" className="flex gap-1 rounded-full bg-white/70 p-1">
  {navItems.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `rounded-full px-4 py-1.5 text-sm font-medium transition ${
          isActive ? 'bg-berry text-white' : 'text-plum/70 hover:bg-white'
        }`
      }
    >
      {item.label}
    </NavLink>
  ))}
</nav>
```

> **Why `end: true` only on Home:** `NavLink` matches by path prefix by default, so without
> `end`, the `/` link would also count as "active" on every other route (since every path
> starts with `/`). `end` makes it require an exact match instead. `/order` doesn't need it
> because nothing is nested underneath it.

Checkout and Confirmation are deliberately **not** in the nav — they're steps you reach by
completing the previous step (clicking "Buy now," then "Place order"), not destinations you'd
jump to directly.

`src/App.tsx` wires up the routes:

```tsx
<BrowserRouter>
  <div className="flex min-h-screen flex-col">
    <Header />
    <div className="flex-1">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </div>
    <Footer />
  </div>
</BrowserRouter>
```

## 9. Run it

```bash
npm run dev     # start the dev server
npm run build   # tsc -b && vite build — catches type errors before shipping
```

Click through the golden path once: **Home** (confirm the illustration and copy render) →
**Order a gift bag** button → bump the quantity, write a message, confirm the price updates →
**Buy now** → fill in the checkout form → type a real postcode (e.g. `SW1A 1AA`) and click out
of the field, confirm the town autofills → **Place order** → **Confirmation** page shows an
order reference → refresh the confirmation URL directly and confirm it redirects home (there's
no order yet in a fresh session).

## What to try extending next

- ~~Swap the fake order number / in-memory store for a real backend~~ — done, see
  [TUTORIAL_BACKEND.md](TUTORIAL_BACKEND.md): a hand-written Node/Express/PostgreSQL API with
  accounts and persisted order history, not a BaaS.
- Add a second external API call — e.g. a currency-conversion API so the price can display in
  the visitor's local currency — to practice combining more than one data source.
- Offer more than one bag size/theme on the Home and Order pages instead of a single product.
