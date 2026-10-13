import { formatPHP } from "@/lib/currency";

export function RevenueChart({ mode = 1 }: { mode?: number }) {
  const values =
    [
      [45, 72, 61, 92, 113, 75, 100],
      [77, 64, 101, 64, 121, 70, 100],
      [52, 68, 78, 89, 120, 97, 110],
    ][mode] ?? [];
  return (
    <div className="revenue-card">
      <div className="revenue-label">
        <span>{["Market value", "Revenue", "Portfolio growth"][mode]}</span>
        <span>···</span>
      </div>
      <div className="revenue-value">{[formatPHP(1284500), formatPHP(96437), "+12.8%"][mode]}</div>
      <div className="revenue-caption">
        <span className="gain">↑ {["8.2%", "18.4%", "3.6%"][mode]}</span>
        <span>vs last {mode === 1 ? "week" : "month"}</span>
      </div>
      <div className="chart-plot">
        {values.map((height, i) => (
          <div key={i} className={`chart-bar bar-height-${height} ${i === 4 ? "active" : ""}`}>
            {i === 4 && <span>+20%</span>}
          </div>
        ))}
        <svg
          viewBox="0 0 260 134"
          preserveAspectRatio="none"
          aria-label="Illustrative revenue trend"
        >
          <path
            className="trend-path"
            d="M0 119 Q25 82 48 98 T95 108 T139 85 T179 90 T221 99 T260 85"
          />
        </svg>
      </div>
      <div className="chart-days">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <span key={d} className={i === 4 ? "active" : ""}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
export function AgentWidget({
  name = "Bruce Walker",
  amount = 242491,
}: {
  name?: string;
  amount?: number;
}) {
  return (
    <div className="agent-widget">
      <div className="agent-head">
        <span className="agent-name">
          <span className="avatar">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          {name}
        </span>
        <span>{formatPHP(amount)}</span>
      </div>
      <div className="ticks" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="agent-foot">
        <span>
          <i className="live-dot" />
          Closed · Projected
        </span>
        <span>↗ 27 &nbsp; · &nbsp; 18</span>
      </div>
    </div>
  );
}
export function MiniChart() {
  return (
    <div className="mini-chart">
      <div className="mini-chart-title">
        <span>Market trends</span>
        <span>↗ 12.8%</span>
      </div>
      <svg viewBox="0 0 240 100" aria-label="Illustrative market growth chart">
        <path className="grid-line" d="M0 25H240 M0 50H240 M0 75H240" />
        <path
          className="mini-line"
          d="M0 83L20 69L40 74L60 42L80 52L100 32L120 42L140 21L160 38L180 34L200 59L220 45L240 24L240 100L0 100Z"
        />
      </svg>
      <div className="chart-days">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
      </div>
    </div>
  );
}
