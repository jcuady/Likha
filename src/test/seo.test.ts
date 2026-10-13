import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SITE, absoluteUrl } from "@/lib/site";
import { listings, publicListings } from "@/lib/marketplace";
import {
  organizationSchema,
  buildHomeSchema,
  marketplaceSchema,
  buildPropertySchema,
} from "@/lib/seo-schemas";

/**
 * sitemap.xml and robots.txt are static files, so unlike the route heads they
 * cannot read SITE. These tests are the join between the two: if the domain
 * changes or a listing is added, published or retired, they fail instead of
 * letting the sitemap quietly go stale.
 */
const readPublic = (file: string) => readFileSync(join(process.cwd(), "public", file), "utf8");

const sitemapLocs = () =>
  [...readPublic("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");

/** Routes whose route heads set a noindex robots directive. */
const NOINDEX_ROUTES = ["/login", "/app", "/admin"];

describe("SEO plumbing", () => {
  it("points robots.txt at the sitemap on the configured origin", () => {
    const robots = readPublic("robots.txt");
    expect(robots).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
    // A sitemap whose origin differs from the canonical origin splits ranking
    // signals across two hosts, so the test pins them together.
    for (const loc of sitemapLocs()) {
      expect(loc.startsWith(`${SITE.url}/`)).toBe(true);
    }
  });

  it("keeps the sitemap free of duplicate locations", () => {
    const locs = sitemapLocs();
    expect(new Set(locs).size).toBe(locs.length);
  });

  it("lists every indexable page and every public listing, and nothing else", () => {
    const expected = new Set([
      absoluteUrl("/"),
      absoluteUrl("/marketplace"),
      absoluteUrl("/signup"),
      ...publicListings.map((listing) => absoluteUrl(`/properties/${listing.id}`)),
    ]);
    expect(new Set(sitemapLocs())).toEqual(expected);
  });

  it("never lists a noindex route", () => {
    // A sitemap is an explicit invitation to crawl. Listing a page that also
    // asks not to be indexed makes the two signals contradict each other.
    const joined = sitemapLocs().join(" ");
    for (const route of NOINDEX_ROUTES) {
      expect(joined).not.toContain(`${SITE.url}${route}/`);
      expect(joined).not.toContain(`${SITE.url}${route}`);
    }
  });

  it("disallows the private surfaces in robots.txt", () => {
    const robots = readPublic("robots.txt");
    for (const route of NOINDEX_ROUTES) {
      expect(robots).toContain(`Disallow: ${route}`);
    }
  });

  it("ships the social card the meta tags promise", () => {
    // og:image pointing at a missing file is a silent failure: the markup is
    // valid, the card simply never renders anywhere it is shared.
    expect(SITE.ogImage.startsWith("/")).toBe(true);
    expect(existsSync(join(process.cwd(), "public", SITE.ogImage))).toBe(true);
  });

  it("keeps the structured data honest about a preview build", () => {
    // No invented proof points. AggregateRating and review counts are the
    // classic way to earn a rich result dishonestly, so their absence is a
    // deliberate, guarded property rather than an oversight. Asserted on the
    // serialised output, not on source text, which would match this comment.
    const sample = publicListings[0];
    if (!sample) throw new Error("expected at least one public listing");
    const payloads = [
      organizationSchema,
      buildHomeSchema(publicListings.slice(0, 4), publicListings.length),
      marketplaceSchema(publicListings),
      buildPropertySchema(sample),
    ];
    for (const payload of payloads) {
      const json = JSON.stringify(payload);
      expect(json).not.toContain("AggregateRating");
      expect(json).not.toMatch(/reviewCount|ratingValue|numberOfReviews/);
      expect(JSON.parse(json)).toBeTruthy();
    }
  });

  it("gives every structured-data payload a schema.org context", () => {
    const sample = publicListings[0];
    if (!sample) throw new Error("expected at least one public listing");
    expect(organizationSchema["@context"]).toBe("https://schema.org");
    expect(buildHomeSchema([], 0)["@context"]).toBe("https://schema.org");
    expect(marketplaceSchema([])["@context"]).toBe("https://schema.org");
    expect(buildPropertySchema(sample)["@context"]).toBe("https://schema.org");
  });

  it("never marks a draft listing up for search", () => {
    // publicListings already excludes drafts; the guard is that a draft must
    // not become structured data either, which is how it once leaked onto the
    // marketplace grid.
    const drafts = listings.filter((listing) => listing.status === "Draft");
    for (const draft of drafts) {
      expect(publicListings.some((l) => l.id === draft.id)).toBe(false);
      const locs = sitemapLocs().join(" ");
      expect(locs).not.toContain(`/properties/${draft.id}`);
    }
  });
});
