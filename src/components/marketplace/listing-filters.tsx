import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  publicCityCounts,
  publicListings,
  type ListingStatus,
  type Listing,
} from "@/lib/marketplace";

export type SortKey = "featured" | "yield-desc" | "price-asc" | "price-desc" | "income-desc";

export type MarketplaceQuery = {
  q: string;
  city: string;
  type: string;
  status: string;
  minYield: number;
  sort: SortKey;
};

export const defaultQuery: MarketplaceQuery = {
  q: "",
  city: "all",
  type: "all",
  status: "all",
  minYield: 0,
  sort: "featured",
};

/**
 * URL shape. Every field is optional so `navigate({ to: '/marketplace' })` does
 * not force every caller to restate the whole query; `resolveQuery` fills the
 * gaps so components only ever see a complete filter state.
 */
export type MarketplaceSearch = {
  [K in keyof MarketplaceQuery]?: MarketplaceQuery[K] | undefined;
};

const SORTS: SortKey[] = ["featured", "yield-desc", "price-asc", "price-desc", "income-desc"];

export function resolveQuery(search: MarketplaceSearch): MarketplaceQuery {
  return {
    q: typeof search.q === "string" ? search.q : defaultQuery.q,
    city: search.city ?? defaultQuery.city,
    type: search.type ?? defaultQuery.type,
    status: search.status ?? defaultQuery.status,
    minYield: typeof search.minYield === "number" ? search.minYield : defaultQuery.minYield,
    sort: SORTS.includes(search.sort as SortKey) ? (search.sort as SortKey) : defaultQuery.sort,
  };
}

// Draft never reaches the public marketplace, so it is not a filter option here.
const statuses: ListingStatus[] = ["Available", "Under Offer", "Fully Subscribed"];
const types = Array.from(new Set(publicListings.map((l) => l.type)));
const cities = Object.keys(publicCityCounts).sort();

export function applyFilters(
  query: MarketplaceQuery,
  source: Listing[] = publicListings,
): Listing[] {
  const needle = query.q.trim().toLowerCase();
  const filtered = source.filter((l) => {
    if (needle) {
      const haystack = `${l.name} ${l.location} ${l.city} ${l.type} ${l.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (query.city !== "all" && l.city !== query.city) return false;
    if (query.type !== "all" && l.type !== query.type) return false;
    if (query.status !== "all" && l.status !== query.status) return false;
    if (l.yield < query.minYield) return false;
    return true;
  });

  const by = (a: Listing, b: Listing) => b.yield - a.yield;
  const sorters: Record<SortKey, (a: Listing, b: Listing) => number> = {
    featured: (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || by(a, b),
    "yield-desc": by,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "income-desc": (a, b) => b.rent - a.rent,
  };
  return [...filtered].sort(sorters[query.sort]);
}

/** True when anything narrows the result set, so the reset affordance can hide itself. */
export function isFiltered(query: MarketplaceQuery): boolean {
  return (
    query.q.trim() !== "" ||
    query.city !== "all" ||
    query.type !== "all" ||
    query.status !== "all" ||
    query.minYield > 0
  );
}

export function ListingFilters({
  query,
  onChange,
  resultCount,
}: {
  query: MarketplaceQuery;
  onChange: (next: MarketplaceQuery) => void;
  resultCount: number;
}) {
  const patch = (partial: Partial<MarketplaceQuery>) => onChange({ ...query, ...partial });
  const active = isFiltered(query);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            data-icon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query.q}
            onChange={(event) => patch({ q: event.target.value })}
            placeholder="Search by name, city, or neighbourhood"
            aria-label="Search listings"
            className="h-11 pl-9 sm:h-10"
          />
          {query.q ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => patch({ q: "" })}
              aria-label="Clear search"
              className="absolute right-0 top-0 size-11 rounded-none sm:size-10"
            >
              <X data-icon />
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:shrink-0">
          <FilterSelect
            label="City"
            value={query.city}
            onChange={(value) => patch({ city: value })}
            options={[
              { value: "all", label: "All cities" },
              ...cities.map((city) => ({
                value: city,
                label: `${city} (${publicCityCounts[city]})`,
              })),
            ]}
          />
          <FilterSelect
            label="Type"
            value={query.type}
            onChange={(value) => patch({ type: value })}
            options={[
              { value: "all", label: "Any type" },
              ...types.map((type) => ({ value: type, label: type })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={query.status}
            onChange={(value) => patch({ status: value })}
            options={[
              { value: "all", label: "Any status" },
              ...statuses.map((status) => ({ value: status, label: status })),
            ]}
          />
          <FilterSelect
            label="Sort"
            value={query.sort}
            onChange={(value) => patch({ sort: value as SortKey })}
            options={[
              { value: "featured", label: "Featured" },
              { value: "yield-desc", label: "Highest yield" },
              { value: "income-desc", label: "Highest rent" },
              { value: "price-asc", label: "Price: low to high" },
              { value: "price-desc", label: "Price: high to low" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <fieldset className="flex min-w-[220px] flex-1 items-center gap-3 sm:max-w-xs">
            {/* Radix forwards only `aria-label` to the thumb, so this is the association
              that actually takes effect. It repeats the visible label. */}
            <Label className="shrink-0 text-xs text-muted-foreground">Min yield</Label>
            <Slider
              min={0}
              max={8}
              step={0.5}
              value={[query.minYield]}
              onValueChange={(value) => patch({ minYield: value[0] ?? 0 })}
              aria-label="Minimum annual yield"
              className="flex-1"
            />
            <span className="w-12 shrink-0 text-right text-xs font-medium">
              {query.minYield.toFixed(1)}%
            </span>
          </fieldset>

          <RadioGroup
            value={query.status === "all" ? "any" : query.status}
            onValueChange={(value) => patch({ status: value === "any" ? "all" : value })}
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
            aria-label="Availability"
          >
            {/* The Radix radio indicator is a 16px circle. The row around it is
                what the finger actually hits, so the row carries the 44px
                touch floor rather than the dot. */}
            {/* Radix RadioGroupItem renders a <button role="radio">, and a <button> is not
                a labelable element, so the adjacent <label htmlFor> names
                nothing. Each item carries its own aria-label matching the
                visible text. */}
            <div className="flex min-h-11 items-center gap-2 sm:min-h-0">
              <RadioGroupItem value="any" id="status-any" aria-label="Any" />
              <Label htmlFor="status-any" className="text-xs font-normal text-muted-foreground">
                Any
              </Label>
            </div>
            {statuses.slice(0, 3).map((status) => {
              const id = `status-${status.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <div key={status} className="flex min-h-11 items-center gap-2 sm:min-h-0">
                  <RadioGroupItem value={status} id={id} aria-label={status} />
                  <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
                    {status}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            <SlidersHorizontal data-icon aria-hidden className="mr-1.5 inline size-3.5" />
            {resultCount} of {publicListings.length} listings
          </p>
          {active ? (
            <Button variant="ghost" size="sm" onClick={() => onChange({ ...defaultQuery })}>
              Reset filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-11 w-full sm:h-10 lg:w-auto lg:min-w-[9.5rem]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
