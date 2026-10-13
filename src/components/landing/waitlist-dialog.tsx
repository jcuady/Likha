import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { INTEREST_COPY, storedEntries, submitWaitlist, type Interest } from "@/lib/waitlist";

type Step = "form" | "sending" | "done";

/**
 * Capture step for the primary landing CTA.
 *
 * The confirmation deliberately says the address was not sent to a server. It
 * is stored in this browser only until a waitlist destination is connected,
 * and claiming otherwise would be the one untruthful thing on the page.
 */
export function WaitlistDialog({
  trigger,
  onSubmitted,
}: {
  trigger: React.ReactNode;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<Interest>("investor");
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSubmit = async () => {
    if (!valid) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setStep("sending");
    const result = await submitWaitlist({ email, interest });
    if (!result.ok) {
      setError(result.error);
      setStep("form");
      return;
    }
    setStep("done");
    onSubmitted?.();
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      window.setTimeout(() => {
        setStep("form");
        setError(null);
      }, 200);
    }
  };

  const alreadyIn = storedEntries().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 data-icon aria-hidden className="size-5 text-emerald-600" />
                {interest === "investor" ? "You are on the list" : "We have your interest"}
              </DialogTitle>
              <DialogDescription>
                {interest === "investor"
                  ? "We will open the first batch to this list before it goes public."
                  : "We will get in touch about listing a property."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-secondary/50 p-4">
              <p className="text-sm font-medium">{email.trim()}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Saved in this browser as{" "}
                <span className="tabular-nums">{INTEREST_COPY[interest].label}</span>. Likha is a
                preview build with no server attached, so this address has not been transmitted
                anywhere yet. Nothing is charged and no account was created.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join the early list</DialogTitle>
              <DialogDescription>
                Likha opens its first listing batch to this list before it goes public. Free to
                join.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onSubmit();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="waitlist-email">Email</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "waitlist-error" : undefined}
                />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">What brings you here?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(INTEREST_COPY) as Interest[]).map((value) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors",
                        interest === value
                          ? "border-primary bg-secondary ring-1 ring-primary"
                          : "hover:bg-secondary/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="waitlist-interest"
                        value={value}
                        className="sr-only"
                        checked={interest === value}
                        onChange={() => setInterest(value)}
                      />
                      <span className="text-sm font-medium">{INTEREST_COPY[value].label}</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {INTEREST_COPY[value].blurb}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {error ? (
                <p id="waitlist-error" role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}

              <DialogFooter>
                <Button type="submit" disabled={!valid || step === "sending"}>
                  {step === "sending" ? (
                    <>
                      <Loader2 data-icon aria-hidden className="animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Join the early list"
                  )}
                </Button>
              </DialogFooter>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {alreadyIn
                  ? "You have already joined in this browser. Add a different address if this one is not yours."
                  : "This is a preview build. Your address is kept in this browser and is not sent to a server."}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
