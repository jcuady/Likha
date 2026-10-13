/**
 * Single source of truth for the public origin and the brand's search-facing
 * strings. `public/sitemap.xml` and `public/robots.txt` are static files that
 * cannot import this module, so `src/test/seo.test.ts` asserts they still match
 * SITE.url and that the sitemap covers exactly the public routes. Change the
 * domain here once and the test tells you which static files to update.
 *
 * Note on honesty: Likha is a preview build with no live accounts and no
 * investment service behind it yet. Nothing in the structured data below may
 * claim otherwise, and no aggregate rating, review count or user count is
 * emitted because none of it is real yet.
 */
export const SITE = {
  /** Bare origin, no trailing slash. */
  url: "https://likha-ten.vercel.app",
  name: "Likha",
  title: "Likha: Own Metro Manila property without a whole unit",
  description:
    "Likha pools money from Filipino investors to buy, manage, and rent out Metro Manila property. Get rental income monthly and an owned share of the building.",
  ogDescription:
    "Rental income every month and an owned share of the building. Likha is opening early access to Filipino investors.",
  /** 1200x630, authored from the live brand fonts and hero photograph. */
  ogImage: "/og-image.jpg",
  ogImageAlt:
    "Likha: own Metro Manila property without buying a whole unit. 7 live listings, 4 to 6.5% gross annual yield.",
  locale: "en_PH",
} as const;

/** Absolute URL for a site-relative path such as "/og-image.jpg". */
export const absoluteUrl = (path: string): string =>
  `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
