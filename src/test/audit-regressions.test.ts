import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  grossYield,
  incomeSeries,
  listings,
  monthOverMonth,
  transactions,
} from "@/lib/marketplace";

/**
 * Regression guards for the full-system audit.
 *
 * Every assertion here corresponds to a defect that shipped and was found by
 * clicking the deployed app, not by reading the source. The pattern they share:
 * a number that was *typed* rather than derived, so it was correct only until
 * something moved. Typecheck, lint and the build were all green while each of
 * these was wrong, because every one of them is type-correct.
 */

const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/**
 * Source with comments stripped.
 *
 * Several guards below assert that a string no longer appears in a file — but
 * the fix for each one deliberately quotes the old string in a comment
 * explaining why it went. Searching raw source therefore matches the
 * explanation rather than the defect. Strip comments so a guard can only ever
 * match live code.
 */
const code = (p: string): string =>
  src(p)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if ([".ts", ".tsx"].includes(extname(path))) out.push(path);
  }
  return out;
};

const allSource = walk(join(process.cwd(), "src"));

describe("counts are derived, never typed", () => {
  it("nav-config declares no badge counts", () => {
    // A badge here is a literal that no store can update. The sidebar now
    // supplies counts at render time from the watchlist and the admin store.
    const nav = src("src/components/app/nav-config.ts");
    expect(nav).not.toMatch(/badge\s*:/);
    expect(nav).toContain("NavItem");
  });

  it("the sidebar reads counts from stores, not from nav-config", () => {
    const sidebar = src("src/components/app/app-sidebar.tsx");
    expect(sidebar).toContain("useWatchlist");
    expect(sidebar).toContain("useAdminData");
    // A zero badge is noise; an empty result should look empty.
    expect(sidebar).toMatch(/badge\s*\?\s*\(/);
  });

  it("statements derives its property count instead of writing one down", () => {
    const statements = src("src/routes/app.statements.tsx");
    expect(statements).not.toMatch(/Across \d+ propert/);
    expect(statements).toContain("propertyCount");
  });

  it("statements counts only the properties whose money actually settled", () => {
    const settled = transactions.filter((t) => t.status === "Completed");
    const counted = new Set(settled.map((t) => t.listingId)).size;
    const all = new Set(transactions.map((t) => t.listingId)).size;
    // The pending Urban Edge transaction is the whole difference. Counting it
    // made the card claim four properties while the card beside it, built from
    // settled rows, could only ever be about three.
    expect(all).toBe(4);
    expect(counted).toBe(3);
  });
});

describe("totals exclude money that has not moved", () => {
  it("invested total ignores pending transactions", () => {
    const all = transactions.filter((t) => t.type === "Investment");
    const naive = all.reduce((s, t) => s + Math.abs(t.amount), 0);
    const settled = all
      .filter((t) => t.status === "Completed")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    // The defect: statements reported 2,964,800 while the overview and the
    // portfolio both reported 2,109,800 for the same account.
    expect(naive).toBe(2_964_800);
    expect(settled).toBe(2_109_800);
    expect(naive).toBeGreaterThan(settled);
  });

  it("the statements page filters on status", () => {
    expect(src("src/routes/app.statements.tsx")).toContain('status === "Completed"');
  });
});

describe("derived figures track their inputs", () => {
  it("editing a listing recomputes its yield", () => {
    // The edit path patched price and rent but left the stored yield, so the
    // table contradicted the preview shown in the dialog that produced it.
    expect(src("src/routes/admin.listings.tsx")).toMatch(/yield:\s*grossYield\(price,\s*rent\)/);
    // And only one yield formula exists in the file.
    const matches = src("src/routes/admin.listings.tsx").match(
      /\(\s*rent\s*\*\s*12\s*\*\s*100\s*\)\s*\//g,
    );
    expect(matches ?? []).toHaveLength(0);
  });

  it("grossYield agrees with the stored listing figures", () => {
    for (const listing of listings) {
      expect(listing.yield).toBe(grossYield(listing.price, listing.rent));
    }
  });

  it("monthOverMonth reads the series rather than a typed number", () => {
    const mom = monthOverMonth(incomeSeries);
    expect(mom).not.toBe(6.4);
    expect(typeof mom).toBe("number");
  });

  it("monthOverMonth refuses to divide by zero or a missing point", () => {
    expect(monthOverMonth([])).toBeUndefined();
    expect(monthOverMonth([{ value: 100 }])).toBeUndefined();
    expect(monthOverMonth([{ value: 0 }, { value: 100 }])).toBeUndefined();
  });

  it("no StatCard carries a hardcoded delta", () => {
    // These rendered growth arrows next to numbers with no series behind them.
    for (const path of allSource.filter((p) => p.includes(join("routes", "")))) {
      const text = readFileSync(path, "utf8");
      expect(text, path).not.toMatch(/delta=\{\s*-?\d+(\.\d+)?\s*\}/);
    }
  });
});

describe("analytics uses one universe", () => {
  it("averages and the best performer exclude drafts", () => {
    const analytics = src("src/routes/admin.analytics.tsx");
    expect(analytics).toContain("liveListings");
    const live = listings.filter((l) => l.status !== "Draft");
    const withDrafts = listings.reduce((s, l) => s + l.rent, 0) / listings.length;
    const withoutDrafts = live.reduce((s, l) => s + l.rent, 0) / live.length;
    // The visible difference was 92,000 against 93,000.
    expect(Math.round(withDrafts)).not.toBe(Math.round(withoutDrafts));
  });

  it("capital-by-city bars are normalised to the total, not the largest city", () => {
    const analytics = src("src/routes/admin.analytics.tsx");
    expect(analytics).not.toMatch(/byCity\[0\]\?\.capital/);
  });
});

describe("destructive actions confirm first", () => {
  it("removing a listing is wrapped in an alert dialog", () => {
    const listings = src("src/routes/admin.listings.tsx");
    expect(listings).toContain("AlertDialog");
    expect(listings).toMatch(/onSelect=\{\(\) => setConfirmRemove\(listing\)\}/);
  });

  it("clearing the watchlist is wrapped in an alert dialog", () => {
    const watchlist = src("src/routes/app.watchlist.tsx");
    expect(watchlist).toContain("AlertDialog");
    expect(watchlist).toMatch(/onClick=\{\(\) => setConfirmClear\(true\)\}/);
  });
});

describe("authentication does not lie about who signed in", () => {
  it("an unknown email is rejected instead of falling back to a persona", () => {
    const login = src("src/routes/login.tsx");
    // `persona ?? personas[0]` signed anyone in as the first investor.
    expect(login).not.toMatch(/persona\s*\?\?\s*personas\[0\]/);
    expect(login).toContain("setError");
  });

  it("signup cannot mint an administrator session", () => {
    const signup = src("src/routes/signup.tsx");
    expect(signup).not.toMatch(/z\.enum\(\["investor",\s*"admin"\]\)/);
    expect(signup).not.toContain('role: "admin"');
  });

  it("signup admits that no account is created", () => {
    expect(code("src/routes/signup.tsx")).not.toContain("Account created");
    expect(src("src/routes/signup.tsx")).toContain("demonstration build");
  });

  it("keep me signed in is honoured by the store", () => {
    const login = src("src/routes/login.tsx");
    expect(login).toContain("values.remember");
    expect(src("src/lib/auth.tsx")).toContain("sessionStorage");
  });

  /**
   * True when a module reads a browser global at import time.
   *
   * Column zero is the discriminator: a top-level `const x = window.localStorage`
   * evaluates during SSR, while the same expression indented inside a function
   * body does not. Checking only for the token flagged legitimate in-function use.
   */
  const readsBrowserGlobalAtImport = (text: string): string | undefined =>
    text
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
      .split("\n")
      .find(
        (line) =>
          /^(const|let|var)\s/.test(line) && /\b(window|document|localStorage)\./.test(line),
      );

  it("auth touches no browser global at module scope", () => {
    // A module-level `const stores = [window.localStorage, ...]` evaluated during
    // SSR and took every route down with a 500: production /login returned HTTP
    // 500 while typecheck, tests, lint and build were all green.
    expect(readsBrowserGlobalAtImport(src("src/lib/auth.tsx"))).toBeUndefined();
    expect(src("src/lib/auth.tsx")).toContain('typeof window === "undefined"');
  });

  it("no module in src reads a browser global at import time", () => {
    const offenders = allSource
      .map((p) => [p, readsBrowserGlobalAtImport(readFileSync(p, "utf8"))] as const)
      .filter(([, hit]) => hit);
    expect(offenders.map(([p, hit]) => `${p}: ${hit?.trim()}`)).toEqual([]);
  });
});

describe("no control is decorative", () => {
  it("the app header search is wired to a form", () => {
    const shell = src("src/components/app/app-shell.tsx");
    expect(shell).toContain('role="search"');
    expect(shell).toContain('navigate({ to: "/marketplace"');
  });

  it("the app header makes no claim about unread notifications", () => {
    const shell = code("src/components/app/app-shell.tsx");
    expect(shell).not.toMatch(/unread/);
    expect(shell).not.toMatch(/aria-label="Notifications/);
  });

  it("every table row has as many heads as it has cells", () => {
    const index = src("src/routes/app.index.tsx");
    const headBlock = index.match(/<TableHeader>([\s\S]*?)<\/TableHeader>/);
    expect(headBlock, "no TableHeader found").toBeTruthy();
    const heads = (headBlock?.[1]?.match(/<TableHead/g) ?? []).length;
    // The holdings table shipped 5 heads over 6 cells, so the ownership
    // percentage rendered under a "Yield" heading.
    expect(heads).toBe(6);
  });

  it("the distribution card derives from today's date", () => {
    // Not "does not contain the old literal" — a mutation that replaced the
    // arithmetic with any other fixed date passed that check. Assert the date
    // is computed from the current month, which is what makes it stay correct.
    const index = code("src/routes/app.index.tsx");
    expect(index).toContain("new Date()");
    expect(index).toMatch(/now\.getMonth\(\)\s*\+\s*1/);
    expect(index).toMatch(/86_400_000/);
    expect(index).not.toMatch(/in 12 days/);
  });

  it("login never signs in without a persona that matches the typed address", () => {
    // The first version of this guard banned the literal `?? personas[0]`, which
    // a mutation bypassed by writing the same fallback differently. Assert the
    // invariant instead: every signInAs call is fed the persona that was looked
    // up, and there is an early return when the lookup found nothing.
    const login = code("src/routes/login.tsx");
    expect(login).toMatch(/personas\.find\(/);
    expect(login).toMatch(/if \(!persona\) \{[\s\S]{0,200}return;/);
    const signInCalls = [...login.matchAll(/signInAs\(([^)]*)\)/g)].map((m) => (m[1] ?? "").trim());
    expect(signInCalls.length).toBeGreaterThan(0);
    for (const arg of signInCalls) {
      // personas[0] is the fall-through that produced the wrong identity.
      expect(arg).not.toMatch(/personas\[\d\]/);
      expect(arg.startsWith("persona.")).toBe(true);
    }
  });

  it("the waitlist confirmation does not claim a place on a list", () => {
    const waitlist = code("src/components/landing/waitlist-dialog.tsx");
    expect(waitlist).not.toContain("You are on the list");
    expect(waitlist).not.toContain("We have your interest");
  });

  it("no dialog claims a review threshold the codebase does not implement", () => {
    expect(code("src/routes/admin.listings.tsx")).not.toMatch(/passes review/);
  });
});

describe("async dialogs cannot outlive their own state", () => {
  it("the invest dialog clears its pending timers on close", () => {
    const dialog = src("src/components/marketplace/invest-dialog.tsx");
    expect(dialog).toContain("clearTimeout");
    expect(dialog).toContain("useRef");
  });

  it("the waitlist submit bails out after unmount", () => {
    const waitlist = src("src/components/landing/waitlist-dialog.tsx");
    expect(waitlist).toContain("mounted.current");
  });
});
