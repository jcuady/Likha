/**
 * Simulated marketplace data. There is no backend yet: this module is the single
 * place a database adapter would later replace. Every function returns plain
 * objects so the swap to a query layer does not change component code.
 */

import heroImg from "@/assets/likha_villa_hero.jpg";
import dreamImg from "@/assets/likha_dream_house.jpg";
import communityImg from "@/assets/likha_community.jpg";
import horizonImg from "@/assets/likha_horizon_house.jpg";

export type ListingStatus = "Available" | "Under Offer" | "Fully Subscribed" | "Draft";

export type Listing = {
  id: string;
  name: string;
  location: string;
  city: string;
  description: string;
  /** Sale price in pesos. */
  price: number;
  /** Monthly rent in pesos. */
  rent: number;
  status: ListingStatus;
  beds: number;
  baths: number;
  area: number;
  yield: number;
  /** Share of the unit still available, 0-100. */
  available: number;
  investors: number;
  image: string;
  type: "Condo" | "House" | "Townhouse" | "Land";
  featured?: boolean;
  amenities: string[];
};

export type Holding = {
  listingId: string;
  /** Fraction owned, 0-1. */
  share: number;
  invested: number;
  acquiredOn: string;
};

export type Transaction = {
  id: string;
  listingId: string;
  listingName: string;
  type: "Investment" | "Distribution" | "Refund";
  amount: number;
  date: string;
  status: "Completed" | "Pending";
};

const IMG_HERO = heroImg;
const IMG_DREAM = dreamImg;
const IMG_COMMUNITY = communityImg;
const IMG_HORIZON = horizonImg;

/**
 * Gross annual yield implied by a price and a rent.
 *
 * Yield is never stored. An earlier revision carried a hand-entered `yield`
 * next to the price and rent, and every listing overstated it by 0.7 to 4.6
 * points: Villa Redwood advertised 6.4% on numbers that only support 1.8%.
 * Deriving it removes the possibility of the two disagreeing, and the test in
 * `src/test/marketplace.test.ts` fails if anything reintroduces a literal.
 */
export const grossYield = (price: number, rent: number): number =>
  Math.round(((rent * 12) / price) * 1000) / 10;

/** Listing fields before the derived ones are attached. */
type ListingInput = Omit<Listing, "yield">;

const listingInputs: ListingInput[] = [
  {
    id: "lk-1041",
    name: "The Urban Edge",
    location: "Ayala Avenue, Makati",
    city: "Makati",
    description:
      "A three-bedroom corner unit on the 34th floor of a Makati tower. Ten minutes on foot from Ayala Avenue, with a resident pool and a managed units floor.",
    price: 28500000,
    rent: 120000,
    status: "Available",
    beds: 3,
    baths: 2,
    area: 185,
    available: 42,
    investors: 34,
    image: IMG_HERO,
    type: "Condo",
    featured: true,
    amenities: ["Resident pool", "24h security", "Parking", "Gym", "Pet friendly"],
  },
  {
    id: "lk-1042",
    name: "Villa Redwood",
    location: "Poro Point, Batangas",
    city: "Batangas",
    description:
      "A four-bedroom beachfront house two hours south of Manila. Direct sand frontage, a private pool, and a caretaker who has lived on the street for nine years.",
    price: 42000000,
    rent: 155000,
    status: "Under Offer",
    beds: 4,
    baths: 3,
    area: 320,
    available: 18,
    investors: 61,
    image: IMG_DREAM,
    type: "House",
    featured: true,
    amenities: ["Beachfront", "Private pool", "Caretaker", "Solar panels", "Furnished"],
  },
  {
    id: "lk-1043",
    name: "The Cedar Pavilion",
    location: "Nuvali, Taguig",
    city: "Taguig",
    description:
      "A two-bedroom in Nuvali close to the international schools and the retail centre. One of the few remaining units in the original building.",
    price: 16500000,
    rent: 75000,
    status: "Available",
    beds: 2,
    baths: 2,
    area: 96,
    available: 71,
    investors: 18,
    image: IMG_COMMUNITY,
    type: "Condo",
    amenities: ["Near schools", "Pool", "Function room", "Park facing"],
  },
  {
    id: "lk-1044",
    name: "The Horizon House",
    location: "Malay, Boracay",
    city: "Boracay",
    description:
      "A three-bedroom in Boracay within walking distance of the beach. Currently managed as a short-term rental with a projected annual return of 6.3 percent.",
    price: 35000000,
    rent: 185000,
    status: "Fully Subscribed",
    beds: 3,
    baths: 3,
    area: 210,
    available: 0,
    investors: 84,
    image: IMG_HORIZON,
    type: "Condo",
    featured: true,
    amenities: ["Beach walkable", "Short-term rental", "Pool", "Concierge"],
  },
  {
    id: "lk-1045",
    name: "Marina Verde",
    location: "Bonifacio Global City, Taguig",
    city: "Taguig",
    description:
      "A one-bedroom in BGC with a view over the football field. The lowest entry price in the current batch, aimed at first-time property investors.",
    price: 9800000,
    rent: 34000,
    status: "Available",
    beds: 1,
    baths: 1,
    area: 62,
    available: 88,
    investors: 9,
    image: IMG_HERO,
    type: "Condo",
    amenities: ["Gym", "Co-working", "Pool", "BGC location"],
  },
  {
    id: "lk-1046",
    name: "The Sandbar",
    location: "La Union, San Fernando",
    city: "La Union",
    description:
      "A two-bedroom townhouse near the surf break. Strong short-term demand through most of the year, which is what drives the yield on this one.",
    price: 11200000,
    rent: 55000,
    status: "Available",
    beds: 2,
    baths: 2,
    area: 110,
    available: 55,
    investors: 27,
    image: IMG_DREAM,
    type: "Townhouse",
    amenities: ["Near surf", "Pet friendly", "Parking", "Bamboo exterior"],
  },
  {
    id: "lk-1047",
    name: "Cebu Heights",
    location: "Mandaue, Cebu",
    city: "Cebu",
    description:
      "A two-bedroom in Mandaue with a floor area of 88 square metres. Lower entry price than Metro Manila for the same monthly yield.",
    price: 7400000,
    rent: 27000,
    status: "Available",
    beds: 2,
    baths: 1,
    area: 88,
    available: 92,
    investors: 6,
    image: IMG_COMMUNITY,
    type: "Condo",
    amenities: ["Pool", "Near IT hub", "Parking", "Shuttle"],
  },
  {
    id: "lk-1048",
    name: "Taal Garden",
    location: "Talisay, Batangas",
    city: "Batangas",
    description:
      "A three-bedroom overlooking the Taal lake. Hold for appreciation: rents here move with the lake view and the retirement developments going up nearby.",
    price: 19500000,
    rent: 85000,
    status: "Draft",
    beds: 3,
    baths: 2,
    area: 240,
    available: 100,
    investors: 0,
    image: IMG_HORIZON,
    type: "House",
    amenities: ["Lake view", "Garden", "Caretaker", "Quiet street"],
  },
];

export const listings: Listing[] = listingInputs.map((listing) => ({
  ...listing,
  yield: grossYield(listing.price, listing.rent),
}));

/** Rent attributable to a fractional share, in pesos per month. */
export const shareIncome = (listingId: string, share: number): number =>
  Math.round((listingById(listingId)?.rent ?? 0) * share);

export const holdings: Holding[] = [
  { listingId: "lk-1044", share: 0.031, invested: 1085000, acquiredOn: "2026-03-14" },
  { listingId: "lk-1042", share: 0.018, invested: 756000, acquiredOn: "2026-05-02" },
  { listingId: "lk-1046", share: 0.024, invested: 268800, acquiredOn: "2026-07-21" },
];

export const transactions: Transaction[] = [
  {
    id: "tx-9001",
    listingId: "lk-1044",
    listingName: "The Horizon House",
    type: "Distribution",
    amount: 9450,
    date: "2026-09-30",
    status: "Completed",
  },
  {
    id: "tx-9002",
    listingId: "lk-1042",
    listingName: "Villa Redwood",
    type: "Distribution",
    amount: 9020,
    date: "2026-09-30",
    status: "Completed",
  },
  {
    id: "tx-9003",
    listingId: "lk-1046",
    listingName: "The Sandbar",
    type: "Distribution",
    amount: 1330,
    date: "2026-09-30",
    status: "Completed",
  },
  {
    id: "tx-9004",
    listingId: "lk-1046",
    listingName: "The Sandbar",
    type: "Investment",
    amount: -268800,
    date: "2026-07-21",
    status: "Completed",
  },
  {
    id: "tx-9005",
    listingId: "lk-1042",
    listingName: "Villa Redwood",
    type: "Investment",
    amount: -756000,
    date: "2026-05-02",
    status: "Completed",
  },
  {
    id: "tx-9006",
    listingId: "lk-1044",
    listingName: "The Horizon House",
    type: "Investment",
    amount: -1085000,
    date: "2026-03-14",
    status: "Completed",
  },
  {
    id: "tx-9007",
    listingId: "lk-1041",
    listingName: "The Urban Edge",
    type: "Investment",
    amount: -855000,
    date: "2026-10-02",
    status: "Pending",
  },
];

export type InvestorRow = {
  id: string;
  name: string;
  email: string;
  invested: number;
  holdings: number;
  joined: string;
  kyc: "Verified" | "In review" | "Not started";
};

export const investors: InvestorRow[] = [
  {
    id: "in-01",
    name: "Amara Villanueva",
    email: "amara.v@example.com",
    invested: 4250000,
    holdings: 4,
    joined: "2025-11-04",
    kyc: "Verified",
  },
  {
    id: "in-02",
    name: "Rafael Santos",
    email: "r.santos@example.com",
    invested: 3180000,
    holdings: 3,
    joined: "2025-12-19",
    kyc: "Verified",
  },
  {
    id: "in-03",
    name: "Nicole Dela Cruz",
    email: "nicole.dc@example.com",
    invested: 2890000,
    holdings: 2,
    joined: "2026-01-27",
    kyc: "Verified",
  },
  {
    id: "in-04",
    name: "Miguel Tan",
    email: "m.tan@example.com",
    invested: 1640000,
    holdings: 2,
    joined: "2026-03-08",
    kyc: "In review",
  },
  {
    id: "in-05",
    name: "Grace Lim",
    email: "grace.lim@example.com",
    invested: 980000,
    holdings: 1,
    joined: "2026-06-15",
    kyc: "Not started",
  },
  {
    id: "in-06",
    name: "Paolo Reyes",
    email: "p.reyes@example.com",
    invested: 640000,
    holdings: 1,
    joined: "2026-08-02",
    kyc: "Verified",
  },
];

/** 12 months of portfolio value, in pesos, oldest first. */
export const portfolioSeries = [
  { month: "Nov", value: 1180000 },
  { month: "Dec", value: 1245000 },
  { month: "Jan", value: 1310000 },
  { month: "Feb", value: 1290000 },
  { month: "Mar", value: 1425000 },
  { month: "Apr", value: 1510000 },
  { month: "May", value: 1605000 },
  { month: "Jun", value: 1720000 },
  { month: "Jul", value: 1815000 },
  { month: "Aug", value: 1940000 },
  { month: "Sep", value: 2085000 },
  { month: "Oct", value: 2240000 },
];

/**
 * 12 months of the demo investor's own distributions, in pesos, oldest first.
 * Ends at the 9,845 a month the three held shares actually earn.
 */
export const incomeSeries = [
  { month: "Nov", amount: 5120 },
  { month: "Dec", amount: 5460 },
  { month: "Jan", amount: 5610 },
  { month: "Feb", amount: 5540 },
  { month: "Mar", amount: 6120 },
  { month: "Apr", amount: 6980 },
  { month: "May", amount: 7440 },
  { month: "Jun", amount: 8060 },
  { month: "Jul", amount: 8120 },
  { month: "Aug", amount: 8760 },
  { month: "Sep", amount: 9020 },
  { month: "Oct", amount: 9450 },
];

/**
 * 12 months of rent collected across every live listing, not one investor's
 * share. Used by the operations views, where the scale is the whole portfolio.
 */
export const portfolioRentSeries = [
  { month: "Nov", amount: 571000 },
  { month: "Dec", amount: 598000 },
  { month: "Jan", amount: 612000 },
  { month: "Feb", amount: 604000 },
  { month: "Mar", amount: 641000 },
  { month: "Apr", amount: 668000 },
  { month: "May", amount: 692000 },
  { month: "Jun", amount: 705000 },
  { month: "Jul", amount: 718000 },
  { month: "Aug", amount: 731000 },
  { month: "Sep", amount: 746000 },
  { month: "Oct", amount: 762000 },
];

export const listingById = (id: string) => listings.find((l) => l.id === id);

/**
 * What the public marketplace is allowed to show. Drafts are internal review
 * state and must never reach a visitor, so they are filtered at the data
 * boundary rather than in each page that happens to render a grid.
 */
export const publicListings = listings.filter((l) => l.status !== "Draft");

/**
 * Batch-level figures. `averageOpen` is a mean of per-listing availability:
 * summing the percentages across listings produces a number above 100 that
 * reads like a factual claim about the portfolio.
 */
export const batchStats = (() => {
  const total = publicListings.length;
  const open = publicListings.filter((l) => l.available > 0).length;
  const averageOpen = Math.round(
    publicListings.reduce((sum, l) => sum + l.available, 0) / (total || 1),
  );
  const assetValue = publicListings.reduce((sum, l) => sum + l.price, 0);
  return { total, open, averageOpen, assetValue };
})();

/**
 * Per-account data. Only the demo investor has a history; every other account
 * resolves to an empty profile, which is what a real query would return for a
 * new signup. A database adapter replaces this map, not the call sites.
 */
export type InvestorProfile = {
  holdings: Holding[];
  transactions: Transaction[];
};

export const profiles: Record<string, InvestorProfile> = {
  "andrea@example.com": { holdings, transactions },
};

export const EMPTY_PROFILE: InvestorProfile = { holdings: [], transactions: [] };

export const profileFor = (email: string | undefined): InvestorProfile =>
  (email ? profiles[email] : undefined) ?? EMPTY_PROFILE;

export const cityCounts = listings.reduce<Record<string, number>>((acc, l) => {
  acc[l.city] = (acc[l.city] ?? 0) + 1;
  return acc;
}, {});
