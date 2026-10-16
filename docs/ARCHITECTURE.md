# Architecture

## Stack

| Concern | Choice | Why it is here |
|---|---|---|
| Framework | React 19 + Vite 8 | Project default |
| Routing | TanStack Router (file-based) | Typed routes, per-route `head` for SEO |
| Data fetching | TanStack Query | Present from the start; unused while data is local |
| Styling | Tailwind v4 (`@import "tailwindcss"`) | Semantic tokens in `src/styles.css` |
| Animation | `tw-animate-css` | Enter/exit keyframes for overlays |
| Components | shadcn/ui on Radix | Accessible primitives, owned locally in `src/components/ui` |
| Forms | React Hook Form + Zod | Shared resolver setup on `/login` and `/signup` |
| Charts | Recharts | Portfolio and admin analytics |
| Testing | Vitest + Testing Library | Matches the stack, no second runner |
| Deploy | Vercel (`NITRO_PRESET=vercel`) | Nitro preset pinned rather than auto-detected |

## Layers

```
src/routes/          one file per route; owns head/meta and page composition
src/components/
  ui/                shadcn primitives — the only place raw class strings live
  brand/             logo, phone mockup
  app/               signed-in shell, sidebar, charts, stat cards
  marketplace/       cards, filters, invest dialog
  marketing/         public shell
  landing/           growth sections, waitlist dialog
src/lib/             data + state; the database boundary
src/test/            unit + regression suites
docs/                audit, control inventory, this file
```

## The data boundary

Nothing above `src/lib/` imports a data source directly. Five modules own all
application state, and they are the only things a backend replaces:

| Module | Owns | Replace with |
|---|---|---|
| `src/lib/marketplace.ts` | Listings, investors, holdings, transactions, time series, derived helpers | A query layer. `listingById`, `profileFor`, `batchStats`, `publicListings` are the call sites. |
| `src/lib/auth.tsx` | Session, personas, persistence | A real provider. `signIn`, `signInAs`, `signOut` are the surface. |
| `src/lib/admin-store.ts` | Admin listing and investor mutations | Server mutations behind the same one-function-per-entity API. |
| `src/lib/watchlist.ts` | Saved listing ids | A server-backed collection per account. |
| `src/lib/waitlist.ts` | Early-access capture | A `submitWaitlist` body calling Resend, Sheets or a webhook. |

`public/sitemap.xml` is server-rendered from the listings query when listings
become dynamic.

### Derived values are never stored

The single most important rule in this codebase, because violating it shipped
eleven separate defects:

- `Listing.yield` is computed by `grossYield(price, rent)` at construction.
- `batchStats` / `publicCityCounts` / `adminBatchStats` compute counts at the
  data boundary from the array being shown.
- `meanAvailability` averages; it never sums percentages.
- `monthOverMonth` reads the last two points of the series it labels.
- Sidebar counts are supplied per-render by `AppSidebar`, which is the only
  component that can read the owning store.

## Auth and RBAC

Two roles: `investor` and `admin`, declared in `src/lib/auth.tsx`.

`RequireAuth` in `src/components/app/app-shell.tsx` guards `/app/*` and
`/admin/*`. It is **client-side only**, because the session lives in
`localStorage` or `sessionStorage` and the server cannot see it. This is a
deliberate, documented limitation, not an oversight: moving to a real provider
requires moving this check server-side. See `docs/RBAC_MATRIX.md`.

## SSR and hydration

The root route renders `<html>`/`<head>`/`<body>`; TanStack injects
`HeadContent` and `Scripts`. Two consequences the tests enforce:

1. **No module may read a browser global at import time.** `window.localStorage`
   at module scope evaluated during SSR and returned HTTP 500 on every route.
   Guards live in `src/test/audit-regressions.test.ts`.
2. **The signed-in shell cannot render on the server.** `RequireAuth` shows a
   skeleton until `ready` flips on the client, so `/app` and `/admin`
   server-render only their `<title>`.

## Styling rules

- Semantic tokens only (`bg-background`, `text-muted-foreground`). Raw colours
  belong in `src/styles.css`, not in components.
- `className` carries layout, not brand decisions.
- Shared `Button` variants; no parallel one-off buttons.
- Touch targets: 44px below the `sm` breakpoint. `Input` and `SelectTrigger`
  are `h-11 sm:h-9`; radio rows carry `min-h-11` while the indicator stays 16px.
- Overlays must be inert when closed — see the animation note below.

## Overlay behaviour worth knowing

Radix unmounts dialog content only after the exit animation fires
`animationend`. With `tw-animate-css` that event never arrived, leaving closed
dialogs mounted at full size, `pointer-events: auto`, no `aria-hidden` — over
the page and in the accessibility tree. Both `dialog.tsx` and
`alert-dialog.tsx` therefore carry `data-[state=closed]:invisible` and
`data-[state=closed]:pointer-events-none`. Correctness does not depend on an
animation library firing an event.

## Testing

- `src/test/marketplace.test.ts` — data-layer invariants.
- `src/test/seo.test.ts` — canonical/robots/sitemap drift.
- `src/test/presentation.test.ts` — encoding integrity, counts vs grids.
- `src/test/waitlist.test.ts` — waitlist storage.
- `src/test/pwa.test.ts` — manifest installability, icon pixel dimensions.
- `src/test/audit-regressions.test.ts` — one guard per audited defect.

Every guard in the regression suite is mutation-proven: the defect is
reintroduced and the suite must go red. A guard that has never failed is not
evidence.