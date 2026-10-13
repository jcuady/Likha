import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  MapPin,
  Maximize,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPage } from "@/components/marketing/public-shell";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard, StatusBadge } from "@/components/marketplace/listing-card";
import { InvestDialog } from "@/components/marketplace/invest-dialog";
import { formatPHP } from "@/lib/currency";
import { listings, listingById } from "@/lib/marketplace";

export const Route = createFileRoute("/properties/$id")({
  loader: ({ params }) => {
    const listing = listingById(params.id);
    if (!listing) throw notFound();
    return { listing };
  },
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { listing } = Route.useLoaderData();
  const navigate = useNavigate();
  const similar = listings.filter((l) => l.city === listing.city && l.id !== listing.id);

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      void navigator.share({ title: listing.name, text: listing.description, url }).catch(() => {});
      return;
    }
    void navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy the link"));
  };

  return (
    <PublicPage>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/marketplace" })}
        className="-ml-2"
      >
        <ArrowLeft data-icon aria-hidden />
        Back to marketplace
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
              <img
                src={listing.image}
                alt={`${listing.name} in ${listing.location}`}
                className="size-full object-cover"
              />
              <div className="absolute left-4 top-4">
                <StatusBadge status={listing.status} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-editorial text-4xl leading-tight">{listing.name}</h1>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin data-icon aria-hidden className="size-4" />
                  {listing.location}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={share} aria-label="Share this listing">
                <Share2 data-icon />
              </Button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: BedDouble, label: "Bedrooms", value: String(listing.beds) },
                { icon: Bath, label: "Bathrooms", value: String(listing.baths) },
                { icon: Maximize, label: "Floor area", value: `${listing.area} m²` },
                { icon: Building2, label: "Type", value: listing.type },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border bg-card p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon data-icon aria-hidden className="size-3.5" />
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="numbers">Numbers</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {listing.description}
                  </p>
                  <Separator className="my-5" />
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Asking price</p>
                      <p className="mt-1 font-editorial text-2xl">{formatPHP(listing.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly rent</p>
                      <p className="mt-1 font-editorial text-2xl">{formatPHP(listing.rent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Already invested</p>
                      <p className="mt-1 flex items-center gap-1.5 font-medium">
                        <Users data-icon aria-hidden className="size-4 text-muted-foreground" />
                        {listing.investors} investors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="numbers" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">How the return is built</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {[
                    ["Gross annual rent", formatPHP(listing.rent * 12)],
                    ["Gross yield on price", `${listing.yield.toFixed(1)}%`],
                    ["Gross income per 1% share", formatPHP((listing.rent * 12) / 100)],
                    ["Cost per 1% share", formatPHP(listing.price / 100)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Gross figures only. Net income is lower after taxes, management fees, repairs,
                    and vacancy. Projections assume the current rent holds for a full year.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="amenities" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {listing.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2 text-sm">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary">
                          <Check data-icon aria-hidden className="size-3 text-primary" />
                        </span>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-5" />
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays data-icon aria-hidden className="size-3.5" />
                    Listings are reviewed before they open. Availability can change during an open
                    batch.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky investment panel */}
        <aside className="lg:sticky lg:top-24">
          <Card className="shadow-lift">
            <CardContent className="flex flex-col gap-5 p-6">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Asking price</p>
                    <p className="font-editorial text-3xl leading-none">
                      {formatPHP(listing.price)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp data-icon aria-hidden className="size-3" />
                    {listing.yield.toFixed(1)}%
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatPHP(listing.rent)} per month · {listing.available}% still open
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Subscribed</span>
                  <span className="font-medium">{100 - listing.available}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={100 - listing.available}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Percentage subscribed"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${100 - listing.available}%` }}
                  />
                </div>
              </div>

              <InvestDialog
                listing={listing}
                trigger={
                  <Button size="lg" className="w-full" disabled={listing.available === 0}>
                    {listing.available === 0
                      ? "Fully subscribed"
                      : `Invest from ${formatPHP(listing.price / 100)}`}
                  </Button>
                }
              />

              <p className="text-xs leading-relaxed text-muted-foreground">
                A 1% share costs {formatPHP(listing.price / 100)} and projects{" "}
                {formatPHP((listing.rent * 12) / 100)} a year in gross rent. Property investment
                carries risk, including loss of capital.
              </p>

              <Button variant="outline" asChild className="w-full">
                <Link to="/marketplace">Keep browsing</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="flex flex-col gap-4 border-t pt-6">
          <div>
            <h2 className="font-editorial text-2xl">More in {listing.city}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Other units from the same batch in this city.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}
    </PublicPage>
  );
}
