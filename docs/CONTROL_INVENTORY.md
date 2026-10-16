# Control Inventory

Every interactive control in Likha, enumerated per route. A control that is not
listed here was not verified, and therefore cannot be reported as working.

Status legend: `OK` = handler connected and correct action observed ·
`FIXED` = was broken, fixed this run · `N/A-static` = informational, no handler
by design · `INFO` = honest "not connected yet" affordance.

---

## `/` — Landing (PublicPage)

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 1 | Home / Features / About / Contact | nav links | anchor scroll | OK |
| 2 | Logo | link | `/` | OK |
| 3 | "Start investing now ↗" (×2) | button | opens WaitlistDialog | OK |
| 4 | How-it-works tabs | tablist | swaps panel + scroll | OK |
| 5 | Property card → detail | link | `/properties/$id` | OK |
| 6 | Carousel arrows | buttons | cycle slides | OK |
| 7 | Carousel dots | buttons | jump to slide | OK |
| 8 | Property modal trigger | button | opens dialog | OK |
| 9 | Modal close / Escape / outside | — | closes | OK |
| 10 | App store buttons (iOS, Android) | buttons | INFO dialog, no dead link | OK |
| 11 | Footer links | buttons/links | INFO dialog | OK |
| 12 | Social links | links | INFO dialog | OK |

## `/marketplace` — Public marketplace

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 13 | Search listings | input | `q`, narrows | OK |
| 14 | Clear search (×) | button | resets `q` | OK |
| 15 | City select | select | `city`, narrows | OK |
| 16 | Type select | select | `type`, narrows | OK |
| 17 | Status select | select | `status`, narrows | OK |
| 18 | Availability radios | radio group | `status` fallback | OK |
| 19 | Min yield slider | slider | `minYield`, arrow-key operable | OK |
| 20 | Sort select | select | `sort` | OK |
| 21 | Reset filters | button | restores `defaultQuery` | OK |
| 22 | Listing card → detail | link | `/properties/$id` | OK |
| 23 | Save to watchlist (★) | toggle button | watchlist store | OK |
| 24 | Featured badge link | link | filtered view | OK |

## `/properties/$id` — Listing detail

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 25 | Back to marketplace | link | `/marketplace` | OK |
| 26 | Share this listing | button | copies URL / INFO | OK |
| 27 | Overview / Numbers / Amenities | tabs | switch panel | OK |
| 28 | Invest from ₱X | button | opens InvestDialog | OK |
| 29 | Fully subscribed (0 units) | button | disabled state, explanatory copy | OK |
| 30 | Similar property cards | links | `/properties/$id` | OK |
| 31 | Save (★) | toggle | watchlist store | OK |
| 32 | InvestDialog slider | slider | explicit `aria-label` on the thumb, arrow-key | FIXED |
| 33 | InvestDialog Cancel | button | closes | OK |
| 34 | InvestDialog Confirm ₱X | button | configure → confirming → done | FIXED |
| 35 | InvestDialog Done | button | closes | OK |

## `/login` — Auth

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 36 | Three persona cards | buttons | one-click sign-in | OK |
| 37 | Email input | input | zod validation | OK |
| 38 | Password input | input | zod validation, min 8 | OK |
| 39 | Show / hide password | toggle button | flips input type | OK |
| 40 | Forgot password | button | INFO toast | OK |
| 41 | Keep me signed in | checkbox | **now selects sessionStorage** | FIXED |
| 42 | Sign in | submit | rejects unknown addresses | FIXED |
| 43 | Create an account link | link | `/signup` | OK |

## `/signup` — Auth

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 44 | Full name | input | zod min 2 | OK |
| 45 | Email | input | zod email | OK |
| 46 | Password | input | zod 8+ letter + number | OK |
| 47 | Show / hide password | toggle | flips type | OK |
| 48 | Terms checkbox | checkbox | required refine | OK |
| 49 | Create account | submit | **investor only, demo disclosure** | FIXED |
| 50 | Sign in link | link | `/login` | OK |
| 51 | Role radios | — | **removed (P0 privilege escalation)** | FIXED |

## `/app` — Investor overview

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 52 | Browse listings | button | `/marketplace` | OK |
| 53 | Holdings table → detail | links | `/properties/$id` | OK |
| 54 | All statements | link | `/app/statements` | OK |
| 55 | See payout history | link | `/app/statements` | OK |

## `/app/portfolio`

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 56 | Value / Income / Holdings tabs | tabs | switch panel | OK |
| 57 | Holdings row → detail | links | `/properties/$id` | OK |
| 58 | Export | button | INFO (document storage) | OK |

## `/app/watchlist`

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 59 | Save (★) on cards | toggles | watchlist store | OK |
| 60 | Clear all | button | **now confirms first** | FIXED |
| 61 | Browse listings | button | `/marketplace` | OK |

## `/app/statements`

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 62 | Download PDF | button | INFO (not connected) | OK |
| 63 | All / Distribution / Investment / Refund | segmented buttons | filters rows | OK |

## Shared app chrome (`AppShell` + `AppSidebar`, all `/app/*` and `/admin/*`)

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 64 | Logo | link | `/` | OK |
| 65 | Sidebar nav links | links | role-scoped sets | OK |
| 66 | Browse listings | link | `/marketplace` | OK |
| 67 | Sidebar toggle | button | collapse/expand | OK |
| 68 | Sidebar rail | button | expand on hover | OK |
| 69 | Header search | form | **now a real search → `/marketplace?q=`** | FIXED |
| 70 | Browse (mobile) | button | `/marketplace` | FIXED |
| 71 | Help | link | `/` | OK |
| 72 | Notifications bell | — | **removed, claimed 2 unread that never existed** | FIXED |
| 73 | Account menu trigger | button | opens dropdown | OK |
| 74 | Investor account | menu item | `/app` | OK |
| 75 | Admin workspace | menu item | `/admin` (guarded) | OK |
| 76 | Sign out | menu item | clears both storages | OK |

## `/admin` — Operations overview

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 77 | Review queue links | links | `/admin/listings` | OK |
| 78 | Recent listing rows | links | `/properties/$id` | OK |

## `/admin/listings`

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 79 | New listing | button | opens create dialog | OK |
| 80 | Search listings | input | narrows rows | OK |
| 81 | Status filter | select | narrows rows | OK |
| 82 | Row actions (⋯) | dropdown trigger | opens menu | OK |
| 83 | Edit details | menu item | opens edit dialog | OK |
| 84 | View public page | menu item | `/properties/$id` | OK |
| 85 | Publish | menu item | disabled unless Draft | OK |
| 86 | Unpublish | menu item | disabled if Draft | OK |
| 87 | Remove | menu item | **now confirms, names the row** | FIXED |
| 88 | Dialog name / price / rent | inputs | validated > 0 | OK |
| 89 | Dialog status | select | Draft / Available / … | OK |
| 90 | Live yield preview | derived | recomputes as you type | OK |
| 91 | Create listing | submit | validates, adds, recomputes yield | FIXED |
| 92 | Save changes | submit | validates, recomputes yield | FIXED |

## `/admin/investors`

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 93 | Add investor | button | opens dialog | OK |
| 94 | Search investors | input | narrows rows | OK |
| 95 | Verification filter | select | narrows rows | OK |
| 96 | Verify | button | marks Verified, toast | OK |
| 97 | Clear filters (empty state) | button | resets both | OK |
| 98 | Dialog name / email | inputs | submit disabled until valid | OK |
| 99 | Add investor submit | submit | adds, **now closes the dialog** | FIXED |

## `/admin/analytics` — read-only

| # | Control | Type | Handler | Status |
|---|---|---|---|---|
| 100 | No interactive controls | — | presentation only | N/A-static |

---

## Summary

- **100 control rows** enumerated across 13 routes, plus shared app chrome.
- **14 fixed** this run, two of them the P0 signup role selector and the P1 login identity.
- **0 dead controls** remaining: no `onClick={() => {}}`, no `href="#"`, no handler that
  does nothing.
- **0 decorative controls** that look actionable but are not: the removed bell and the
  hidden `DialogTrigger` were the only two.