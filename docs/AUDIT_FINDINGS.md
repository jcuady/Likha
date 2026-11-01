# Likha — Audit Findings

**Source:** `docs/SYSTEM_AUDIT.md` (audit of 2026-10-15, started at `69a8278`), re-verified
2026-10-25 against the measured HEAD `31abce6`.
**Narrative + full repro/verification:** `docs/SYSTEM_AUDIT.md` — this file is the index.
**Severity:** P0 data loss / auth bypass / primary workflow impossible · P1 real feature broken
· P2 degraded or inconsistent · P3 polish.

---

## Scope of the register

This file indexes the **27 defect rows** of `docs/SYSTEM_AUDIT.md`'s six tables. Every row
carries the section it came from, so the counts below are counted from these rows rather
than typed.

**Two tallies of the same audit live in this repository, and they count different things.**

| Tally | Source | Count | What it counts |
|---|---|---|---|
| Severity-tagged defects | `docs/CHANGELOG.md` § *System audit closed* | 19 | the audit-closure run's severity-tagged entries — one changelog entry per defect (2 P0, 6 P1, 11 P2) |
| Defect rows | `docs/SYSTEM_AUDIT.md`'s six tables | 27 | the rows of the narrative audit's tables, indexed here |

`docs/FINISH_STATUS.md` quotes the **19**. The two lists overlap but are not the same
list: rows #5, #16 and #17 are second rows for a defect that is listed twice, and the
changelog carries entries the narrative's tables do not. Neither number is wrong.
Quoting one while calling it the other was finding **#30** — and the wrong
identification was the tempting one, because the narrative's Critical + Functional +
Validation tables also happen to total nineteen.

| Section | Defect rows | Severity assigned |
|---|---|---|
| Critical | 4 | 2 × P0, 2 × P1 |
| Functional | 10 | 5 × P1, 5 × P2 |
| Validation | 5 | 1 × P0, 1 × P1, 3 × P2 |
| Responsive | 3 | 3 × P2 |
| Accessibility | 4 | 4 × P2 |
| Security headers | 1 | 1 × P2 |
| **Total rows** | **27** | 3 × P0, 8 × P1, 16 × P2 |

**Where a row's severity comes from.** The audit's own, taken from `docs/CHANGELOG.md`
where the changelog states one, and P2 where it does not. Rows #5, #16 and #17 carry the
severity of a defect that appears twice, which is one of the reasons the row counts and
the changelog's defect counts differ.

---

## Register — all 27 rows, with status

| # | Sev | Section | Area | Defect | Location | Status |
|---|---|---|---|---|---|---|
| 1 | **P0** | Critical | Auth / RBAC | Sign-up offered an `admin` role, so a public signup page could mint an administrator session and land on the operations workspace | `/signup` role radios | **Fixed** — role removed from schema and UI |
| 2 | **P0** | Critical | Availability | `const stores = [window.localStorage, window.sessionStorage]` at module scope evaluated during SSR → **HTTP 500 on every route**. Introduced by the audit's own fix | `src/lib/auth.tsx` module scope | **Fixed at the root** — caught in production |
| 3 | **P1** | Critical | Data integrity | Login fell back to `personas[0]`, so any address plus any 8-character password silently signed the visitor in as a different named person | `src/lib/auth.tsx` | **Fixed** — unknown address rejected, no session created |
| 4 | **P1** | Critical | Data integrity | Sidebar badges were literals (`"3"` watchlist, `"8"` listings) that no mutation could update | `src/lib/nav-config.ts` | **Fixed** — counts supplied per render from `useWatchlist()` / `useAdminData()` |
| 5 | **P1** | Functional | Sidebar | Badge read `3` over an empty watchlist; read `8` after creating a 9th listing | `nav-config.ts` | **Fixed** — same defect as #4 |
| 6 | **P1** | Functional | `/admin/listings` | Editing price/rent left the stored `yield` stale — the table contradicted the dialog that produced it | `saveDraft` vs `commitCreate` | **Fixed** — both call `grossYield(price, rent)` |
| 7 | **P1** | Functional | `/admin/listings`, `/admin/investors` | Every edit vanished on navigation (rows lived in component `useState`) | `src/lib/admin-store.ts` (new) | **Fixed** — `useSyncExternalStore` |
| 8 | **P1** | Functional | `/admin/investors` | Dialog stayed open after a successful add | uncontrolled `<Dialog>` | **Fixed** — `open` is controlled, closes on submit |
| 9 | **P1** | Functional | `/app/statements` | Reported ₱2,964,800 invested while `/app` and `/app/portfolio` reported ₱2,109,800 for the same account | `status === "Pending"` counted as deployed | **Fixed** — both filter `Completed` |
| 10 | P2 | Functional | `/app/statements` | Card said "Across 3 properties" above a table listing four | literal; different row set | **Fixed** — counted from the settled set, labelled "settled" |
| 11 | P2 | Functional | `/admin/analytics` | Average rent and Best performer included drafts while the neighbouring card excluded them — four tiles, two universes | `admin/analytics` | **Fixed** — single `liveListings` constant |
| 12 | P2 | Functional | `/admin/analytics` | Batangas rendered a 100% bar under the caption "Share of total asset value" | bar normalised to largest city, caption to total | **Fixed** — bar divided by `totalCapital` |
| 13 | P2 | Functional | `/admin/investors` | `Add investor` disabled with no explanation on empty input | expected, undocumented | **Left as-is** — submit-state probing confirmed the rule |
| 14 | P2 | Functional | `/app` | "31 Oct / in 12 days" was already 4 days wrong and wrong in every later month | literal beside a sentence stating the real rule | **Fixed** — `DistributionCard` derives end-of-month |
| 15 | P2 | Validation | `/admin/listings` | price, rent had no `required`; an empty submit produced no visible feedback | `commitCreate` / `saveDraft` | **Fixed** — toast fires, dialog stays open |
| 16 | **P1** | Validation | `/login` | Unknown address was accepted | `signIn` | **Fixed** — same defect as #3; rejected with a message naming the three demo accounts |
| 17 | **P0** | Validation | `/signup` | Anyone could select administrator at signup | `/signup` role | **Fixed** — same fix as #1 |
| 18 | P2 | Validation | `/signup` | Toast said "Account created" when nothing was registered | `signUp` | **Fixed** — "Demo session started" + demo-build disclosure |
| 19 | P2 | Validation | `/login` | `remember` checkbox was registered, validated, rendered, and never read | `signIn` | **Fixed** — writes to `sessionStorage` when unchecked |
| 20 | P2 | Responsive | `/login`, `/signup` @320–414 | Every `Input` was 36px, under the 44px touch floor | shared `Input` / `SelectTrigger` | **Fixed** — `h-11 sm:h-9` |
| 21 | P2 | Responsive | `/marketplace` @320–414 | Search input 40px, clear button 40px, filter selects 40px, card star 36px | marketplace components | **Fixed** — each raised to 44px below `sm` |
| 22 | P2 | Responsive | `/marketplace` @320–414 | Availability radio indicators were 16px targets | radio rows | **Fixed** — row carries `min-h-11`; the visual dot stays 16px by design |
| 23 | P2 | Accessibility | `app-shell.tsx` | `aria-label="Notifications, 2 unread"` told screen-reader users about two messages that do not exist | `app-shell.tsx` | **Fixed** — bell and tooltip removed |
| 24 | P2 | Accessibility | `app-shell.tsx` | Header search was an uncontrolled input with no value, handler, or form — accepted keystrokes and discarded them | `app-shell.tsx` | **Fixed** — real `<form role="search">` → `/marketplace?q=` |
| 25 | P2 | Accessibility | `app.index.tsx` | Holdings table had 5 headers over 6 cells; income column had no header | `app.index.tsx` | **Fixed** — 6 heads over 6 cells, relabelled |
| 26 | P2 | Accessibility | `nav-config.ts` | A badge count had no accessible name tying it to its nav item | `nav-config.ts` | **Fixed** — `aria-label` added |
| 27 | P2 | Security headers | Vercel defaults left `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` unset | `vercel.json` | **Fixed** — nosniff, DENY framing, strict referrer, restrictive permissions, HSTS — all five verified on the deployed origin |

### Regression guards

`src/test/audit-regressions.test.ts` — **33 guards**, verified at 2026-10-25. The audit planted
**7 defects at once and all 7 were caught**; 2 guards were rewritten after failing to fire, and
the probe was fixed for a single-occurrence replace. That is the positive control: the
guards are known to be able to fail.

---

## New findings — re-verification of the audit's own documentation (2026-10-25)

These are **not** in `SYSTEM_AUDIT.md`. They were found by re-running the gates against the
measured HEAD and comparing the numbers the documents assert to the numbers the tooling
produces.

### #28 · The audit's own test-count figure is stated three ways and is stale in all of them — **CLOSED**
- **Severity:** P2 · **Category:** DOC
- **Location:** `docs/FINISH_STATUS.md` (ARCH-05), `docs/FINISH_STATUS.md` (TEST-01), `docs/SYSTEM_AUDIT.md` (summary)
- **Observed:**
  | Source | Claim | Measured |
  |---|---|---|
  | `FINISH_STATUS.md` ARCH-05 | previously "81 tests" | **99** |
  | `FINISH_STATUS.md` TEST-01 | previously "8 files, 84 tests" | **8 files, 99 tests** |
  | `SYSTEM_AUDIT.md` summary | previously "81 tests across 8 files" | **99** |
- **Expected:** one number, derived.
- **Why it matters:** this is *the same defect class the audit was built to catch* — "a number
  that was typed instead of derived" — and the audit said so itself: *"Eleven of the fourteen
  defects below are the same defect wearing different clothes."* The application was cleaned
  of eleven typed numbers and the audit's own documentation shipped three more, two of them
  disagreeing with each other.
- **Status:** **CLOSED (2026-10-26).** All three now carry the measured figure —
  **99 across 8 files**. `npm run audit:doc-figures` derives it from a real `vitest run`
  and checks **every document that quotes a test count** — the status document, the
  narrative audit, this register and the fix plan — so the fourth spelling cannot come
  back.

### #29 · Three different commit stamps across two documents, none of them HEAD — **CLOSED**
- **Severity:** P2 · **Category:** DOC
- **Location:** `docs/FINISH_STATUS.md` (header + ARCH-04), `docs/SYSTEM_AUDIT.md` (summary)
- **Observed:** `FINISH_STATUS.md` stamped `3fd68b3` at completion and `db21e3e` at start;
  `SYSTEM_AUDIT.md` stamped `69a8278`. The measured HEAD at the re-verification was
  **`31abce6`** ("feat: waitlist delivers to a Google Sheet, and reports what actually
  happened").
- **Two different claims were being made.** The narrative audit's stamp says which commit
  the *audit started from* — that was never meant to be HEAD. The status document's stamp
  said which commit the *verification was run against*, and that one was wrong.
- **The matrix content is current even though the stamp is not** — CTRL-12 describes the
  waitlist's `confirmed` / `sent` / `local` outcomes, which is precisely `31abce6`'s feature.
  So the header was wrong, not the content.
- **Status:** **CLOSED (2026-10-26).** `FINISH_STATUS.md` stamps the measured commit, and
  `npm run audit:doc-figures` now checks that the stamped commit exists in this repository
  and is on this branch's history. It is deliberately **not** checked against `HEAD` itself:
  the gate's own commit moves `HEAD`, and a check the gate invalidates by running it is a
  broken gate.

### #30 · The "19 severity-tagged defects" figure does not say which 19 — **CLOSED**
- **Severity:** P3 · **Category:** DOC
- **Location:** `docs/FINISH_STATUS.md` (definition-of-done condition 3)
- **Observed:** the figure was quoted with its severity split but no basis, and the split
  belongs to the **changelog's** severity-tagged entries — the narrative audit's tables have
  no severity column outside the Critical table, so their nineteen rows cannot be the source
  of a 2/6/11 split. The Critical + Functional + Validation tables also total nineteen
  (4 + 10 + 5), which is exactly why the wrong identification looked right.
- **Status:** **CLOSED (2026-10-26).** `FINISH_STATUS.md` names the changelog's tally and
  states that the two lists are different lists. `npm run audit:doc-figures` counts the
  changelog's severity-tagged entries and checks the quoted total and split against them,
  and separately checks the register's own row count, its rows per section and its
  severity tally.

---

## Counts

| Severity | Rows | Open |
|---|---|---|
| P0 | 3 | 0 |
| P1 | 8 | 0 |
| P2 | 16 | 0 |
| P3 | 0 | 0 |
| **Total** | **27** | **0** |

All 27 application defect rows are closed — 26 fixed with a regression guard, and row #13
confirmed as expected behaviour that needed documenting rather than fixing. The changelog's
P3 cleanup batch and its overlay defect are changelog entries rather than rows of the
narrative's tables, so they do not appear here. The three findings above were in the audit's
own documentation, not in the product, and all three are closed.
