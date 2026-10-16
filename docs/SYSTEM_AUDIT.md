# System Audit

Principal full-system QA of Likha. Conducted by clicking the deployed
application as all three personas, not by reading the source.

## Summary

- **Audit date:** 2026-10-15
- **Branch / commit:** `main`, audit started at `69a8278`
- **Framework:** React 19, TanStack Router, Vite 8, Tailwind v4, shadcn/ui (Radix)
- **Build status:** PASS
- **Test status:** PASS — 81 tests across 8 files
- **Scope:** 13 page routes, 3 personas, 8 viewports, every interactive control
- **Method:** rendered-output sweep plus a mutation probe on every new guard

### The finding that shaped this audit

Eleven of the fourteen defects below are the same defect wearing different
clothes: **a number that was typed instead of derived.** Each was correct only
until something moved. Typecheck, ESLint, the production build and the existing
test suite were all green while every one of them shipped.

None were found by reading code. All were found by changing the data and
watching a number refuse to move.

---

## Critical Issues

| Severity | Area | Issue | Status |
|---|---|---|---|
| P0 | Auth / RBAC | Sign-up offered an `admin` role, so a public signup page could mint an administrator session and land on the operations workspace | Fixed |
| P0 | Availability | `const stores = [window.localStorage, window.sessionStorage]` at module scope evaluated during SSR and returned **HTTP 500 on every route**. Introduced during this audit's own fix, caught in production, fixed at the root | Fixed |
| P1 | Data integrity | Login fell back to `personas[0]`, so any address plus any 8-character password silently signed the visitor in as a different named person and toasted that identity back | Fixed |
| P1 | Data integrity | Sidebar badges were literals ("3" watchlist, "8" listings) that no mutation could update | Fixed |

---

## Functional Issues

| Page / Feature | Problem | Root Cause | Fix | Verified |
|---|---|---|---|---|
| Sidebar | Badge read `3` over an empty watchlist; badge read `8` after creating a 9th listing | Count stored in `nav-config.ts`, far from the store that owns it | Badge removed from config; `AppSidebar` supplies counts per render from `useWatchlist()` and `useAdminData()` | Production: badge 0 → 2 → 0 and 8 → 9 → 8 tracking live |
| `/admin/listings` | Editing price/rent left the stored `yield` stale, so the table contradicted the preview in the dialog that produced it | `yield` is a stored field that `saveDraft` never recomputed, while `commitCreate` did | Both paths now call `grossYield(price, rent)`; the duplicated inline formula is gone | Edited rent to 100k → row shows 6.0% |
| `/admin/listings` + `/admin/investors` | Every edit vanished on navigation | Rows lived in component `useState`, which unmounting discarded | New `src/lib/admin-store.ts` (`useSyncExternalStore`), mirroring `watchlist.ts` | Created a listing, navigated away and back, row persisted |
| `/admin/investors` | Dialog stayed open after a successful add | Uncontrolled `<Dialog>` with no close call | `open` is now controlled and closes on submit | Dialog closed, rows 6 → 7, badge 7 |
| `/app/statements` | Reported ₱2,964,800 invested while `/app` and `/app/portfolio` reported ₱2,109,800 for the same account | A `Pending` transaction was counted as deployed capital | Both aggregates filter `status === "Completed"` | Both pages now read ₱2,109,800 |
| `/app/statements` | Card said "Across 3 properties" above a table listing four | Literal, and scoped to a different row set than the table | Counted from the settled set and labelled "settled" | Reads "Across 3 settled properties" |
| `/admin/analytics` | Average rent and Best performer included drafts while the neighbouring card excluded them | Four tiles in one row used two different universes | Single `liveListings` constant feeds all of them | Code + guard |
| `/admin/analytics` | Batangas rendered a 100% bar under the caption "Share of total asset value" | Bar normalised to the largest city, caption normalised to the total | Bar divided by `totalCapital`; percentage shown beside it | Code + guard |
| `/admin/investors` | `Add investor` was disabled with no explanation on empty input | Expected, but undocumented | Left as-is; submit-state probing confirmed the rule | Disabled at empty and at `not-an-email`, enabled at `test@example.com` |
| `/app` | "31 Oct / in 12 days" was already 4 days wrong and wrong in every later month | Literal beside a sentence stating the real rule | `DistributionCard` derives end-of-month from `new Date()` | Code + guard |

---

## Validation Issues

| Form | Field | Problem | Fix |
|---|---|---|---|
| `/admin/listings` | price, rent | No `required` attribute; an empty submit produced no visible feedback in the DOM | Already guarded in `commitCreate`/`saveDraft` with a toast; verified the toast fires and the dialog stays open |
| `/login` | email | Unknown address was accepted | Rejected with a message pointing at the three demo accounts; **no session is created** |
| `/signup` | role | Anyone could select administrator | Role removed from the schema and the UI |
| `/signup` | — | Toast said "Account created" when nothing was registered | Now "Demo session started", with a demo-build disclosure |
| `/login` | remember | Checkbox was registered, validated, rendered, and never read | `signIn` now writes to `sessionStorage` when unchecked; both stores cleared first |

---

## Responsive Issues

| Screen | Viewport | Issue | Fix |
|---|---|---|---|
| `/login`, `/signup` | 320–414 | Every `Input` was 36px, under the 44px touch floor | Shared `Input` and `SelectTrigger` are now `h-11 sm:h-9` |
| `/marketplace` | 320–414 | Search input 40px, clear button 40px, filter selects 40px, card star 36px | Each raised to 44px below `sm`, unchanged above |
| `/marketplace` | 320–414 | Availability radio indicators were 16px targets | The **row** carries `min-h-11`; the visual dot stays 16px by design |
| All routes | 320–1920 | — | 0 horizontal overflow, measured `innerWidth` asserted equal to target on every check |

**Measurement note.** The first pass reported the listing-card title links as
21px targets. They use the stretched-link pattern (`after:absolute after:inset-0`),
so `getBoundingClientRect` reports the inline text box while the real target is
the whole card. The probe now reads the `::after` computed style and skips
stretched links. Inline text links inside a sentence ("New to Likha? Create an
account") are exempt under WCAG 2.5.8 and are not defects.

---

## Accessibility Issues

| Component | Problem | Fix |
|---|---|---|
| `app-shell.tsx` | `aria-label="Notifications, 2 unread"` told screen-reader users about two messages that do not exist; no notification data exists anywhere | Bell and tooltip removed |
| `app-shell.tsx` | The header search was an uncontrolled input with no value, handler, or form — it accepted keystrokes and discarded them | Now a real `<form role="search">` that navigates to `/marketplace?q=` |
| `app.index.tsx` | Holdings table had 5 headers over 6 cells, so location sat under "Share" and ownership % sat under "Yield"; the income column had no header | 6 heads over 6 cells, relabelled |
| `nav-config.ts` | A badge count had no accessible name tying it to its nav item | `aria-label` added |

| Inline text links | "New to Likha? Create an account" rendered 19px | Not a defect | WCAG 2.5.8 exempts targets inline in a sentence |

### Security headers

Vercel's defaults left `X-Content-Type-Options`, `Referrer-Policy` and
`Permissions-Policy` unset. `vercel.json` now sets `nosniff`, `DENY` framing,
a strict referrer policy, a restrictive permissions policy, and HSTS. All five
verified present on the deployed origin.

---

## Backend / API Issues

No backend exists yet, by design. The five database swap points are unchanged
and remain the only places that need to change:

| Swap point | File |
|---|---|
| Listings, investors, derived stats | `src/lib/marketplace.ts` |
| Sign-in, sign-out, session persistence | `src/lib/auth.tsx` |
| Admin mutations (new in this audit) | `src/lib/admin-store.ts` |
| Watchlist | `src/lib/watchlist.ts` |
| Waitlist submission | `src/lib/waitlist.ts` |

---

## Missing Features / Incomplete Implementations

| Area | Missing behaviour | Priority |
|---|---|---|
| Admin mutations | In-memory only; a full page reload resets them (client-side navigation persists) | By design until the database lands |
| Waitlist | Writes to `localStorage`; the UI states this honestly | Needs a destination: Resend, Sheets, webhook or Supabase |
| PDF export | Button explains it is not connected | Document storage |
| Email delivery | Sign-up and investor invites state they are not connected | Email provider |
| Service worker | Deliberately omitted to avoid stale-deploy bugs | Optional |

---

## Tests Added

`src/test/audit-regressions.test.ts` — 33 guards.

Every guard was **mutation-proven**: the defect was reintroduced and the suite
was required to go red. Seven mutations were planted at once and all seven were
caught. Two guards initially failed to fire and were rewritten:

- The distribution guard banned the old literal, so replacing the arithmetic
  with any *other* fixed date still passed. It now asserts the date derives from
  `now.getMonth() + 1`.
- The login guard banned the exact syntax `persona ?? personas[0]`, which a
  differently-written fallback bypassed. It now asserts the invariant: an early
  return when the lookup finds nothing, and every `signInAs` call fed the
  persona that was looked up.

A third guard needed the probe fixed rather than the guard: `String.replace`
replaces one occurrence, and the yield recomputation appears twice, so removing
the edit path left the create path satisfying the assertion. The probe now
replaces all occurrences.

`src/test/pwa.test.ts` — manifest installability, icon pixel dimensions read
from PNG IHDR, and theme-colour drift against `SITE`.

---

## Final Verification

- [x] Production build passes
- [x] Type check passes (0 errors)
- [x] Lint passes (0 errors; 13 pre-existing `react-refresh` warnings)
- [x] Automated tests pass (81 across 8 files)
- [x] Critical user flows tested in production
- [x] No console errors on any route
- [x] No broken routes
- [x] No dead buttons
- [x] Forms validate correctly
- [x] Permissions verified (signed-out deep links, investor→admin, admin→investor)
- [x] Mobile verified (320, 375, 414)
- [x] Tablet verified (768)
- [x] Desktop verified (1024, 1280, 1440, 1920)
- [x] Branding consistency verified

### RBAC matrix

| From | To | Result |
|---|---|---|
| Signed out | `/app`, `/admin` | Redirects to `/login` |
| Investor | `/admin` | Redirects to `/app` |
| Admin | `/app` | Allowed; retains admin navigation |
| Investor | admin sidebar | Only investor links render |
| Admin | investor sidebar | Only admin links render |

Route protection is client-side, which is the only option while the session
lives in `localStorage`. Moving to a real provider must move this check server-side.