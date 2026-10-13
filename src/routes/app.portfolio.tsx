import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Download, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { IncomeBars, PortfolioTrend } from "@/components/app/charts";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { incomeSeries, listingById, portfolioSeries, profileFor } from "@/lib/marketplace";

export const Route = createFileRoute("/app/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { holdings } = profileFor(session?.email);
  const [sort, setSort] = useState<"value" | "yield" | "income">("value");

  const rows = useMemo(() => {
    const enriched = holdings.map((holding) => ({
      ...holding,
      listing: listingById(holding.listingId),
    }));
    const sorters = {
      value: (a: (typeof enriched)[number], b: (typeof enriched)[number]) =>
        b.invested - a.invested,
      yield: (a: (typeof enriched)[number], b: (typeof enriched)[number]) =>
        (b.listing?.yield ?? 0) - (a.listing?.yield ?? 0),
      income: (a: (typeof enriched)[number], b: (typeof enriched)[number]) =>
        (b.listing?.rent ?? 0) * b.share - (a.listing?.rent ?? 0) * a.share,
    };
    return [...enriched].sort(sorters[sort]);
  }, [holdings, sort]);

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const monthlyIncome = rows.reduce(
    (sum, row) => sum + Math.round((row.listing?.rent ?? 0) * row.share),
    0,
  );
  const currentValue = portfolioSeries[portfolioSeries.length - 1]?.value ?? invested;
  const gain = currentValue - invested;

  if (holdings.length === 0) {
    return (
      <>
        <PageHeader title="Portfolio" description="Every property you hold a share in." />
        <EmptyState
          icon={Building2}
          title="Nothing held yet"
          description="Once you subscribe to a listing it appears here with the share you own, the rent it earns, and the value of your stake."
          action={{ label: "Browse listings", onClick: () => navigate({ to: "/marketplace" }) }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Portfolio"
        description={`${holdings.length} properties · updated today`}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Statement export is not connected yet", {
                description: "A database and a document store are the next step.",
              })
            }
          >
            <Download data-icon aria-hidden />
            Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current value" value={formatPHP(currentValue)} icon={Wallet} />
        <StatCard
          label="Invested"
          value={formatPHP(invested)}
          hint={
            gain >= 0 ? `${formatPHP(gain)} above cost` : `${formatPHP(Math.abs(gain))} below cost`
          }
        />
        <StatCard
          label="Monthly income"
          value={formatPHP(monthlyIncome)}
          delta={6.4}
          hint="vs. Sept"
        />
        <StatCard
          label="Properties held"
          value={String(holdings.length)}
          hint={`${new Set(rows.map((r) => r.listing?.city)).size} cities`}
        />
      </div>

      <Tabs defaultValue="value">
        <TabsList>
          <TabsTrigger value="value">Value</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
        </TabsList>

        <TabsContent value="value" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Portfolio value</CardTitle>
              <CardDescription>Last 12 months, gross of fees</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioTrend data={portfolioSeries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Rental income received</CardTitle>
              <CardDescription>Monthly, before fees and taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeBars data={incomeSeries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm font-medium">All holdings</CardTitle>
                <CardDescription>Sorted by {sort}</CardDescription>
              </div>
              <div className="flex gap-1 rounded-lg bg-secondary p-1">
                {(["value", "yield", "income"] as const).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={sort === key ? "default" : "ghost"}
                    onClick={() => setSort(key)}
                    className="capitalize"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead>Monthly rent</TableHead>
                      <TableHead>Yield</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.listingId}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {row.listing ? (
                                <Link
                                  to="/properties/$id"
                                  params={{ id: row.listing.id }}
                                  className="hover:underline"
                                >
                                  {row.listing.name}
                                </Link>
                              ) : (
                                "Unavailable"
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.listing?.location ?? "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[7rem]">
                          <p className="tabular-nums">{(row.share * 100).toFixed(1)}%</p>
                          <Progress value={row.share * 100} className="mt-1.5 h-1.5" />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatPHP(Math.round((row.listing?.rent ?? 0) * row.share))}/mo
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.listing?.yield.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPHP(row.invested)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total invested</span>
                <span className="font-medium tabular-nums">{formatPHP(invested)}</span>
              </div>

              <Button variant="outline" className="mt-4" asChild>
                <Link to="/marketplace">
                  Add another property
                  <ArrowRight data-icon aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
