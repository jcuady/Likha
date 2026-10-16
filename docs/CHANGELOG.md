# Changelog

All notable behaviour changes. Dates are the day the change reached production.

## 2026-10-16 — System audit closed

19 severity-tagged defects — 2 P0, 6 P1, 11 P2 — plus one consolidated P3
cleanup batch and one overlay defect found while testing the others.

### Security

- **P0** Sign-up offered an `admin` role. A public signup page could mint an
  administrator session and land on the operations workspace. Role removed from
  the schema and the UI; the admin surface is reached through the labelled test
  accounts on `/login`. Also fixed the "Account created" toast, which claimed a
  registration that never happened, and added the demo-build disclosure that
  `/login` already carried.
- **P0** `auth.tsx` read `window.localStorage` at module scope, which evaluates
  during SSR and returned HTTP 500 on every route. Replaced with a lazy
  accessor and guarded: no module may read a browser global at import time.
- **P1** Login silently signed unknown addresses in as the first persona, and
  toasted that identity back. Unknown addresses are now rejected with a message
  pointing at the three demo accounts, and no session is created.
- Closed dialogs stayed mounted at full size with `pointer-events: auto` and no
  `aria-hidden`, swallowing clicks over the page and staying in the accessibility
  tree. Radix unmounts only after `animationend`, which `tw-animate-css` never
  fired. Both `dialog.tsx` and `alert-dialog.tsx` now carry
  `data-[state=closed]:invisible` and `pointer-events-none`, so correctness does
  not depend on an animation library firing an event.
- Added `vercel.json` with `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` and HSTS.

### Correctness

- **P1** Sidebar badges were literals — "3" on a watchlist that starts empty,
  "8" on a list whose own Create and Remove buttons changed the count. Badge
  literals removed; `AppSidebar` supplies counts per render from the stores that
  own them.
- **P1** Editing a listing's price or rent left the stored `yield` stale, so the
  table contradicted the dialog that produced it. Both the create and edit paths
  call `grossYield` now.
- **P1** Admin rows lived in component state, so every edit vanished on
  navigation. Added `src/lib/admin-store.ts`; client-side navigation now
  preserves edits.
- **P1** Statements counted a `Pending` transaction as deployed capital and
  disagreed with the overview by ₱855,000 for the same account. Aggregates now
  filter `status === "Completed"`.
- **P1** The invite dialog stayed open after a successful add.
- **P2** Analytics averaged drafts into average rent and best performer while
  the card beside it excluded them. One `liveListings` universe now.
- **P2** The capital-by-city bar was normalised to the largest city under a
  caption reading "Share of total asset value". Now normalised to the total.
- **P2** `"31 Oct / in 12 days"` was four days stale on arrival and wrong in
  every later month. Now derived from the rule printed directly beneath it.
- **P2** Three `StatCard` deltas were hardcoded percentages no series could
  reproduce; one was the *previous* period's change. Added `monthOverMonth`.
- **P2** "Keep me signed in" was registered, validated, rendered and never read.
  It now selects `sessionStorage` over `localStorage`.
- **P2** The waitlist titled itself "You are on the list" above a paragraph
  admitting the address had been sent nowhere.
- **P2** The header search accepted keystrokes and discarded them; the bell
  claimed two unread notifications that do not exist. Both replaced.
- **P2** The holdings table had five headers over six cells, so the investor's
  ownership percentage rendered under a "Yield" heading.
- **P2** Cancelling mid-confirmation in the invest dialog left it armed to show
  a receipt for a cancelled purchase. Every close now routes through one
  `close()` helper that cancels pending timers; the Cancel and Done buttons
  used to bypass that path entirely.
- **P2** The "Income mix" card plotted invested capital grouped by city with
  monthly income in the centre. It now plots the income the shares earn.
- **P2** The marketplace empty state suggested clearing "the city or the
  minimum yield" regardless of what was set. It now names the active filters.
- **P3** Removed a hidden `DialogTrigger` rendering a nameless button; an
  unused import; a duplicated class token; a magic `8%` bar ceiling and a
  list separator keyed to a literal `4`; slider labels pointed at elements Radix
  does not associate; `ListingCard` used `h3` with no `h2` above it on three
  routes; the auth shell tagline was an `h2` rendered before the page `h1`; and
  a "above 4.0% passes review" rule that exists nowhere in the codebase.

### Accessibility and responsive

- `Input` and `SelectTrigger` are `h-11 sm:h-9` and marketplace controls raised
  to 44px below `sm`. Radio rows carry `min-h-11` while the 16px indicator stays
  as designed.
- 0 horizontal overflow from 320px to 1920px across 13 routes.

### Added

- `src/test/audit-regressions.test.ts` — 33 guards, each mutation-proven by
  reintroducing the defect and requiring the suite to go red.
- `src/test/pwa.test.ts`, `src/lib/admin-store.ts`, `vercel.json`.
- `docs/SYSTEM_AUDIT.md`, `docs/CONTROL_INVENTORY.md`, `docs/ARCHITECTURE.md`,
  `docs/RBAC_MATRIX.md`.

## 2026-10-15 — Brand marks, PWA, restored hero

- Real Apple and Google Play marks replacing lucide stand-ins.
- Full PWA icon set and manifest; theme colour sampled from the brand mark.
- Hero copy restored; occupancy held at 87% rather than the 74% in the
  reference, which contradicted its own legend.
- `og-image.jpg` regenerated at 1200×630 to match the new headline.

## 2026-10-14 — Functional audit of the deployed app

Seven defects found by clicking production, each invisible to typecheck, tests,
lint and build: a mangled peso glyph, a draft listing leaking into the public
city filter, an admin dashboard reporting the portfolio as both 8 and 7, a
summation of percentages reaching 466%, duplicate `aria-current` links, and 49px
of horizontal overflow at exactly the 768px breakpoint.