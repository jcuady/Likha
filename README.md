# Likha

Metro Manila property, owned in pieces. Likha lets an investor buy a fractional
share of a residential unit, collect rental income monthly, and own part of the
building.

This repository is a **frontend-only build**. There is no database and no
backend service yet: every listing, holding, transaction, and account is
simulated in the browser. The structure is arranged so a real backend replaces
three modules rather than rippling through components.

Live preview: <https://likha-ten.vercel.app>

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 + TanStack Start (SSR) |
| Routing | TanStack Router, file-based |
| Components | shadcn/ui on Radix UI primitives |
| Styling | Tailwind CSS v4 over a custom semantic token layer |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Deployment | Vercel (Nitro, `vercel` preset) |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/marketplace` | Browseable listings with URL-backed filters |
| `/properties/$id` | Listing detail and the simulated subscription flow |
| `/login`, `/signup` | Authentication, with one-click demo personas |
| `/app` | Investor overview |
| `/app/portfolio`, `/app/watchlist`, `/app/statements` | Investor surfaces |
| `/admin` | Operations overview |
| `/admin/listings`, `/admin/investors`, `/admin/analytics` | Admin surfaces |

### Demo accounts

Sign in at `/login` without a password using a persona card:

- **Investor** (Andrea Reyes) — populated portfolio, income, statements
- **New investor** (Jomar Locsin) — genuine first-run empty state
- **Administrator** (Marisol Cruz) — operations workspace

## Where the database plugs in

Each of these is the only file that changes when a backend arrives.

| Module | Responsibility | Replace with |
| --- | --- | --- |
| `src/lib/marketplace.ts` | Listings, holdings, transactions, investors, time series | A query layer. `listingById`, `profileFor`, `batchStats` are the call sites. |
| `src/lib/auth.tsx` | Session state and personas | A real provider. `signIn`, `signInAs`, `signOut` are the surface. |
| `src/lib/watchlist.ts` | Saved listing ids | A server-backed collection. |
| `src/lib/waitlist.ts` | Waitlist capture | A `submitWaitlist` body calling Resend, Supabase, or a webhook. |

Everything else reads through those functions and returns plain objects.

## Data integrity rules

These are enforced by `src/test/marketplace.test.ts`, not by convention:

- **Gross yield is derived from price and rent, never stored.** Every listing
  previously overstated its yield, by up to 4.6 points.
- **Draft listings never reach the public marketplace.** Filtered at the data
  boundary.
- **Availability is a mean across the batch.** Summing per-listing percentages
  produced a headline of "466% of units still open".
- **The investor's income series matches what the held shares actually earn.**

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview the build
npm test         # unit tests
npm run lint     # eslint
```

## Honest scope

Likha is not yet accepting investments. Figures shown across the site are
illustrative and are not an offer of return. The app-download buttons state that
the mobile apps are unpublished, and the waitlist confirmation says plainly that
an address is stored in the browser only and has not been transmitted to a
server. Those statements are load-bearing: they should be updated at the same
time as whatever backend makes them true, never before.