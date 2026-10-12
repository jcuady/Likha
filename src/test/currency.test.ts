import { describe, expect, it } from "vitest";
import { formatPHP } from "@/lib/currency";
import { listings, PLAUSIBLE_RENT } from "@/lib/likha-content";

describe("Philippine peso currency", () => {
  it("denominates monetary amounts in Philippine pesos, including financial visuals", () => {
    expect(formatPHP(85000)).toBe("₱85,000");
    expect(formatPHP(96437)).toBe("₱96,437");
    expect(formatPHP(1284500)).toBe("₱1,284,500");
    expect(formatPHP(242491)).toBe("₱242,491");
    expect(formatPHP(9200000)).toBe("₱9,200,000");
  });

  it("keeps every listing rent inside a believable Metro Manila band", () => {
    // Regression guard. A previous revision stored USD-magnitude rents
    // (3,600 / 4,800) and only changed the currency symbol, so the page
    // advertised a Brooklyn three-bedroom at roughly sixty dollars a month.
    for (const listing of listings) {
      expect(
        listing.rent,
        `${listing.name} in ${listing.location} is outside the plausible rent band`,
      ).toBeGreaterThanOrEqual(PLAUSIBLE_RENT.low);
      expect(
        listing.rent,
        `${listing.name} in ${listing.location} is outside the plausible rent band`,
      ).toBeLessThanOrEqual(PLAUSIBLE_RENT.high);
    }
  });

  it("gives every listing its own photograph key", () => {
    const keys = listings.map((listing) => listing.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
