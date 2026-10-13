import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { compactPHP } from "@/components/app/charts";
import {
  adminBatchStats,
  batchStats,
  listings,
  meanAvailability,
  publicCityCounts,
  publicListings,
} from "@/lib/marketplace";

/**
 * Two defects this file exists to prevent, both found by reading the rendered
 * DOM rather than the source.
 *
 * 1. `compactPHP` built its compact labels with a peso sign that had been
 *    mangled by a UTF-8 -> Windows-1252 round trip. The chart rendered
 *    "â‚±1.2M" on the investor dashboard while every other peso sign on the
 *    page was correct, because only this function used a literal and
 *    `formatPHP` goes through Intl.
 * 2. The marketplace filter labelled its city options from a count that
 *    included drafts, so it offered "Batangas (2)" and then rendered one row.
 */

const PESO = "\u20B1";
const MIDDOT = "\u00B7";
const EMDASH = "\u2014";

/** The signature of UTF-8 bytes decoded as Windows-1252, whatever the character. */
const MOJIBAKE = /[\u00C2\u00C3][\u0080-\u00FF]|[\u00E2][\u0080-\u00FF]|[\u00E3][\u0080-\u00FF]/;

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if ([".ts", ".tsx", ".css"].includes(extname(path))) out.push(path);
  }
  return out;
};

describe("peso formatting", () => {
  it("prefixes compact axis labels with a real peso sign", () => {
    expect(compactPHP(0)).toBe(`${PESO}0`);
    expect(compactPHP(600_000)).toBe(`${PESO}600k`);
    expect(compactPHP(1_200_000)).toBe(`${PESO}1.2M`);
    expect(compactPHP(2_450_000)).toBe(`${PESO}2.5M`);
    expect(compactPHP(-1_200_000)).toBe(`${PESO}-1.2M`);
  });

  it("never emits mojibake, whatever the magnitude", () => {
    for (const value of [0, 999, 1_000, 12_500, 600_000, 1_200_000, 18_000_000]) {
      const label = compactPHP(value);
      expect(MOJIBAKE.test(label), `${label} contains a mis-decoded character`).toBe(false);
      expect(label.startsWith(PESO), `${label} does not start with U+20B1`).toBe(true);
    }
  });

  it("keeps the peso literal ASCII-escaped so an editor cannot corrupt it", () => {
    // The literal is written `\u20b1` rather than as a raw character precisely
    // because a raw one got mangled once already. Assert the escape survives.
    const source = readFileSync(join(process.cwd(), "src/components/app/charts.tsx"), "utf8");
    expect(source).toContain("\\u20b1");
    expect(source).not.toContain(PESO);
  });
});

describe("source encoding", () => {
  it("contains no UTF-8-as-Windows-1252 mojibake anywhere in src", () => {
    const offenders: string[] = [];
    for (const file of walk(join(process.cwd(), "src"))) {
      const text = readFileSync(file, "utf8");
      text.split(/\r?\n/).forEach((line, i) => {
        if (MOJIBAKE.test(line)) {
          offenders.push(`${file}:${i + 1} ${line.trim().slice(0, 80)}`);
        }
      });
    }
    expect(offenders, `mojibake in source:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("uses the correct typographic characters where they are intended", () => {
    // Guards the two one-off repairs: a middot separator in the admin listing
    // table and an em dash as the analytics fallback when there is no listing.
    const adminIndex = readFileSync(join(process.cwd(), "src/routes/admin.index.tsx"), "utf8");
    const analytics = readFileSync(join(process.cwd(), "src/routes/admin.analytics.tsx"), "utf8");
    expect(adminIndex).toContain(`{listing.location} ${MIDDOT} `);
    expect(analytics).toContain(`"${EMDASH}"`);
  });
});

describe("public filter counts", () => {
  it("counts only listings the public grid can actually show", () => {
    const total = Object.values(publicCityCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(publicListings.length);
  });

  it("never advertises a city whose only listings are drafts", () => {
    const draftOnlyCities = new Set(
      listings
        .filter((l) => l.status === "Draft")
        .map((l) => l.city)
        .filter((city) => !publicListings.some((l) => l.city === city)),
    );
    for (const city of Object.keys(publicCityCounts)) {
      expect(draftOnlyCities.has(city), `${city} is only visible because of a draft`).toBe(false);
    }
  });

  it("matches the real count for every city it lists", () => {
    for (const [city, count] of Object.entries(publicCityCounts)) {
      const actual = publicListings.filter((l) => l.city === city).length;
      expect(count, `${city} claims ${count} but the grid can show ${actual}`).toBe(actual);
    }
  });
});

describe("availability is a mean, never a sum of percentages", () => {
  // This defect shipped twice: once on the marketplace and again, unnoticed,
  // on /admin/listings. The invariant is not any particular number, it is that
  // a percentage over a set of items cannot leave 0-100.
  it("stays inside 0-100 for every real subset of listings", () => {
    for (const set of [
      listings,
      publicListings,
      listings.filter((l) => l.city === "Makati"),
      listings.filter((l) => l.status === "Available"),
      listings.slice(0, 1),
    ]) {
      const value = meanAvailability(set);
      expect(value, `mean over ${set.length} listings`).toBeGreaterThanOrEqual(0);
      expect(value, `mean over ${set.length} listings`).toBeLessThanOrEqual(100);
    }
  });

  it("returns 0 rather than NaN for an empty set", () => {
    expect(meanAvailability([])).toBe(0);
  });

  it("would fail loudly if anyone sums instead of averaging", () => {
    const naiveSum = publicListings.reduce((sum, l) => sum + l.available, 0);
    // Documents why the guard above is the one that matters.
    expect(naiveSum).toBeGreaterThan(100);
    expect(meanAvailability(publicListings)).toBeLessThanOrEqual(100);
  });
});

describe("admin and public report different universes, deliberately", () => {
  it("gives the admin workspace every listing, drafts included", () => {
    // The admin dashboard reads its capital and units-open cards from
    // adminBatchStats while the sidebar, city donut and listing count all read
    // listings.length. Mixing the two made one screen report the portfolio as
    // both 8 and 7 with nothing to reconcile them.
    expect(adminBatchStats.total).toBe(listings.length);
  });

  it("keeps the public batch statistics to the listings a visitor can open", () => {
    expect(batchStats.total).toBe(publicListings.length);
    expect(batchStats.total).toBeLessThan(adminBatchStats.total);
  });
});
