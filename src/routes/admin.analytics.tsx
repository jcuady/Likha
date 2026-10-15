import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Info, MapPin, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/app/app-shell";
import { DonutChart, IncomeBars, PortfolioTrend } from "@/components/app/charts";
import { StatCard } from "@/components/app/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatPHP } from "@/lib/currency";
import { listings, portfolioRentSeries, portfolioSeries } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const BAND_FULL = "Fully subscribed";
const BAND_PARTIAL = "Partially subscribed";
const BAND_UNOPENED = "Not yet opened";

const OCCUPANCY_BANDS = [BAND_FULL, BAND_PARTIAL, BAND_UNOPENED] as const;

function AdminAnalytics() {
  const byCity = useMemo(() => {
    const totals = new Map<string, { count: number; capital: number }>();
    for (const listing of listings) {
      if (listing.status === "Draft") continue;
      const entry = totals.get(listing.city) ?? { count: 0, capital: 0 };
      entry.count += 1;
      entry.capital += listing.price;
      totals.set(listing.city, entry);
    }
    return [...totals.entries()]
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.capital - a.capital);
  }, []);

  const subscriptionBands = useMemo(() => {
    const counts: Record<(typeof OCCUPANCY_BANDS)[number], number> = {
      [BAND_FULL]: 0,
      [BAND_PARTIAL]: 0,
      [BAND_UNOPENED]: 0,
    };
    for (const listing of listings) {
      if (listing.status === "Draft") counts[BAND_UNOPENED] += 1;
      else if (listing.available === 0) counts[BAND_FULL] += 1;
      else counts[BAND_PARTIAL] += 1;
    }
    return OCCUPANCY_BANDS.map((label) => ({ name: label, value: counts[label] }));
  }, []);

  // One universe per figure. These four tiles sit in a single row and the third
  // is explicitly labelled "excluding drafts", so averaging over all eight put
  // the draft Taal Garden into "Average rent" (₱92,000 instead of ₱93,000) and
  // let a draft be named "Best performer".
  const liveListings = useMemo(() => listings.filter((l) => l.status !== "Draft"), []);
  const avgYield = liveListings.length
    ? liveListings.reduce((sum, l) => sum + l.yield, 0) / liveListings.length
    : 0;
  const avgRent = liveListings.length
    ? liveListings.reduce((sum, l) => sum + l.rent, 0) / liveListings.length
    : 0;
  const topListing = [...liveListings].sort((a, b) => b.yield - a.yield)[0];
  const totalCapital = liveListings.reduce((sum, l) => sum + l.price, 0);

  const performance = useMemo(
    () =>
      listings
        .filter((l) => l.status !== "Draft")
        .map((l) => ({
          listing: l,
          annualRent: l.rent * 12,
          returnOnPrice: (l.rent * 12 * 100) / l.price,
        }))
        .sort((a, b) => b.returnOnPrice - a.returnOnPrice),
    [],
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Yield, income, and where capital sits across the current batch."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average yield" value={`${avgYield.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard
          label="Average rent"
          value={formatPHP(Math.round(avgRent))}
          hint="per month per unit"
        />
        <StatCard
          label="Asset value tracked"
          value={formatPHP(totalCapital)}
          hint="excluding drafts"
        />
        <StatCard
          label="Best performer"
          value={topListing ? `${topListing.yield.toFixed(1)}%` : "—"}
          hint={topListing?.name ?? "No listings"}
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Portfolio value</CardTitle>
            <CardDescription>Last 12 months, gross of fees</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioTrend data={portfolioSeries} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rental income</CardTitle>
            <CardDescription>Monthly across all listings</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeBars data={portfolioRentSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Capital by city</CardTitle>
            <CardDescription>Share of total asset value</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={byCity.map((row) => ({ name: row.city, value: row.capital }))}
              centerValue={formatPHP(totalCapital)}
              centerLabel="tracked"
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            {byCity.map((row) => (
              <div key={row.city} className="flex items-center gap-3 text-xs">
                <MapPin data-icon aria-hidden className="size-3.5 text-muted-foreground" />
                <span className="w-20 shrink-0 font-medium">{row.city}</span>
                {/* Normalised to the total, not to the largest city. Dividing by the
                biggest row rendered Batangas at a full 100% bar while the
                caption above promised "share of total asset value", so the bar
                and its own label disagreed by construction. */}
                <Progress
                  value={totalCapital > 0 ? (row.capital / totalCapital) * 100 : 0}
                  className="h-1.5 flex-1"
                />
                <span className="w-24 shrink-0 text-right tabular-nums text-muted-foreground">
                  {totalCapital > 0 ? `${Math.round((row.capital / totalCapital) * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </CardFooter>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Subscription status</CardTitle>
            <CardDescription>Where each listing sits in its batch</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={subscriptionBands}
              centerValue={String(listings.length)}
              centerLabel="listings"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance by listing</CardTitle>
          <CardDescription>Gross return on price, ranked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                {performance.map(({ listing, annualRent, returnOnPrice }) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{listing.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{listing.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatPHP(annualRent)}</TableCell>
                    <TableCell className="tabular-nums">{returnOnPrice.toFixed(1)}%</TableCell>
                    <TableCell className="min-w-[10rem]">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(returnOnPrice / 8) * 100}
                          className="h-1.5 flex-1"
                          aria-label={`${listing.name} gross return`}
                        />
                        <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {listing.available}% open
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info data-icon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Every figure here is gross. Net return is lower after management fees, repairs, taxes,
            and vacancy. Nothing on this page is a forecast or an offer of return.
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
