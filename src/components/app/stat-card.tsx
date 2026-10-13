import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  /** Signed percentage change; omit when there is nothing honest to compare against. */
  delta?: number;
  /** Short explanation of what `delta` measures, shown under the value. */
  hint?: string;
  icon?: LucideIcon;
  className?: string;
};

/**
 * A single KPI tile. `delta` is only rendered when a real comparison exists —
 * showing an arrow next to a static number reads as growth that never happened.
 */
export function StatCard({ label, value, delta, hint, icon: Icon, className }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className={cn("shadow-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon ? <Icon data-icon aria-hidden className="size-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <p className="font-editorial text-3xl leading-none">{value}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                positive ? "text-emerald-700" : "text-destructive",
              )}
            >
              {positive ? (
                <TrendingUp data-icon aria-hidden className="size-3.5" />
              ) : (
                <TrendingDown data-icon aria-hidden className="size-3.5" />
              )}
              {positive ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          ) : null}
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
