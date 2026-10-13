import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  batchStats,
  holdings,
  incomeSeries,
  listings,
  profileFor,
  publicListings,
  shareIncome,
  EMPTY_PROFILE,
  transactions,
} from "@/lib/marketplace";

describe("marketplace data layer", () => {
  it("keeps draft listings out of the public marketplace", () => {
    // Regression guard. Drafts are internal review state; a public grid that
    // renders the full `listings` array exposes unreleased properties.
    const draftIds = listings.filter((l) => l.status === "Draft").map((l) => l.id);
    expect(draftIds.length).toBeGreaterThan(0);
    for (const id of draftIds) {
      expect(publicListings.map((l) => l.id)).not.toContain(id);
    }
  });

  it("reports availability as a mean, never as a sum of percentages", () => {
    // Regression guard. Summing `available` across the batch produced "466%
    // of units still open", a number above 100 that reads as a factual claim.
    const naiveSum = publicListings.reduce((sum, l) => sum + l.available, 0);
    expect(naiveSum).toBeGreaterThan(100);
    expect(batchStats.averageOpen).toBeGreaterThanOrEqual(0);
    expect(batchStats.averageOpen).toBeLessThanOrEqual(100);
    expect(batchStats.open).toBeLessThanOrEqual(batchStats.total);
  });

  it("counts only listings that still have availability as open", () => {
    const expected = publicListings.filter((l) => l.available > 0).length;
    expect(batchStats.open).toBe(expected);
  });

  it("keeps every listing rent inside a believable Metro Manila band", () => {
    for (const listing of listings) {
      expect(listing.rent, `${listing.name} rent`).toBeGreaterThanOrEqual(25000);
      expect(listing.rent, `${listing.name} rent`).toBeLessThanOrEqual(400000);
    }
  });

  it("keeps gross yield consistent with rent and price", () => {
    for (const listing of listings) {
      const implied = (listing.rent * 12 * 100) / listing.price;
      expect(
        Math.abs(implied - listing.yield),
        `${listing.name}: stored yield ${listing.yield}% does not follow from rent and price`,
      ).toBeLessThan(0.1);
    }
  });

  it("keeps yields inside a band PH residential property actually returns", () => {
    // Regression guard. The first pass advertised 4.1-7.2% while the underlying
    // price and rent only supported 1.8-4.4%, which is the kind of number a
    // visitor can disprove by dividing two figures on the same card.
    for (const listing of listings) {
      expect(listing.yield, `${listing.name} yield is implausibly high`).toBeLessThanOrEqual(7);
      expect(listing.yield, `${listing.name} yield is implausibly low`).toBeGreaterThanOrEqual(3);
    }
  });

  it("does not let a hand-entered yield literal back into the data", () => {
    // Resolved from the project root rather than import.meta.url: under the
    // jsdom environment import.meta.url is an http URL, not a file URL.
    const source = readFileSync(resolve(process.cwd(), "src/lib/marketplace.ts"), "utf8");
    const literal = source.match(/^\s*yield:\s*[\d.]+,?\s*$/m);
    expect(literal, "yield must stay derived, not stored").toBeNull();
  });

  it("keeps the demo investor's income series within what the holdings can earn", () => {
    const monthly = holdings.reduce((sum, h) => sum + shareIncome(h.listingId, h.share), 0);
    const last = incomeSeries[incomeSeries.length - 1];
    expect(monthly).toBeGreaterThan(0);
    expect(last).toBeDefined();
    // The series may lag a month of collections but must not exceed the full
    // monthly entitlement by more than a rounding margin.
    expect(last?.amount ?? Infinity).toBeLessThanOrEqual(Math.round(monthly * 1.1));
  });

  it("points every holding and transaction at a real listing", () => {
    const ids = new Set(listings.map((l) => l.id));
    for (const holding of holdings) expect(ids).toContain(holding.listingId);
    for (const tx of transactions) expect(ids).toContain(tx.listingId);
  });

  it("resolves an unknown account to the empty profile", () => {
    expect(profileFor("nobody@example.com")).toBe(EMPTY_PROFILE);
    expect(profileFor(undefined)).toBe(EMPTY_PROFILE);
    expect(profileFor("andrea@example.com").holdings.length).toBeGreaterThan(0);
  });

  it("reports distributions as positive and investments as negative", () => {
    for (const tx of transactions) {
      if (tx.type === "Distribution") expect(tx.amount).toBeGreaterThan(0);
      if (tx.type === "Investment") expect(tx.amount).toBeLessThan(0);
    }
  });
});
