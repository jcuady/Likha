import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatPHP } from "@/lib/currency";
import type { Listing } from "@/lib/marketplace";

type Step = "configure" | "confirming" | "done";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-medium" : "text-sm"}>{value}</dd>
    </div>
  );
}

/**
 * Simulated subscription flow. Nothing is charged and nothing is stored server
 * side: the dialog walks configure → confirming → done so the whole path is
 * reviewable before a payments provider exists.
 */
export function InvestDialog({ listing, trigger }: { listing: Listing; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [share, setShare] = useState(() => Math.max(1, Math.min(10, listing.available)));

  const numbers = useMemo(() => {
    const amount = Math.round((listing.price * share) / 100);
    const grossYear = Math.round((listing.rent * 12 * share) / 100);
    return {
      amount,
      grossYear,
      grossMonth: Math.round(grossYear / 12),
      fee: Math.round(amount * 0.015),
      total: amount + Math.round(amount * 0.015),
    };
  }, [listing, share]);

  const maxShare = Math.max(1, listing.available);
  const closed = listing.available === 0;

  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  const startConfirm = () => {
    setStep("confirming");
    timers.current.push(window.setTimeout(() => setStep("done"), 900));
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    // Cancel before resetting, not after. Two independent timers used to race:
    // cancel during "confirming" ran the 200ms reset, then the still-live 900ms
    // timer fired and set the step to "done" anyway. The dialog was closed so
    // nothing was visible, but reopening showed "Subscription recorded" for a
    // purchase the visitor had cancelled.
    if (!next) {
      clearTimers();
      timers.current.push(window.setTimeout(() => setStep("configure"), 200));
    }
  };

  // A pending timer firing into an unmounted component is the same defect
  // arriving by a different route.
  useEffect(() => clearTimers, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 data-icon aria-hidden className="size-5 text-emerald-600" />
                Subscription recorded
              </DialogTitle>
              <DialogDescription>
                This is a simulated marketplace. No payment was taken and nothing left your account.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border bg-secondary/50 p-4">
              <p className="text-sm font-medium">{listing.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {share}% share · {formatPHP(numbers.amount)} invested
              </p>
              <Separator className="my-3" />
              <p className="text-sm text-muted-foreground">
                Projected gross income {formatPHP(numbers.grossYear)} a year, distributed monthly.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{closed ? "Fully subscribed" : `Invest in ${listing.name}`}</DialogTitle>
              <DialogDescription>
                {closed
                  ? "This listing has no units left. Save it to be told when more open up."
                  : "Choose a share of the unit. You own part of the property and receive rent in proportion."}
              </DialogDescription>
            </DialogHeader>

            {!closed ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="share">Your share</Label>
                    <span className="font-editorial text-2xl leading-none">{share}%</span>
                  </div>
                  <Slider
                    id="share"
                    min={1}
                    max={maxShare}
                    step={1}
                    value={[share]}
                    onValueChange={(value) => setShare(value[0] ?? 1)}
                    aria-label="Share of the unit to buy"
                  />
                  <p className="text-xs text-muted-foreground">
                    {listing.available}% of this unit is still open. Minimum share is 1%.
                  </p>
                </div>

                <dl className="space-y-2 rounded-xl border bg-secondary/40 p-4">
                  <Row label="Unit price" value={formatPHP(listing.price)} />
                  <Row label={`Your ${share}% share`} value={formatPHP(numbers.amount)} strong />
                  <Row label="Processing fee (1.5%)" value={formatPHP(numbers.fee)} />
                  <Separator />
                  <Row label="Total" value={formatPHP(numbers.total)} strong />
                  <Separator />
                  <Row
                    label="Projected gross income"
                    value={`${formatPHP(numbers.grossYear)}/yr`}
                  />
                  <Row
                    label="Projected monthly income"
                    value={`${formatPHP(numbers.grossMonth)}/mo`}
                  />
                </dl>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Projections use the current asking rent and assume full occupancy. Net income will
                  be lower after taxes, management fees, and maintenance.
                </p>
              </>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              {closed ? null : (
                <Button onClick={startConfirm} disabled={step === "confirming"}>
                  {step === "confirming" ? (
                    <>
                      <Loader2 data-icon aria-hidden className="animate-spin" />
                      Processing
                    </>
                  ) : (
                    `Confirm ${formatPHP(numbers.total)}`
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
