import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { profileFor } from "@/lib/marketplace";

const FILTERS = ["All", "Distribution", "Investment", "Refund"] as const;
type Filter = (typeof FILTERS)[number];

export const Route = createFileRoute("/app/statements")({
  component: StatementsPage,
});

function StatementsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { transactions } = profileFor(session?.email);
  const [filter, setFilter] = useState<Filter>("All");

  const rows = useMemo(
    () =>
      (filter === "All" ? transactions : transactions.filter((tx) => tx.type === filter))
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filter],
  );

  const distributed = transactions
    .filter((tx) => tx.type === "Distribution")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const investedTotal = transactions
    .filter((tx) => tx.type === "Investment")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (transactions.length === 0) {
    return (
      <>
        <PageHeader title="Statements" description="Every distribution and investment on record." />
        <EmptyState
          icon={Receipt}
          title="No statements yet"
          description="Statements appear here once you hold a share. Each month you will find the distribution for the previous month's rent."
          action={{ label: "Browse listings", onClick: () => navigate({ to: "/marketplace" }) }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Statements"
        description="Every distribution and investment on record."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.info("PDF export is not connected yet", {
                description: "Document storage arrives with the database layer.",
              })
            }
          >
            <Download data-icon aria-hidden />
            Download PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total distributed" value={formatPHP(distributed)} hint="Lifetime, gross" />
        <StatCard
          label="Total invested"
          value={formatPHP(investedTotal)}
          hint="Across 3 properties"
        />
        <StatCard
          label="Net to date"
          value={formatPHP(distributed - investedTotal)}
          hint="Before fees and taxes"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <CardDescription>{rows.length} records</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
            {FILTERS.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "ghost"}
                onClick={() => setFilter(key)}
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
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{tx.date}</TableCell>
                    <TableCell className="font-medium">{tx.listingName}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "Distribution" ? "default" : "secondary"}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "Pending" ? "outline" : "secondary"}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tx.id}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        tx.amount >= 0 ? "text-emerald-700" : ""
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {formatPHP(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {filter.toLowerCase()} records yet.
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Distributions are shown gross. Management fees, repairs, and taxes are deducted before
            the amount reaches your balance.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
