import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatPHP } from "@/lib/currency";

/** Compact peso axis label: â‚±1.2M rather than â‚±1,245,000. */
export function compactPHP(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `â‚±${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `â‚±${Math.round(value / 1_000)}k`;
  return formatPHP(value);
}

const trendConfig = {
  value: { label: "Portfolio value", color: "var(--primary)" },
} satisfies ChartConfig;

export function PortfolioTrend({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ChartContainer config={trendConfig} className="h-64 w-full min-w-0">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickMargin={4}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={compactPHP}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              indicator="line"
              formatter={(value) => formatPHP(Number(value))}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#portfolio-fill)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const incomeConfig = {
  amount: { label: "Rental income", color: "var(--rose-line)" },
} satisfies ChartConfig;

export function IncomeBars({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ChartContainer config={incomeConfig} className="h-64 w-full min-w-0">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickMargin={4}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={compactPHP}
        />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel cursor={{ fill: "var(--secondary)" }} />}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={34}>
          {data.map((entry, index) => (
            <Cell
              key={entry.month}
              fill={index === data.length - 1 ? "var(--rose-line)" : "var(--rose-line)"}
              fillOpacity={index === data.length - 1 ? 1 : 0.42}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export type Slice = { name: string; value: number };

const PALETTE = [
  "var(--primary)",
  "var(--rose-line)",
  "var(--peach)",
  "var(--lilac)",
  "var(--mint)",
];

/**
 * Donut with the total in the middle. `centerLabel` sits under the number so the
 * reader knows what the number means without a legend.
 */
export function DonutChart({
  data,
  centerValue,
  centerLabel,
  height = 200,
}: {
  data: Slice[];
  centerValue: string;
  centerLabel: string;
  height?: number;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ height, width: height }}>
        <ChartContainer config={{}} className="size-full min-w-0">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="name"
                  formatter={(value, name) => [`${value}`, String(name)]}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((slice, index) => (
                <Cell key={slice.name} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="font-editorial text-2xl leading-none">{centerValue}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{centerLabel}</p>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((slice, index) => (
          <li key={slice.name} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: PALETTE[index % PALETTE.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
            <span className="shrink-0 font-medium">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
