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

## SEO

`src/lib/site.ts` holds the single origin and the brand's search-facing strings.
`src/lib/seo-schemas.ts` builds the JSON-LD payloads, so structured data is
generated from the same listing objects the pages render rather than typed twice.

| Page | Canonical | Structured data | Indexing |
| --- | --- | --- | --- |
| `/` | yes | `Organization`, `WebSite`, `WebPage`, `ItemList` | index |
| `/marketplace` | yes | `CollectionPage` + `ItemList` | index |
| `/properties/$id` | yes | `Product` + `Offer` | index, unless the listing is a draft |
| `/signup` | yes | site-level only | index |
| `/login` | yes | site-level only | `noindex, follow` |
| `/app/*`, `/admin/*` | none | site-level only | `noindex, nofollow` |

Three rules are enforced rather than assumed:

- **Exactly one canonical per page.** TanStack dedupes `<meta>` by name but
  *appends* `<link>` tags, so a root-level fallback canonical alongside a
  per-route one rendered two on every page with `/` first — collapsing the whole
  site onto the homepage. There is no root fallback.
- **The sitemap never lists a noindex route**, and it is asserted to contain
  exactly the indexable routes plus every non-draft listing.
- **No `AggregateRating`, review count or user count is ever emitted.** These
  are asserted on the serialised payloads, not on source text.

`public/sitemap.xml` and `public/robots.txt` are static files that cannot
import `SITE`. `src/test/seo.test.ts` is the join: change the domain or add a
listing and those tests fail instead of letting them drift.

## Where the database plugs in

Each of these is the only file that changes when a backend arrives.

| Module | Responsibility | Replace with |
| --- | --- | --- |
| `src/lib/marketplace.ts` | Listings, holdings, transactions, investors, time series | A query layer. `listingById`, `profileFor`, `batchStats` are the call sites. |
| `src/lib/auth.tsx` | Session state and personas | A real provider. `signIn`, `signInAs`, `signOut` are the surface. |
| `src/lib/watchlist.ts` | Saved listing ids | A server-backed collection. |
| `src/lib/waitlist.ts` | Waitlist capture | A `submitWaitlist` body calling Resend, Supabase, or a webhook. |
| `public/sitemap.xml` | Static URL list | Server-rendered from the listings query. |

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