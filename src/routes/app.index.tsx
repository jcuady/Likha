import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Compass,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/app/app-shell";
import { DonutChart, PortfolioTrend } from "@/components/app/charts";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@/lib/currency";
import { incomeSeries, listingById, portfolioSeries, profileFor } from "@/lib/marketplace";

export const Route = createFileRoute("/app/")({
  component: InvestorOverview,
});

function InvestorOverview() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { holdings, transactions } = profileFor(session?.email);

  const rows = useMemo(
    () =>
      holdings.map((holding) => ({
        ...holding,
        listing: listingById(holding.listingId),
      })),
    [holdings],
  );

  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const latest = portfolioSeries[portfolioSeries.length - 1];
  const currentValue = latest?.value ?? invested;
  const latestIncome = incomeSeries[incomeSeries.length - 1];
  const monthIncome = latestIncome?.amount ?? 0;
  const avgYield =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + (row.listing?.yield ?? 0), 0) / rows.length
      : 0;
  const firstName = session?.name.split(" ")[0] ?? "there";

  if (holdings.length === 0) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${firstName}`}
          description="Your account is ready. Here is how to make your first investment."
        />
        <EmptyState
          icon={Compass}
          title="No holdings yet"
          description="Browse the marketplace and buy a share from any open unit. Most first investments start between one and three percent."
          action={{ label: "Browse listings", onClick: () => navigate({ to: "/marketplace" }) }}
          secondaryAction={{ label: "Read how it works", onClick: () => navigate({ to: "/" }) }}
        />
        <OnboardingSteps />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your portfolio, income, and the next distribution date."
        actions={
          <Button asChild>
            <Link to="/marketplace">
              Browse listings
              <ArrowRight data-icon aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={formatPHP(currentValue)}
          delta={7.5}
          hint="vs. last month"
          icon={Wallet}
        />
        <StatCard label="Invested to date" value={formatPHP(invested)} icon={Building2} />
        <StatCard
          label="Income this month"
          value={formatPHP(monthIncome)}
          delta={6.4}
          hint="vs. Sept"
        />
        <StatCard label="Average yield" value={`${avgYield.toFixed(1)}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
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
            <CardTitle className="text-sm font-medium">Income mix</CardTitle>
            <CardDescription>Share of your holdings by property</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={rows.map((row) => ({
                name: row.listing?.city ?? "Unknown",
                value: row.invested,
              }))}
              centerValue={formatPHP(monthIncome)}
              centerLabel="this month"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium">Your holdings</CardTitle>
            <CardDescription>{holdings.length} properties you hold a share in</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/portfolio">
              Full portfolio
              <ArrowRight data-icon aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.listingId}>
                    <TableCell className="font-medium">
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.listing?.location ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{(row.share * 100).toFixed(1)}%</TableCell>
                    <TableCell className="tabular-nums">{formatPHP(row.invested)}</TableCell>
                    <TableCell className="tabular-nums">{row.listing?.yield.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {formatPHP(Math.round((row.listing?.rent ?? 0) * row.share))}/mo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
              <CardDescription>Distributions and investments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/statements">
                <Receipt data-icon aria-hidden />
                All statements
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {transactions.slice(0, 4).map((tx, index) => (
                <li key={tx.id}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tx.listingName}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.type} · {tx.date}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-medium tabular-nums ${
                        tx.amount >= 0 ? "text-emerald-700" : ""
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {formatPHP(tx.amount)}
                    </p>
                  </div>
                  {index < 3 ? <Separator /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next distribution</CardTitle>
            <CardDescription>Scheduled</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border bg-secondary/40 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card">
                <CalendarDays data-icon aria-hidden className="size-5 text-primary" />
              </span>
              <div>
                <p className="font-editorial text-2xl leading-none">31 Oct</p>
                <p className="mt-1 text-xs text-muted-foreground">in 12 days</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Distributions are paid on the last day of each month for the previous month&rsquo;s
              collected rent, after management fees and repairs.
            </p>
            <Button variant="outline" asChild>
              <Link to="/app/statements">See payout history</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function OnboardingSteps() {
  const steps = [
    {
      title: "Browse the open batch",
      body: "Every listing shows the rent, the yield, and how much is left. Nothing is held back.",
    },
    {
      title: "Pick the share you can afford",
      body: "Shares start at one percent. A one percent share of a ₱28.5M unit costs ₱285,000.",
    },
    {
      title: "We handle the property",
      body: "Likha screens the tenant, collects the rent, and pays for repairs before distributing.",
    },
  ];
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">How your first investment works</CardTitle>
        <CardDescription>Three steps, no minimum beyond the share price.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
