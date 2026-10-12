/**
 * Marketing copy and listing figures for the Likha concept preview.
 *
 * Kept out of the route file so the numbers can be asserted in tests. Rents are
 * plain peso amounts per month and must stay inside PLAUSIBLE_RENT: an earlier
 * revision carried USD-magnitude values over from a reference design and
 * printed them with the peso sign, which made a Brooklyn three-bedroom read as
 * about sixty dollars a month.
 */

export const PLAUSIBLE_RENT = { low: 25000, high: 400000 } as const;

export const insights = [
  {
    title: "What the market is doing",
    body: "Street-level pricing, rental demand, and how each neighborhood has moved over the last three years.",
  },
  {
    title: "Where it is heading",
    body: "Forward-looking signals from historical trends and local indicators, so you can judge a property over the next five years.",
  },
  {
    title: "What to do about it",
    body: "Side-by-side comparisons that turn the numbers into a decision you can actually act on.",
  },
];

/** Literal union so the photograph map in the route is checked for exhaustiveness. */
export type ListingKey = "urban-edge" | "villa-redwood" | "cedar-pavilion" | "horizon-house";

export type Listing = {
  /** Stable key used to pair a listing with its photograph. */
  key: ListingKey;
  name: string;
  location: string;
  description: string;
  /** Monthly rent in pesos. */
  rent: number;
  status: "Available" | "Under Offer";
  beds: number;
  area: string;
  yield: string;
};

export const listings: Listing[] = [
  {
    key: "urban-edge",
    name: "The Urban Edge",
    location: "Makati, Manila",
    description: "Three bedrooms in a Makati tower, ten minutes from Ayala Avenue",
    rent: 85000,
    status: "Available",
    beds: 3,
    area: "1,850",
    yield: "5.8%",
  },
  {
    key: "villa-redwood",
    name: "Villa Redwood",
    location: "Poro Point, Batangas",
    description: "Beachfront house in Batangas, about two hours south of Manila",
    rent: 62000,
    status: "Under Offer",
    beds: 4,
    area: "3,200",
    yield: "6.4%",
  },
  {
    key: "cedar-pavilion",
    name: "The Cedar Pavilion",
    location: "Nuvali, Taguig",
    description: "Two bedrooms in Nuvali, close to the schools and the retail center",
    rent: 48000,
    status: "Available",
    beds: 2,
    area: "1,450",
    yield: "5.2%",
  },
  {
    key: "horizon-house",
    name: "The Horizon House",
    location: "Malay, Boracay",
    description: "Three bedrooms in Boracay, walking distance from the beach",
    rent: 75000,
    status: "Available",
    beds: 3,
    area: "2,800",
    yield: "6.1%",
  },
];

export const services = [
  {
    title: "We find and screen the property",
    body: "We visit it, check the title, and confirm the numbers before anyone commits money.",
  },
  {
    title: "We handle tenants and repairs",
    body: "Leasing, collections, maintenance, and permits, handled by a local property manager.",
  },
  {
    title: "You watch it from anywhere",
    body: "Rent collected, expenses, and what your share is worth, updated every month.",
  },
];
