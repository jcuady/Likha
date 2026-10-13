import { Apple, Play, ShieldCheck, Wallet, Building2 } from "lucide-react";

import { PhoneMockup } from "@/components/brand/phone-mockup";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Choose a property",
    body: "Every listing shows the asking price, the current rent, the gross yield, and how much of the unit is still open. Nothing is held back.",
  },
  {
    n: "02",
    title: "Buy the share you can afford",
    body: "Shares start at one percent. A 1% share of a ₱28.5M Makati unit costs ₱285,000 and projects about ₱102,000 a year in gross rent.",
  },
  {
    n: "03",
    title: "We run the property",
    body: "Likha screens the tenant, collects the rent, and pays for repairs before anything is distributed to you on the last day of each month.",
  },
];

const APP_FEATURES = [
  { icon: Wallet, text: "Rent, distributions, and running totals in one place" },
  { icon: Building2, text: "Every property you hold, with the share you own" },
  { icon: ShieldCheck, text: "Documents, statements, and KYC status" },
];

/** Three-step explainer. Sits between the insight tabs and the app section. */
export function HowItWorks() {
  return (
    <section id="how" className="w-full bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </span>
          <h2 className="mt-4 font-editorial text-4xl leading-tight text-balance md:text-5xl">
            Three steps from browsing to monthly income
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No minimum balance and no subscription fee. You commit to one property at a time and can
            hold as many as you like.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="relative flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-card"
            >
              <span className="font-editorial text-3xl leading-none text-primary">{step.n}</span>
              <h3 className="text-lg font-medium">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * App download panel. The store buttons are honest about release state: they
 * explain that the build is not published instead of linking to a dead store
 * page or faking an install.
 */
export function AppDownload({
  onNotAvailable,
}: {
  onNotAvailable: (title: string, body: string) => void;
}) {
  return (
    <section id="app" className="w-full bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lift">
          <div className="grid items-center gap-12 p-8 md:p-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                The Likha app
              </span>
              <h2 className="mt-4 font-editorial text-4xl leading-tight text-balance md:text-5xl">
                Your portfolio, on your phone
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                Watch rent come in, check what each property is doing, and download statements
                without opening a spreadsheet.
              </p>

              <ul className="mt-7 flex flex-col gap-3">
                {APP_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/85">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
                      <Icon data-icon aria-hidden className="size-3.5 text-white" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <StoreButton
                  icon={Apple}
                  label="App Store"
                  sub="iOS"
                  onClick={() =>
                    onNotAvailable(
                      "The iOS app is not published yet",
                      "Join the early list and we will send a TestFlight link when the build is ready.",
                    )
                  }
                />
                <StoreButton
                  icon={Play}
                  label="Google Play"
                  sub="Android"
                  onClick={() =>
                    onNotAvailable(
                      "The Android app is not published yet",
                      "Join the early list and we will notify you the moment the listing opens.",
                    )
                  }
                />
              </div>

              <p className="mt-5 text-xs text-white/45">
                The app is in closed testing. These buttons explain where to sign up.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <PhoneMockup className="w-[260px] sm:w-[300px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoreButton({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: typeof Apple;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="glass"
      size="lg"
      onClick={onClick}
      className="h-auto gap-3 border-white/20 bg-white/10 px-5 py-3 text-white hover:bg-white/15"
    >
      <Icon data-icon aria-hidden className="size-6 text-white" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-white/60">{sub}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
    </Button>
  );
}
