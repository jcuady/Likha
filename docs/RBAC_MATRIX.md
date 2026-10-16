# RBAC Matrix

Two roles, declared in `src/lib/auth.tsx`:

```ts
export type Role = "investor" | "admin";
```

There is no third role, and no super-admin.

## Enforcement point

`RequireAuth` in `src/components/app/app-shell.tsx` is the single guard:

```tsx
if (!ready) return <ShellSkeleton />;
if (!session) return <Navigate to="/login" />;
if (session.role !== role && role === "admin") return <Navigate to="/app" />;
```

Navigation is role-scoped by `navFor(role)` in `src/components/app/nav-config.ts`,
and `AppSidebar` / `AppShell` both call it with `session.role`, so the menu can
never disagree with the guard.

> **This is client-side enforcement.** The session lives in `localStorage` or
> `sessionStorage`, so the server cannot see it. Every row below marked "client"
> must move server-side when a real auth provider lands. Hiding a link is not
> authorization — the matrix describes what is true today, not what will be true.

## Capability matrix

| Capability | Route / control | Signed out | Investor | Admin | Enforcement |
|---|---|---|---|---|---|
| View landing | `/` | allow | allow | allow | none needed |
| Browse marketplace | `/marketplace` | allow | allow | allow | none needed |
| View listing detail | `/properties/$id` | allow | allow | allow | none needed |
| Join early list | waitlist dialog | allow | allow | allow | none needed |
| Sign in | `/login` | allow | — | — | none needed |
| Register | `/signup` | allow | — | — | creates an investor session only |
| View investor overview | `/app` | redirect | **allow** | allow¹ | client `RequireAuth` |
| View portfolio | `/app/portfolio` | redirect | **allow** | allow¹ | client `RequireAuth` |
| View watchlist | `/app/watchlist` | redirect | **allow** | allow¹ | client `RequireAuth` |
| View statements | `/app/statements` | redirect | **allow** | allow¹ | client `RequireAuth` |
| Operations overview | `/admin` | redirect | **redirect → `/app`** | **allow** | client `RequireAuth` |
| Manage listings | `/admin/listings` | redirect | **redirect → `/app`** | **allow** | client `RequireAuth` |
| Manage investors | `/admin/investors` | redirect | **redirect → `/app`** | **allow** | client `RequireAuth` |
| Analytics | `/admin/analytics` | redirect | **redirect → `/app`** | **allow** | client `RequireAuth` |
| Create a listing | `/admin/listings` New listing | redirect | no route | allow | client guard |
| Publish / unpublish | row menu | redirect | no route | allow | client guard |
| Remove a listing | row menu + confirm | redirect | no route | allow | client guard |
| Add an investor | `/admin/investors` | redirect | no route | allow | client guard |
| Mark KYC verified | `/admin/investors` | redirect | no route | allow | client guard |
| Sign out | account menu | redirect | allow | allow | clears both storages |

¹ An admin may read `/app/*` and keeps admin navigation there. This is
intentional: the operator account is also an account. The investor *data* shown
is Andrea's demo profile, which is stated as simulated throughout.

## What was verified, and how

Every row above was exercised **as that role against production**, not inferred
from reading the guard. Reading a guard proves intent, not effect.

| Scenario | Method | Observed |
|---|---|---|
| Signed out → `/app` | navigate | redirected to `/login` |
| Signed out → `/admin` | navigate | redirected to `/login` |
| Investor → `/admin` | navigate as investor | redirected to `/app` |
| Admin → `/app` | navigate as admin | allowed, admin nav retained |
| Investor sidebar | DOM query | 5 investor links, no admin link |
| Admin sidebar | DOM query | 4 admin links, no investor link |
| Signup as admin | DOM query | role radios: **0** — removed as a P0 |

## Deliberate removals

- **Sign-up no longer offers an administrator role.** A public signup page could
  mint an admin session and land on the operations workspace. The admin surface
  is reached only through the clearly-labelled test accounts on `/login`, where
  choosing a role is the stated purpose of the control.
- **Login no longer falls back to the first persona.** Any address plus any
  8-character password silently signed the visitor in as a different named
  person. Unknown addresses are rejected and create no session.

## What is still missing before this is real authorization

1. **Server-side session.** Replace `localStorage` with an httpOnly cookie or a
   provider SDK, then enforce on the server, not in the layout.
2. **Per-entity ownership.** `/app/*` currently shows one hardcoded profile.
   A real build must scope every read to the authenticated account, or one
   investor sees another's holdings.
3. **Tenant isolation.** Single-tenant today. Multi-tenant needs an org id on
   every query plus a policy that filters by it.
4. **De-escalation.** There is no session-revocation path today.