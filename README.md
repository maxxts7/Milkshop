# Khanams Grassfed

E-commerce site for Khanams Grassfed, Srinagar — Milk House dairy, Honey House
honey, and the Kashmiri pantry range.

Next.js 16 · TypeScript · Tailwind v4 · Drizzle ORM · Postgres · deploys to Netlify.

---

## Run it locally

```bash
npm install
cp .env.example .env.local     # the defaults work with no signups
npm run db:setup               # creates tables + loads the catalogue
npm run dev
```

Open <http://localhost:3000>. Admin is at <http://localhost:3000/admin>.

**First admin login**

| | |
|---|---|
| Email | `manuxtmail@gmail.com` |
| Password | `khanams@2026` |

Change it immediately under **Settings → Change your password**. To seed a
different account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before `npm run db:seed`.

### Why it runs with no database signup

`DATABASE_URL` defaults to `pglite://.data/khanams` — a real Postgres compiled to
WASM that lives in a folder. Nothing to install, nothing to register. It is for
development only; serverless functions have no persistent disk, so production
uses Neon (below). The driver is chosen automatically from the URL — see
`src/lib/db/index.ts`.

---

## Deploy to Netlify

**1. Create the database.** Sign up at [neon.tech](https://neon.tech) (the free
tier is ample here), create a project, and copy the **pooled** connection string.

**2. Push this folder to GitHub**, then in Netlify choose *Add new site → Import
an existing project* and pick the repo. Netlify detects Next.js and reads
`netlify.toml`; the build command and publish directory are already set.

**3. Set environment variables** under *Site configuration → Environment
variables*:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **yes** | Your Neon pooled connection string |
| `AUTH_SECRET` | **yes** | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | **yes** | e.g. `https://khanams-grassfed.netlify.app` |
| `SMS_PROVIDER` | no | `msg91` to send real OTPs; blank logs them instead |
| `MSG91_AUTH_KEY` / `MSG91_TEMPLATE_ID` / `MSG91_SENDER_ID` | no | From your MSG91 account |
| `RESEND_API_KEY` | no | Emails you each new order; blank logs it instead |
| `ORDER_ALERT_EMAIL` | no | Where order alerts go |

The build itself does **not** need `DATABASE_URL` — every database-backed page is
rendered per request, so nothing queries at build time. A deploy with the
variable missing will build fine and then show a clear error on the first
request, rather than failing the build with a stack trace.

**4. Create the tables.** Point your local `.env.local` at the Neon URL and run:

```bash
npm run db:migrate
npm run db:seed
```

**5. Deploy.** Netlify builds on push.

Adding a custom domain later needs no code change — set it in Netlify's *Domain
management* and update `NEXT_PUBLIC_SITE_URL`.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:setup` | generate + migrate + seed, in one go |
| `npm run db:generate` | Turn schema changes into SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Rebuild the catalogue (safe to re-run — never touches orders) |
| `npm run db:clear` | **Destructive.** Wipe orders/customers/subscriptions, keep catalogue |
| `npm run lint` | ESLint |

Run `db:clear` once before going live to remove any test orders.

---

## How the shop works

### Fresh vs pantry — the rule everything rests on

Every product is `fresh` or `dry`.

- **Fresh** (milk, goat milk, dahi, eggs) delivers **inside Srinagar only**, to a
  pincode on the serviceable list. It is never posted.
- **Dry** (honey, honeycomb, ghee, wari, pickle) ships **anywhere in India**.

A basket holding both can only be delivered locally or collected. Checkout
enforces this and explains it in plain words rather than failing silently. The
rule lives in `resolveZone()` in `src/lib/delivery.ts` and is re-checked
server-side when the order is placed — the browser cannot talk its way past it.

### Delivery charges

| | Fee | Free above |
|---|---|---|
| Srinagar | ₹40 | ₹500 |
| Rest of India | ₹99 | ₹1,500 |
| Store pickup | Free | — |

All four numbers are editable in **Admin → Settings**.

### The 8pm cutoff

Order before 8:00pm and fresh items arrive next morning, 6:00–9:00 AM. After
that, the morning after. The site shows a live countdown and names the exact
delivery date before the customer pays.

All time handling is in IST regardless of where the server runs — Netlify runs in
UTC, your customers do not. See the note at the top of `src/lib/delivery.ts`.

### Subscriptions

Daily, alternate-day, or weekly on chosen weekdays. Cow milk is **₹60/litre on
subscription against ₹63 one-off**; the saving is shown as the customer builds
the plan. No advance payment and no lock-in — they pay the rider each delivery.

Customers pause, change quantity and cancel from their account. You see every
delivery due on a given morning under **Admin → Delivery run-sheet**, which
merges subscriptions with one-off orders, totals the cash to collect, and prints
on one page with tick boxes for the rider.

### Payment

Cash on delivery and cash on pickup, as agreed. **No payment gateway is wired
in** — that was the one thing left out.

Checkout is already shaped for it: `orders.paymentMethod` and
`orders.paymentStatus` exist and are respected everywhere, marking an order
delivered marks the cash collected, and the refund policy already covers online
refunds. Adding Razorpay or Cashfree later means inserting a payment step into
`src/app/api/orders/route.ts` after pricing and before the insert — no redesign.

---

## Managing the shop

Everything below is done from `/admin` with no developer involvement.

- **Orders** — filter by state, advance an order with one click
  (Confirm → Packed → Send out → Delivered), call or WhatsApp the customer from
  the order, keep internal notes. Marking delivered marks the cash received.
- **Delivery run-sheet** — the printable morning round for any date.
- **Subscriptions** — every plan, its rhythm, next delivery and value.
- **Products & prices** — edit prices, rename sizes, add or delete a size, toggle
  a size out of stock, move a product between Active / Coming soon / Hidden.
  Changes are live immediately; nothing needs redeploying.
- **Waiting list** — who asked to be told about goat cheese and masala tikki,
  with a one-tap WhatsApp message per person.
- **Settings** — fees, free-delivery thresholds, cutoff time, delivery window and
  days, serviceable pincodes, contact details, the announcement bar, and a
  **Pause all orders** switch for holidays.

### Product photography

Real photographs are in `public/images/products/`. Two products have **no
photograph**, because none existed in the material supplied:

- **Kashmiri Wari**
- **Goat Cheese**

They show a typographic plate in the brand's own type rather than a borrowed
stock image. To fix: drop a file into `public/images/products/`, then paste the
path (e.g. `/images/products/wari.jpg`) into **Main image path** on that product
in the admin.

Ghee, eggs, pickle and masala tikki are cropped out of the "What's Available
Today" poster. They are good enough to launch with, but a real photograph of each
would be better.

---

## Notes on the source material

Two things in the material supplied contradicted each other or were incomplete,
and were resolved as follows:

1. One poster said *"Delivery within Srinagar"*, another said *"Delivering Pan
   India"*. Resolved as the fresh/dry split described above, which is true to
   both.
2. **Masala tikki** appeared out of stock with no price, and **goat cheese** as
   "coming soon". Both are listed as Coming soon with a waiting-list signup. Give
   masala tikki a price in the admin and switch it to Active when it returns.

**Mixed vegetable pickle** is seeded **out of stock** to match the poster. Turn
it back on in **Products & prices** when you have stock.

Pack sizes for ghee, honey, pickle, wari and eggs were derived from the per-kg
and per-unit rates supplied (e.g. ghee ₹1,600/kg → 250g ₹420, 500g ₹800,
1kg ₹1,600). **Check every one of these against what you actually sell** before
going live — they are sensible defaults, not a real price list.

---

## Project layout

```
src/
├── app/
│   ├── (shop)/           storefront — home, shop, product, cart, checkout,
│   │                     account, subscribe, about, contact, policies
│   ├── admin/            dashboard; (panel)/ is the signed-in area
│   └── api/              cart pricing, orders, subscriptions, OTP, waitlist
├── components/           shared UI
└── lib/
    ├── db/               schema, drivers, migrations, seed
    ├── cart.ts           server-side pricing — the client never sets a price
    ├── delivery.ts       IST time, cutoff, zones, delivery fees
    ├── subscriptions.ts  schedule maths and the run-sheet
    ├── auth.ts           phone OTP + admin sessions
    ├── sms.ts            OTP delivery (console → MSG91)
    └── email.ts          order alerts (console → Resend)
```

### A note on prices in the code

Money is stored as **integer paise** everywhere (`₹60` is `6000`) and only
becomes a string in `src/lib/money.ts`. Nothing rounds badly, because nothing is
a float.

### A note on the cart

The browser stores **variant IDs and quantities only**. Every price is looked up
server-side in `priceCart()` when the cart is displayed, and again when the order
is placed. Editing localStorage can change what someone buys, never what it
costs.

---

## Security

- Admin passwords are bcrypt-hashed; sessions are signed JWTs in httpOnly cookies.
- OTPs are hashed, expire in 10 minutes, allow 5 attempts, and rate-limit resends
  to once a minute.
- Subscription changes are scoped by customer ID, so a guessed ID matches nothing.
- Order numbers carry six random characters, so receipts cannot be enumerated.
- No card data is stored anywhere, because payment is taken in cash.

`npm audit` reports advisories inside Next.js's own bundled `postcss` and `sharp`.
They resolve only by downgrading Next to v9, so they are left as-is; they will
clear when Next ships updated dependencies.

## Policy pages

Drafts for Terms, Privacy, Delivery & pickup, and Cancellations & refunds are
written for a perishables business and are live at `/policies/*`. Each carries a
visible note to the owner. **Have them checked by a legal adviser before you rely
on them.** They are also what an Indian payment gateway will ask to see when you
onboard.
