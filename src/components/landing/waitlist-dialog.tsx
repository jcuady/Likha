import { useEffect, useRef, useState } from "react";
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
import {
  DELIVERY_COPY,
  INTEREST_COPY,
  storedEntries,
  submitWaitlist,
  webhookUrl,
  type Delivery,
  type Interest,
} from "@/lib/waitlist";

type Step = "form" | "sending" | "done";

/**
 * Capture step for the primary landing CTA.
 *
 * The confirmation never claims more than `delivery` supports. With no webhook
 * configured the address stays in this browser and the dialog says so; with one
 * configured it says what the request actually achieved.
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
  const [delivery, setDelivery] = useState<Delivery>("local");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<Interest>("investor");
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const onSubmit = async () => {
    if (!valid) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setStep("sending");
    const result = await submitWaitlist({ email, interest });
    // The visitor may have closed the dialog, or navigated away, while the
    // submit was in flight. Continuing to set state then either reopens the
    // success screen behind their back or writes into an unmounted component.
    if (!mounted.current) return;
    if (!result.ok) {
      setError(result.error);
      setStep("form");
      return;
    }
    setStep("done");
    setDelivery(result.delivery);
    onSubmitted?.();
  };

  /**
   * Every close goes through here. The Close button used to call
   * `setOpen(false)` directly, so the reset below never ran for it and a
   * second submit inside the same session started from the previous step
   * instead of the form.
   */
  const close = () => {
    setOpen(false);
    window.setTimeout(() => {
      setStep("form");
      setDelivery("local");
      setError(null);
    }, 200);
  };

  const onOpenChange = (next: boolean) => {
    // Escape and outside-click land here; opening is a plain setOpen.
    if (next) setOpen(true);
    else close();
  };

  const alreadyIn = storedEntries().length > 0;
  const connected = webhookUrl() !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 data-icon aria-hidden className="size-5 text-emerald-600" />
                {DELIVERY_COPY[delivery].title}
              </DialogTitle>
              <DialogDescription>
                {/* A promise to contact someone is only true when something was
                    actually transmitted. With `local` there is nowhere to
                    contact from, so the sentence changes rather than the
                    detail paragraph underneath carrying the truth alone. */}
                {delivery === "local"
                  ? "Nothing was sent anywhere. This address is kept in this browser only."
                  : interest === "investor"
                    ? "Likha will open the first batch to this list before it goes public."
                    : "Likha will get in touch about listing a property."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-secondary/50 p-4">
              <p className="text-sm font-medium">{email.trim()}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  {INTEREST_COPY[interest].label}.
                </span>{" "}
                {DELIVERY_COPY[delivery].detail}
              </p>
            </div>

            <DialogFooter>
              <Button onClick={close}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join the early list</DialogTitle>
              {/* The header must not promise a list that does not exist yet. */}
              <DialogDescription>
                {connected
                  ? "Likha opens its first listing batch to this list before it goes public. Free to join."
                  : "Likha opens its first listing batch before it goes public. This preview build keeps your address in this browser only."}
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
                  : connected
                    ? "Your address is sent to the Likha early list."
                    : "This is a preview build. Your address is kept in this browser and is not sent to a server."}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
