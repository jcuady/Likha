import { useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/app-shell";
import { PublicPage } from "@/components/marketing/public-shell";
import { ListingCard } from "@/components/marketplace/listing-card";
import {
  applyFilters,
  defaultQuery,
  ListingFilters,
  resolveQuery,
  type MarketplaceQuery,
  type MarketplaceSearch,
  type SortKey,
} from "@/components/marketplace/listing-filters";
import { batchStats, listings, publicListings } from "@/lib/marketplace";

const SORTS: SortKey[] = ["featured", "yield-desc", "price-asc", "price-desc", "income-desc"];
const isSortKey = (value: unknown): value is SortKey =>
  typeof value === "string" && SORTS.includes(value as SortKey);

export const Route = createFileRoute("/marketplace")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => {
    const sort = search["sort"];
    return {
      q: typeof search["q"] === "string" ? search["q"] : undefined,
      city: typeof search["city"] === "string" ? search["city"] : undefined,
      type: typeof search["type"] === "string" ? search["type"] : undefined,
      status: typeof search["status"] === "string" ? search["status"] : undefined,
      minYield: typeof search["minYield"] === "number" ? search["minYield"] : undefined,
      sort: isSortKey(sort) ? sort : undefined,
    };
  },
  component: MarketplacePage,
});

function MarketplacePage() {
  const search = resolveQuery(useSearch({ from: "/marketplace" }));
  const navigate = useNavigate({ from: "/marketplace" });

  const results = useMemo(() => applyFilters(search), [search]);

  // Filters live in the URL so a filtered view is shareable and the back button
  // restores the previous filter state.
  const onChange = (next: MarketplaceQuery) => {
    void navigate({ search: next, replace: true });
  };

  const featured = publicListings.filter((l) => l.featured).length;

  return (
    <PublicPage>
      <PageHeader
        title="Marketplace"
        description={`${batchStats.total} properties in the current batch. ${batchStats.open} still have units available. Buy from a 1% share.`}
        actions={
          <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-2.5">
            <div>
              <p className="text-xs text-muted-foreground">Featured</p>
              <p className="font-editorial text-xl leading-none">{featured}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Avg. open</p>
              <p className="font-editorial text-xl leading-none">{batchStats.averageOpen}%</p>
            </div>
          </div>
        }
      />

      <ListingFilters query={search} onChange={onChange} resultCount={results.length} />

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No listings match those filters"
          description="Try widening the city or clearing the minimum yield. New properties are added as each batch opens."
          action={{ label: "Reset filters", onClick: () => onChange({ ...defaultQuery }) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </PublicPage>
  );
}
