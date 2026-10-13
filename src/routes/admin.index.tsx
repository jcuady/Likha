import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Building2, Percent, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/app/app-shell";
import { DonutChart, IncomeBars } from "@/components/app/charts";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  adminBatchStats,
  cityCounts,
  portfolioRentSeries,
  investors,
  listings,
  publicListings,
} from "@/lib/marketplace";
import { formatPHP } from "@/lib/currency";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useMemo(() => {
    // Occupancy is measured against total unit capacity, so it is a weighted
    // figure rather than a mean of per-listing availability.
    const openUnits = publicListings.reduce((sum, l) => sum + l.available, 0);
    const capacity = publicListings.length * 100;
    const occupancy = Math.round(((capacity - openUnits) / capacity) * 100);
    const totalValue = adminBatchStats.assetValue;
    const raised = investors.reduce((sum, i) => sum + i.invested, 0);
    const pendingKyc = investors.filter((i) => i.kyc !== "Verified").length;
    const drafts = listings.filter((l) => l.status === "Draft").length;
    return { openUnits, occupancy, totalValue, raised, pendingKyc, drafts };
  }, []);

  const byCity = useMemo(
    () => Object.entries(cityCounts).map(([name, value]) => ({ name, value })),
    [],
  );

  const needsAttention = investors.filter((i) => i.kyc !== "Verified").slice(0, 4);

  return (
    <>
      <PageHeader
        title="Operations"
        description="Portfolio health across every open listing."
        actions={
          <Button asChild>
            <Link to="/admin/listings">
              Manage listings
              <ArrowRight data-icon aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Capital deployed"
          value={formatPHP(stats.totalValue)}
          hint={`${listings.length} properties`}
          icon={Wallet}
        />
        <StatCard
          label="Investor capital"
          value={formatPHP(stats.raised)}
          delta={11.4}
          hint="vs. last month"
          icon={Users}
        />
        <StatCard
          label="Occupancy"
          value={`${stats.occupancy}%`}
          delta={2.1}
          // Deliberately scoped to the listings that are actually offered. A
          // draft's units are unsold rather than unlet, so folding it in would
          // report occupancy that has not happened yet. Saying so is what stops
          // this card disagreeing with the portfolio-wide counts beside it.
          hint={`across the ${publicListings.length} listed properties`}
          icon={Percent}
        />
        <StatCard
          label="Avg. units open"
          value={`${adminBatchStats.averageOpen}%`}
          hint={`${adminBatchStats.open} of ${adminBatchStats.total} still available`}
          icon={Building2}
        />
      </div>

      {(stats.pendingKyc > 0 || stats.drafts > 0) && (
        <Card className="border-amber-300 bg-amber-50/60 shadow-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle
                data-icon
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-amber-600"
              />
              <div>
                <p className="text-sm font-medium">Needs review</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {stats.pendingKyc} investor{" "}
                  {stats.pendingKyc === 1 ? "account is" : "accounts are"} not fully verified
                  {stats.drafts > 0
                    ? ` and ${stats.drafts} ${stats.drafts === 1 ? "listing is" : "listings are"} still in draft.`
                    : "."}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link to="/admin/investors">Review now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Rental income across the portfolio
            </CardTitle>
            <CardDescription>Monthly, gross of fees</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeBars data={portfolioRentSeries} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Listings by city</CardTitle>
            <CardDescription>Where capital is deployed</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={byCity}
              centerValue={String(listings.length)}
              centerLabel="listings"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium">Listing status</CardTitle>
            <CardDescription>Every property in the current batch</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/listings">
              Manage
              <ArrowRight data-icon aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col">
            {listings.slice(0, 5).map((listing, index) => (
              <li key={listing.id}>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {listing.location} · {listing.investors} investors
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                      {listing.yield.toFixed(1)}% yield
                    </span>
                    <Badge
                      variant={
                        listing.status === "Available"
                          ? "default"
                          : listing.status === "Draft"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {listing.status}
                    </Badge>
                  </div>
                </div>
                {index < 4 ? <Separator /> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {needsAttention.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Investors awaiting verification</CardTitle>
            <CardDescription>KYC must clear before a subscription can settle</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {needsAttention.map((investor, index) => (
                <li key={investor.id}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{investor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{investor.email}</p>
                    </div>
                    <Badge variant={investor.kyc === "In review" ? "secondary" : "outline"}>
                      {investor.kyc}
                    </Badge>
                  </div>
                  {index < needsAttention.length - 1 ? <Separator /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
