import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/marketplace/listing-card";
import { listings } from "@/lib/marketplace";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/app/watchlist")({
  component: WatchlistPage,
});

function WatchlistPage() {
  const navigate = useNavigate();
  const { ids, clear } = useWatchlist();

  const saved = useMemo(
    () => ids.map((id) => listings.find((l) => l.id === id)).filter(Boolean),
    [ids],
  );

  const [confirmClear, setConfirmClear] = useState(false);

  const onClear = () => {
    clear();
    setConfirmClear(false);
    toast.success("Watchlist cleared");
  };

  return (
    <>
      <PageHeader
        title="Watchlist"
        description={
          saved.length > 0
            ? `${saved.length} saved ${saved.length === 1 ? "listing" : "listings"}. We will tell you when availability changes.`
            : "Save listings to compare them later."
        }
        actions={
          saved.length > 0 ? (
            <>
              <Button variant="outline" onClick={() => setConfirmClear(true)}>
                <Trash2 data-icon aria-hidden />
                Clear all
              </Button>
              <Button onClick={() => navigate({ to: "/marketplace" })}>Browse listings</Button>
            </>
          ) : null
        }
      />

      {saved.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing saved yet"
          description="Tap the star on any listing to keep it here. Your watchlist stays in this browser until you create an account on the real service."
          action={{ label: "Browse listings", onClick: () => navigate({ to: "/marketplace" }) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((listing) =>
            listing ? <ListingCard key={listing.id} listing={listing} /> : null,
          )}
        </div>
      )}
      {/* Wiping every saved listing is not undoable from this page, so it asks
          first and names what it is about to destroy. */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Clear {saved.length} saved {saved.length === 1 ? "listing" : "listings"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to find and star them again from the marketplace. This only clears this
              browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>Clear watchlist</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
