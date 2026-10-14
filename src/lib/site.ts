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
  title: "Discover high-growth property investments | Likha",
  description:
    "Likha pools money from Filipino investors to buy, manage, and rent out Metro Manila property. Buy a share from 1% and collect the rent every month.",
  ogDescription:
    "Exceptional homes. A more considered way to invest. Rental income every month and an owned share of the building.",
  /** 1200x630, authored from the live brand fonts and hero photograph. */
  ogImage: "/og-image.jpg",
  ogImageAlt:
    "Likha: discover high-growth property investments. 7 live listings, 4 to 6.5% gross annual yield.",
  locale: "en_PH",
  /** Install name, matches manifest.short_name and the iOS home-screen title. */
  shortName: "Likha",
  /** Brand blue, sampled from the mark itself. Kept here so the manifest,
   *  theme-color meta and the icon script cannot drift apart silently. */
  themeColor: "#0562EE",
  /** Matches .brand-mark background in src/styles.css. */
  backgroundColor: "#FFFFFF",
} as const;

/** Absolute URL for a site-relative path such as "/og-image.jpg". */
export const absoluteUrl = (path: string): string =>
  `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
