import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPHP } from "@/lib/currency";
import { type InvestorRow, investors as seed } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/investors")({
  component: AdminInvestors,
});

const KYC_STATES = ["Verified", "In review", "Not started"] as const;

export function KycBadge({ state }: { state: InvestorRow["kyc"] }) {
  return (
    <Badge
      variant={state === "Verified" ? "default" : state === "In review" ? "secondary" : "outline"}
    >
      {state}
    </Badge>
  );
}

function AdminInvestors() {
  const [rows, setRows] = useState<InvestorRow[]>(seed);
  const [query, setQuery] = useState("");
  const [kyc, setKyc] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !`${row.name} ${row.email}`.toLowerCase().includes(needle)) return false;
      if (kyc !== "all" && row.kyc !== kyc) return false;
      return true;
    });
  }, [rows, query, kyc]);

  const capital = rows.reduce((sum, row) => sum + row.invested, 0);
  const pending = rows.filter((row) => row.kyc !== "Verified").length;
  const verified = rows.length - pending;

  const setState = (id: string, next: InvestorRow["kyc"], name: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, kyc: next } : row)));
    toast.success(`${name} marked ${next.toLowerCase()}`);
  };

  return (
    <>
      <PageHeader
        title="Investors"
        description={`${rows.length} accounts · ${verified} fully verified · ${formatPHP(capital)} deployed`}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus data-icon aria-hidden />
                Add investor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <InviteDialog
                onInvite={(name, email) => {
                  setRows((current) => [
                    ...current,
                    {
                      id: `in-${String(current.length + 1).padStart(2, "0")}`,
                      name,
                      email,
                      invested: 0,
                      holdings: 0,
                      joined: new Date().toISOString().slice(0, 10),
                      kyc: "Not started",
                    },
                  ]);
                  toast.success(`Invite prepared for ${email}`, {
                    description:
                      "Sending is not connected yet. The account exists in this session.",
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Accounts" value={String(rows.length)} icon={Users} />
        <StatCard
          label="Capital deployed"
          value={formatPHP(capital)}
          delta={11.4}
          hint="vs. last month"
        />
        <StatCard
          label="Awaiting KYC"
          value={String(pending)}
          hint={`${verified} verified`}
          icon={ShieldCheck}
        />
      </div>

      <Card className="shadow-card">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                data-icon
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
                aria-label="Search investors"
                className="pl-9"
              />
            </div>
            <Select value={kyc} onValueChange={setKyc}>
              <SelectTrigger aria-label="Filter by verification" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All verifications</SelectItem>
                  {KYC_STATES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Holdings</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((investor) => (
                  <TableRow key={investor.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{investor.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{investor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{investor.joined}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPHP(investor.invested)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{investor.holdings}</TableCell>
                    <TableCell>
                      <KycBadge state={investor.kyc} />
                    </TableCell>
                    <TableCell className="text-right">
                      {investor.kyc === "Verified" ? (
                        <span className="text-xs text-muted-foreground">Cleared</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setState(investor.id, "Verified", investor.name)}
                        >
                          <ShieldCheck data-icon aria-hidden />
                          Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No investors match"
              description="Try a different name, email, or verification filter."
              className="border-0 py-8"
              action={{
                label: "Clear filters",
                onClick: () => {
                  setQuery("");
                  setKyc("all");
                },
              }}
            />
          ) : null}

          <Separator />

          <p className="text-xs leading-relaxed text-muted-foreground">
            Verification marks an account as cleared for subscription. In production this would be
            backed by submitted identity documents and an automated check, not a button.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function InviteDialog({ onInvite }: { onInvite: (name: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const valid = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add an investor</DialogTitle>
        <DialogDescription>
          Creates an account in this session and prepares an invitation. Email delivery is not
          connected.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-name">Full name</Label>
          <Input
            id="invite-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Juan Dela Cruz"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="juan@example.com"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          disabled={!valid}
          onClick={() => {
            onInvite(name.trim(), email.trim());
            setName("");
            setEmail("");
          }}
        >
          <Mail data-icon aria-hidden />
          Add investor
        </Button>
      </DialogFooter>
    </>
  );
}
