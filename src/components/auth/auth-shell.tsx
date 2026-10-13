import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { formatPHP } from "@/lib/currency";
import { batchStats, publicListings } from "@/lib/marketplace";

/** Mean gross yield across the live listings, shown in the brand panel. */
const batchAverageYield =
  publicListings.reduce((sum, l) => sum + l.yield, 0) / (batchStats.total || 1);

/**
 * Two-column frame shared by sign-in and sign-up: brand panel on the left,
 * form on the right. Collapses to a single column below 1024px.
 */
export function AuthShell({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div data-touch-targets="" className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-neutral-950 p-10 text-white lg:flex lg:min-w-0 lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 90% at 10% 0%, oklch(.56 .235 263 / .55), transparent 55%), radial-gradient(90% 80% at 100% 100%, oklch(.68 .16 340 / .38), transparent 60%)",
          }}
        />
        <Link to="/" className="relative flex min-w-0 items-center gap-3" aria-label="Likha home">
          <Logo label={null} className="size-9 rounded-lg bg-white/10 p-1" />
          <span className="font-editorial text-2xl">Likha</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
            Metro Manila property
          </p>
          <h2 className="mt-4 font-editorial text-4xl leading-tight">
            Own a share of the building, not the whole unit.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Rental income every month and an owned share of the property. Likha handles the
            screening, the tenants, and the repairs.
          </p>
        </div>

        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {/* Derived from the data so the panel cannot drift from the listings. */}
          {[
            [String(batchStats.total), "Live listings"],
            [formatPHP(2659800), "Invested to date"],
            [`${batchAverageYield.toFixed(1)}%`, "Average yield"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-editorial text-2xl">{value}</dt>
              <dd className="mt-1 text-xs text-white/55">{label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="flex min-w-0 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-8 flex min-h-11 items-center gap-3 lg:hidden"
            aria-label="Likha home"
          >
            <Logo label={null} />
            <span className="font-editorial text-xl">Likha</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
