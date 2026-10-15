import { useSyncExternalStore } from "react";

import {
  type InvestorRow,
  type Listing,
  investors as investorSeed,
  listings as listingSeed,
} from "@/lib/marketplace";

/**
 * Session-scoped admin data.
 *
 * The admin tables previously held their rows in component `useState`, which
 * had two defects that share one root cause:
 *
 * 1. The sidebar badge is rendered by a different component from the table it
 *    counts, so it could only ever show a literal. Creating or removing a row
 *    left the badge stale.
 * 2. Navigate away and back and every edit was gone, because unmounting threw
 *    the state away. An admin who created a listing, opened Analytics to check
 *    it, and came back found it missing.
 *
 * Both are the same bug: the truth lived inside a component instead of behind
 * a boundary the rest of the surface can read. This module is that boundary,
 * and it deliberately mirrors `watchlist.ts` so the two read identically.
 *
 * It is still simulated and still session-only. When listings and investors move
 * behind real tables this module becomes the adapter, and no call site changes:
 * every mutation here already goes through one function per entity.
 */

type ListingStore = {
  listings: Listing[];
  investors: InvestorRow[];
};

let state: ListingStore = { listings: listingSeed, investors: investorSeed };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => state;

/** Stable object identity between mutations, so React does not re-render forever. */
let cached = state;
function getSnapshot(): ListingStore {
  if (cached !== state) cached = state;
  return cached;
}

function commit(next: ListingStore) {
  state = next;
  emit();
}

/** Replace one listing's fields. Returns the updated row, or null if unknown. */
export function patchListing(id: string, changes: Partial<Listing>): Listing | null {
  let updated: Listing | null = null;
  commit({
    ...state,
    listings: state.listings.map((row) => {
      if (row.id !== id) return row;
      updated = { ...row, ...changes };
      return updated;
    }),
  });
  return updated;
}

export function addListing(listing: Listing): void {
  commit({ ...state, listings: [...state.listings, listing] });
}

export function removeListing(id: string): void {
  commit({ ...state, listings: state.listings.filter((row) => row.id !== id) });
}

export function addInvestor(investor: InvestorRow): void {
  commit({ ...state, investors: [...state.investors, investor] });
}

export function patchInvestor(id: string, changes: Partial<InvestorRow>): void {
  commit({
    ...state,
    investors: state.investors.map((row) => (row.id === id ? { ...row, ...changes } : row)),
  });
}

/** Reset to the seed. Exposed for the demo reset affordance and for tests. */
export function resetAdminData(): void {
  commit({ listings: listingSeed, investors: investorSeed });
}

export function useAdminData() {
  return {
    ...useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    patchListing,
    addListing,
    removeListing,
    addInvestor,
    patchInvestor,
  };
}
