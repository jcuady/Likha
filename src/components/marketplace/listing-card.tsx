import { Link, useNavigate } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Maximize, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPHP } from "@/lib/currency";
import { type Listing, type ListingStatus } from "@/lib/marketplace";
import { useWatchlist } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

const statusVariant: Record<ListingStatus, "default" | "secondary" | "outline"> = {
  Available: "default",
  "Under Offer": "secondary",
  "Fully Subscribed": "outline",
  Draft: "outline",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <Badge variant={statusVariant[status]} className="backdrop-blur-sm">
      {status}
    </Badge>
  );
}

type ListingCardProps = {
  listing: Listing;
  /** Hides the star toggle on surfaces where saving is not offered. */
  savable?: boolean;
  /** Extra line under the location, e.g. the investor's share of the unit. */
  footnote?: React.ReactNode;
  className?: string;
};

export function ListingCard({ listing, savable = true, footnote, className }: ListingCardProps) {
  const { has, toggle } = useWatchlist();
  const navigate = useNavigate();
  const saved = has(listing.id);

  const onToggleSave = () => {
    toggle(listing.id);
    toast(saved ? "Removed from watchlist" : "Saved to watchlist", {
      description: listing.name,
      action: { label: "View watchlist", onClick: () => navigate({ to: "/app/watchlist" }) },
    });
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden shadow-card transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={listing.image}
          alt={`${listing.name} in ${listing.location}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <StatusBadge status={listing.status} />
          {savable ? (
            <Button
              variant="glass"
              size="icon"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${listing.name} from watchlist` : `Save ${listing.name}`}
              className="relative z-10 size-11 shrink-0 sm:size-9"
            >
              <Star
                data-icon
                aria-hidden
                className={cn(saved && "fill-current text-amber-500 text-amber-500")}
              />
            </Button>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="font-editorial text-lg leading-none text-white">
            {listing.yield.toFixed(1)}%
            <span className="ml-1.5 font-sans text-[11px] font-normal text-white/80">
              annual yield
            </span>
          </p>
          <p className="text-xs text-white/85">{listing.available}% open</p>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-medium leading-snug">
            <Link
              to="/properties/$id"
              params={{ id: listing.id }}
              className="after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {listing.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin data-icon aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </p>
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BedDouble data-icon aria-hidden className="size-3.5" />
            <dd>
              {listing.beds} bed{listing.beds === 1 ? "" : "s"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath data-icon aria-hidden className="size-3.5" />
            <dd>{listing.baths} bath</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize data-icon aria-hidden className="size-3.5" />
            <dd>{listing.area} m²</dd>
          </div>
        </dl>

        <div className="mt-auto border-t pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">{formatPHP(listing.price)}</p>
            <p className="text-xs text-muted-foreground">{formatPHP(listing.rent)}/mo</p>
          </div>
          {footnote ? (
            <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {listing.investors} investor{listing.investors === 1 ? "" : "s"} holding
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
