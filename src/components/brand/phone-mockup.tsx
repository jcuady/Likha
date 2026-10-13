import { cn } from "@/lib/utils";

/**
 * Device frame for the app-download section. The screen is composed from real
 * data and real markup rather than a bitmap, so it stays sharp at any density
 * and updates with the marketplace when the numbers change.
 */
export function PhoneMockup({
  className,
  statusBarTime = "9:41",
}: {
  className?: string;
  statusBarTime?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Outer titanium frame */}
      <div
        className="relative rounded-[3.2rem] p-[3px] shadow-[0_40px_90px_-20px_rgba(9,12,28,0.55),0_0_0_1px_rgba(255,255,255,0.14)]"
        style={{
          background:
            "linear-gradient(150deg,#e8e9ef 0%,#9aa0b4 18%,#5c6178 42%,#c9ccd8 62%,#6a6f86 82%,#dfe1ea 100%)",
        }}
      >
        {/* Inner bezel */}
        <div className="relative rounded-[3.05rem] bg-[#0b0d16] p-[2px]">
          {/* Screen */}
          <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.95rem] bg-background">
            {/* Status bar */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 pt-4 text-[11px] font-medium text-foreground">
              <span>{statusBarTime}</span>
              <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0b0d16]" />
              <span className="flex items-center gap-1">
                <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="1" />
                  <rect x="4" y="5" width="3" height="6" rx="1" />
                  <rect x="8" y="2.5" width="3" height="8.5" rx="1" />
                  <rect x="12" y="0" width="3" height="11" rx="1" opacity="0.35" />
                </svg>
                <svg width="23" height="11" viewBox="0 0 23 11" aria-hidden fill="currentColor">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="19"
                    height="10"
                    rx="3"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.4"
                  />
                  <rect x="2" y="2" width="14" height="7" rx="1.5" />
                  <path d="M21 4v3a1.8 1.8 0 000-3z" />
                </svg>
              </span>
            </div>

            <ScreenContent />
          </div>
        </div>
      </div>

      {/* Screen glare */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[3.05rem] opacity-70"
        style={{
          background:
            "linear-gradient(115deg,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0.06) 22%,transparent 40%)",
        }}
      />
    </div>
  );
}

function ScreenContent() {
  return (
    <div className="flex h-full flex-col pt-11 text-[11px]">
      {/* App header */}
      <div className="flex items-center justify-between px-5 pb-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Portfolio</p>
          <p className="font-editorial text-xl leading-tight">₱2.66M</p>
        </div>
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
          AR
        </span>
      </div>

      {/* Yield card */}
      <div className="mx-4 rounded-2xl bg-neutral-950 p-4 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.14em] text-white/55">This month</p>
          <p className="text-[9px] text-emerald-300">+6.2%</p>
        </div>
        <p className="mt-1 font-editorial text-[26px] leading-none">₱9,450</p>
        <p className="mt-1 text-[9px] text-white/55">Rental income received</p>
        <div className="mt-3 flex h-10 items-end gap-[3px]">
          {[38, 52, 46, 61, 58, 70, 66, 78, 74, 86, 82, 96].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h}%`,
                background:
                  i === 11
                    ? "linear-gradient(180deg,#fff,rgba(255,255,255,0.55))"
                    : "rgba(255,255,255,0.32)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Holdings */}
      <p className="px-5 pb-1.5 pt-4 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Your holdings
      </p>
      <ul className="flex flex-col gap-2 px-4">
        {[
          ["The Horizon House", "Boracay", "₱1,085,000", "6.3%"],
          ["Villa Redwood", "Batangas", "₱756,000", "4.4%"],
          ["The Sandbar", "La Union", "₱268,800", "5.9%"],
        ].map(([name, place, value, yld], i) => (
          <li
            key={name}
            className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-2.5"
          >
            <span
              aria-hidden
              className="size-8 shrink-0 rounded-lg"
              style={{
                background: [
                  "linear-gradient(140deg,#cfe0f2,#8fb4d8)",
                  "linear-gradient(140deg,#f2ddc8,#d8ab84)",
                  "linear-gradient(140deg,#d9e8dd,#9ec2a9)",
                ][i],
              }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium leading-tight">{name}</span>
              <span className="block text-[9px] text-muted-foreground">{place}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-medium leading-tight">{value}</span>
              <span className="block text-[9px] text-muted-foreground">{yld} yield</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Bottom nav */}
      <div className="mt-auto flex items-center justify-around border-t border-border/70 bg-card/90 px-2 pb-3 pt-2 backdrop-blur">
        {[
          ["Home", "M3 10.5 12 3l9 7.5V21H3z"],
          ["Browse", "M3 5h18M3 12h18M3 19h18"],
          ["Wallet", "M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"],
          ["You", "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"],
        ].map(([label, d], i) => (
          <span key={label} className="flex flex-col items-center gap-1 px-2">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke={i === 0 ? "var(--primary)" : "var(--muted-foreground)"}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={d} />
            </svg>
            <span
              className="text-[8px] font-medium"
              style={{ color: i === 0 ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact stat used beside the device in the download section. */
export function MockupStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-editorial text-2xl leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
