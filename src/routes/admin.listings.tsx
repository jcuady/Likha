import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, MoreHorizontal, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { type Listing, type ListingStatus, listings as seed } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListings,
});

type Draft = { id: string; name: string; price: string; rent: string; status: ListingStatus };

function AdminListings() {
  const [rows, setRows] = useState<Listing[]>(seed);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);
  const fallbackImage = seed[0]?.image ?? "";

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needle && !`${row.name} ${row.location}`.toLowerCase().includes(needle)) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [rows, query, status]);

  const openUnits = rows.reduce((sum, row) => sum + row.available, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.price, 0);

  const patch = (id: string, changes: Partial<Listing>, message: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));
    toast.success(message);
  };

  const saveDraft = () => {
    if (!editing) return;
    const price = Number(editing.price.replace(/[^\d]/g, ""));
    const rent = Number(editing.rent.replace(/[^\d]/g, ""));
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rent) || rent <= 0) {
      toast.error("Price and rent must both be numbers above zero");
      return;
    }
    patch(
      editing.id,
      { name: editing.name.trim() || "Untitled", price, rent, status: editing.status },
      `${editing.name} updated`,
    );
    setEditing(null);
  };

  const createListing = () => {
    const draft: Draft = {
      id: `lk-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: "New listing",
      price: "",
      rent: "",
      status: "Draft",
    };
    setEditing(draft);
    setCreating(true);
  };

  const commitCreate = () => {
    if (!editing) return;
    const price = Number(editing.price.replace(/[^\d]/g, ""));
    const rent = Number(editing.rent.replace(/[^\d]/g, ""));
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rent) || rent <= 0) {
      toast.error("A new listing needs a price and a rent before it can be saved");
      return;
    }
    setRows((current) => [
      ...current,
      {
        id: editing.id,
        name: editing.name.trim() || "New listing",
        location: "Location to be confirmed",
        city: "Taguig",
        description: "Description pending review.",
        price,
        rent,
        status: editing.status,
        beds: 2,
        baths: 2,
        area: 90,
        yield: Number(((rent * 12 * 100) / price).toFixed(1)),
        available: 100,
        investors: 0,
        image: fallbackImage,
        type: "Condo",
        amenities: [],
      },
    ]);
    toast.success(`${editing.name} created as ${editing.status}`);
    setEditing(null);
    setCreating(false);
  };

  const remove = (listing: Listing) => {
    setRows((current) => current.filter((row) => row.id !== listing.id));
    toast.success(`${listing.name} removed`, { description: "Only from this demo session." });
  };

  return (
    <>
      <PageHeader
        title="Listings"
        description={`${rows.length} properties · ${openUnits}% of units still open across ${formatPHP(totalValue)} of asset value.`}
        actions={
          <Button onClick={createListing}>
            <Plus data-icon aria-hidden />
            New listing
          </Button>
        }
      />

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
                placeholder="Search listings"
                aria-label="Search listings"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Filter by status" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(["Available", "Under Offer", "Fully Subscribed", "Draft"] as const).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead className="min-w-[9rem]">Subscribed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={listing.image}
                          alt=""
                          aria-hidden
                          className="size-9 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{listing.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {listing.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatPHP(listing.price)}</TableCell>
                    <TableCell className="tabular-nums">{formatPHP(listing.rent)}</TableCell>
                    <TableCell className="tabular-nums">{listing.yield.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={100 - listing.available} className="h-1.5 flex-1" />
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums">
                          {100 - listing.available}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${listing.name}`}
                          >
                            <MoreHorizontal data-icon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onSelect={() => {
                                setCreating(false);
                                setEditing({
                                  id: listing.id,
                                  name: listing.name,
                                  price: String(listing.price),
                                  rent: String(listing.rent),
                                  status: listing.status,
                                });
                              }}
                            >
                              <Pencil data-icon aria-hidden />
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/properties/$id" params={{ id: listing.id }}>
                                <Search data-icon aria-hidden />
                                View public page
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={listing.status !== "Draft"}
                              onSelect={() =>
                                patch(
                                  listing.id,
                                  { status: "Available" },
                                  `${listing.name} is now live`,
                                )
                              }
                            >
                              <Send data-icon aria-hidden />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={listing.status === "Draft"}
                              onSelect={() =>
                                patch(
                                  listing.id,
                                  { status: "Draft" },
                                  `${listing.name} moved back to draft`,
                                )
                              }
                            >
                              <Check data-icon aria-hidden />
                              Unpublish
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={() => remove(listing)}
                          >
                            <Trash2 data-icon aria-hidden />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No listings match that search.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {creating ? "New listing" : `Edit ${editing?.name ?? "listing"}`}
            </DialogTitle>
            <DialogDescription>
              Changes apply to this browser session only. Nothing is persisted until a database is
              connected.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="listing-name">Name</Label>
              <Input
                id="listing-name"
                value={editing?.name ?? ""}
                onChange={(event) =>
                  setEditing((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="listing-price">Price (₱)</Label>
                <Input
                  id="listing-price"
                  inputMode="numeric"
                  placeholder="28500000"
                  value={editing?.price ?? ""}
                  onChange={(event) =>
                    setEditing((current) =>
                      current ? { ...current, price: event.target.value } : current,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="listing-rent">Monthly rent (₱)</Label>
                <Input
                  id="listing-rent"
                  inputMode="numeric"
                  placeholder="85000"
                  value={editing?.rent ?? ""}
                  onChange={(event) =>
                    setEditing((current) =>
                      current ? { ...current, rent: event.target.value } : current,
                    )
                  }
                />
              </div>
            </div>

            {editing && Number(editing.rent) > 0 && Number(editing.price) > 0 ? (
              <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                Gross yield at these numbers:{" "}
                <span className="font-medium text-foreground">
                  {((Number(editing.rent) * 12 * 100) / Number(editing.price) || 0).toFixed(1)}%
                </span>
                . Every open listing above 4.0% passes review.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="listing-status">Status</Label>
              <Select
                value={editing?.status ?? "Draft"}
                onValueChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, status: value as ListingStatus } : current,
                  )
                }
              >
                <SelectTrigger id="listing-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(["Draft", "Available", "Under Offer", "Fully Subscribed"] as const).map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={creating ? commitCreate : saveDraft}>
              {creating ? "Create listing" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
