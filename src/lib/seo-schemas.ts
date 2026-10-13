import { SITE, absoluteUrl } from "@/lib/site";
import { formatPHP } from "@/lib/currency";
import type { Listing } from "@/lib/marketplace";

/**
 * Structured data for the site, kept out of the route files so it can be
 * asserted directly in tests. Route heads serialise these into
 * <script type="application/ld+json">.
 *
 * Scope is deliberately narrow. Likha is a preview build with no live accounts
 * and no investment service behind it yet, so there is no AggregateRating, no
 * review count, no user count and no FAQPage here. Publishing a rating we have
 * not earned is the fastest way to earn a rich result and lose trust, and it
 * violates the project's own rule against fabricated statistics.
 */

export const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.png"),
        width: 512,
        height: 512,
      },
      image: absoluteUrl(SITE.ogImage),
      description: SITE.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: absoluteUrl("/"),
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en-PH",
    },
  ],
};

export const homeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/")}#webpage`,
      url: absoluteUrl("/"),
      name: SITE.title,
      description: SITE.description,
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#organization` },
      primaryImageOfPage: absoluteUrl(SITE.ogImage),
    },
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl("/")}#featured`,
      name: "Featured Likha properties",
      numberOfItems: 4,
      itemListElement: [],
    },
  ],
};

/** The homepage schema needs the live listing set, so it is built on demand. */
export const buildHomeSchema = (
  featured: readonly { id: string; name: string }[],
  total: number,
) => ({
  ...homeSchema,
  "@graph": [
    homeSchema["@graph"][0],
    {
      ...homeSchema["@graph"][1],
      numberOfItems: total,
      itemListElement: featured.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/properties/${listing.id}`),
        name: listing.name,
      })),
    },
  ],
});

/** A single property page. Marked noindex for drafts by the route head. */
export const buildPropertySchema = (listing: Listing) => {
  const url = absoluteUrl(`/properties/${listing.id}`);
  const description = `${listing.name} in ${listing.city}. ${listing.type}, ${listing.beds} bedrooms. Gross annual yield ${listing.yield.toFixed(1)}% at ${formatPHP(listing.price)} per share.`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#listing`,
    name: listing.name,
    description,
    url,
    category: "Residential property",
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "PHP",
      availability:
        listing.status === "Available"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
      url,
      seller: { "@id": `${absoluteUrl("/")}#organization` },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "City", value: listing.city },
      { "@type": "PropertyValue", name: "Location", value: listing.location },
      { "@type": "PropertyValue", name: "Property type", value: listing.type },
      { "@type": "PropertyValue", name: "Bedrooms", value: listing.beds },
      { "@type": "PropertyValue", name: "Bathrooms", value: listing.baths },
      { "@type": "PropertyValue", name: "Monthly rent", value: listing.rent },
      {
        "@type": "PropertyValue",
        name: "Gross annual yield",
        value: `${listing.yield.toFixed(1)}%`,
      },
    ],
  };
};

/** The marketplace index page. */
export const marketplaceSchema = (listings: readonly { id: string; name: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${absoluteUrl("/marketplace")}#webpage`,
  url: absoluteUrl("/marketplace"),
  name: "Metro Manila properties for fractional investment | Likha",
  description:
    "Browse every live Likha property with rent, occupancy, and gross yield. Buy a share from 1% and collect the rent monthly.",
  isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/properties/${listing.id}`),
      name: listing.name,
    })),
  },
});
