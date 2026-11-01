# Likha — Fix Plan

Derived from `docs/AUDIT_FINDINGS.md` and `docs/FINISH_STATUS.md`.
Ordered by what unblocks the most work first.

**Context:** all 27 application defects are fixed and guarded. What remains is
**three open findings in the audit's own documentation**, the **deferred** rows, and the
**method** that let typed numbers reach the documents in the first place.

---

## Slice 1 — close the three open findings (do first; they are small) — ✅ DONE (2026-10-26)

| # | Action | Where |
|---|---|---|
| #29 | Correct the commit stamp to the measured HEAD, and record *why* the old stamp was wrong (the content described `31abce6`; the header did not) | `docs/FINISH_STATUS.md` header + ARCH-04; `docs/SYSTEM_AUDIT.md` summary |
| #28 | Reconcile the test count to one derived figure. `ARCH-05` said 81, `TEST-01` said 84, `SYSTEM_AUDIT.md` said 81; the measured value is **99 across 8 files**. State the counting basis once and reference it. | `docs/FINISH_STATUS.md` ARCH-05 and TEST-01; `docs/SYSTEM_AUDIT.md` summary |
| #30 | State which 19 the "19 severity-tagged defects" figure counts, and state the register's own row count beside it. | `docs/FINISH_STATUS.md` condition 3; `docs/AUDIT_FINDINGS.md` "Scope of the register" |

**Exit criterion:** every commit stamp and every count in the docs matches a number a
command produced, and no two documents state different values for the same thing.

**Met.** All three findings are closed and recorded as such in `docs/AUDIT_FINDINGS.md`.
One correction to the plan above: **the 19 is the changelog's severity-tagged tally, not
the Critical + Functional + Validation rows.** Those rows also total nineteen, which is
what made the wrong identification look right — the narrative's tables carry no severity
column outside the Critical table, so they cannot be the source of a 2/6/11 split. Slice 2's
gate now counts both tallies from their own sources so neither can be quoted while calling
it the other.

---

## Slice 2 — make the numbers derived, not typed (the method fix)

**This is the actual fix.** Slice 1 corrects three numbers; Slice 2 removes the class.

The audit's own words: *"Eleven of the fourteen defects below are the same defect wearing
different clothes: **a number that was typed instead of derived.**"* The application was
cleaned of eleven typed numbers — and then the documentation shipped three more.

Add a gate that reads the matrix and the repo and fails when they disagree. It should assert:

1. **Test count** in every document that quotes one === the count `vitest run` reports
2. **Commit stamp** in `FINISH_STATUS.md` === a commit that exists on this branch's
   history — *not* `HEAD` itself, because the gate's own commit moves `HEAD` and a check
   the gate invalidates by running it is a broken gate
3. **Row census** in `FINISH_STATUS.md` === the count of status cells in its own tables,
   derived twice by two independent methods
4. **Defect counts** in `FINISH_STATUS.md` and `AUDIT_FINDINGS.md` === the register's own
   rows, its rows per section and its severity tally
5. **Severity-tagged tally** in `FINISH_STATUS.md` === the changelog's own entries, so the
   two tallies of the audit can never be quoted as each other

**This pattern already exists in two sibling projects in this portfolio — copy it, do not
invent it:**

| Pattern | Where | What it does |
|---|---|---|
| `check-doc-claims.cjs` | TukoApp | Parses *"the headline figures above"* and recounts them from the matrix's own status cells |
| `docs-claims-drift.mjs` (+ its negative control) | BITS | Detects a doc figure that disagrees with the measured value, and proves it can fail |
| `audit-doc-figures.mjs` | BeepoBeepa | Derives each figure from its source, then checks the current-state sections agree |

**Exit criterion:** the new gate is in the test script, and it has a negative control that
demonstrates it fires on a planted mismatch.

### ✅ DONE (2026-10-26) — `scripts/audit-doc-figures.mjs`

`npm run audit:doc-figures` is wired, and `npm run verify` now runs
`lint → test → build → audit:doc-figures`.

**It was built because the defect was still present in this repository.** The status
document's row census said *"138 status rows → 128 `DONE`, 3 `DEFERRED`, 7 `N/A`"* and
claimed to be *"counted from the tables, not estimated"*. The matrix has carried **114 status
rows (104 `DONE`, 3 `DEFERRED`, 7 `N/A`)** since it was committed at `31abce6` — verified
against the committed version, so the total and the `DONE` count were wrong from the start.
Three things make the count hard to read, and each of them has a trap in it:

- The **16 rows of the RBAC capability table** have a role set (`public`, `admin`,
  `investor,admin`, `all`, `app+admin`) where a status belongs, so they are not status rows.
- The **two range rows** — `API-01..11` and `DB-01..11` — are one line each but stand for
  eleven requirements apiece, so counting lines and counting requirements disagree. The matrix
  therefore describes **134 individual requirements across 114 status rows**.
- A row's **ID prefix may contain digits** (`A11Y-01`) and its **status may be bolded**
  (`**FAIL**`). A pattern that misses either drops rows **silently**.

**A note on how this was nearly got wrong twice.** The first counter used `[A-Z]+-\d+` and a
bare-status pattern, so it dropped the nine `A11Y-` rows and reported 103 — and the gate
built on that counter agreed with the document, because **a gate that derives its expectation
from the same document it checks can only find inconsistency, never error.** The fix was to
derive the census **twice, by two independent methods** — one by the ID+status pattern, one by
counting table rows by shape with no assumption about what an ID looks like — and fail when
they disagree. The pattern was then corrected to allow digit prefixes, bolded statuses and
range IDs, which moved the count to 114.

**A number that claims to be counted and was not.** The census sentence is now correct and the
gate re-derives it on every run.

**Proven able to fail:** the gate ships its own negative control.
`npm run audit:doc-figures -- --self-test` plants the old 138/128/7 census in a temporary
copy of the status document — the repository's own files are never touched — and requires
the gate to go red on it and name the mismatch (exit 1). The "historical claim" rule is
deliberate: a figure is allowed to differ only when it is explicitly marked as the old
value ("was 138 rows"). A figure that merely carries a date is a **current** claim that
happens to say when it was measured — and still has to be right. That distinction is the
whole gate.

**What the gate checks beyond the census.** The test count in every document that quotes
one; the commit stamp against the repository's own history; the register's rows, its rows
per narrative section and its severity tally; and the changelog's severity-tagged tally
against the split the status document quotes. Each figure is counted from the source that
owns it, so no document has to be trusted for its own arithmetic.

---

## Slice 3 — the deferred rows, with their revisit triggers (unchanged, restated)

These are **not** defects in the current build. Each is blocked on a backend that does not
exist yet. They are listed so the backlog is complete, not as work to start now.

| Row | Deferred because | Revisit when |
|---|---|---|
| CTRL-11 · RBAC-04 | Route protection is **client-side only** — the session lives in web storage, so there is no server-side session to enforce against | A real auth provider lands (the five swap points are documented in `docs/ARCHITECTURE.md`) |
| RBAC-06 | All accounts share one demo profile, so account-scoped ownership has nothing to scope against | The database lands and accounts become distinct |
| CRUD restore / export / import | Not advertised in the UI; the PDF button already explains it is not connected | Only if it is stated as a feature |

**Note the shape of CTRL-11 and RBAC-04: they are one gap recorded as two rows.** When the
database arrives, close them together or the count will be wrong again.

---

## Slice 4 — the missing-features table, re-checked on landing a backend

`SYSTEM_AUDIT.md` lists five behaviours that do not exist yet. All are honest in the UI
(each states that it is not connected), which is why they are not defects.

| Area | Missing | Priority when the backend lands |
|---|---|---|
| Admin mutations | In-memory only; a full page reload resets them | High — move `src/lib/admin-store.ts` to the database |
| Waitlist | **Landed** at `31abce6` — writes to a Google Sheet and reports `confirmed` / `sent` / `local` | Done — re-check that `sent` stays distinguishable from an unreadable response |
| PDF export | Button explains it is not connected | Medium — needs document storage |
| Email delivery | Sign-up and investor invites state they are not connected | Medium — needs an email provider |
| Service worker | Deliberately omitted to avoid stale-deploy bugs | Low — optional |

**Note:** the waitlist row was already stale in `SYSTEM_AUDIT.md` — it still described the
pre-`31abce6` `localStorage` behaviour when the feature had already shipped to a Google
Sheet. That is finding #29's cousin: a status row describing a state the code has left
behind.

---

## Slice 5 — the standing verification cadence

The matrix claims 100% against a tree that has since moved. Re-derive rather than re-read.

| Trigger | Action |
|---|---|
| Any change to `src/`, `package.json`, or the test suite | Re-run `lint`, `tsc --noEmit`, `vitest run`, `vite build`; update the test count in `FINISH_STATUS.md` |
| Any new commit | Update the header stamp; the matrix describes a tree, and a tree moves |
| Before quoting any percentage | Re-count the matrix's status cells. **Do not quote the headline** — recount it |
| Before claiming a defect is fixed | Confirm the guard fires (the audit's discipline: 7 defects planted, 7 caught) |

---

## Explicitly out of scope

- **Adding a backend.** Not this project's job yet; the swap points are documented.
- **Rewriting the 33 guards.** They are the evidence that the fixes hold. They were proven
  able to fail — 2 were rewritten after failing to fire.
- **Chasing the 13 eslint react-refresh warnings.** They are warnings on a deliberate
  pattern (a file exporting both a component and a hook) and were present at the baseline.
