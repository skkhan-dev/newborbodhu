"use client";

type StatTone = "default" | "rose" | "gold" | "leaf" | "teal" | "indigo";

export function StatCard({
  value,
  label,
  trend,
  tone = "default",
}: {
  value: string | number;
  label: string;
  trend?: { value: string; positive?: boolean };
  tone?: StatTone;
}) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
      {trend && (
        <span
          className={`stat-trend ${trend.positive ? "stat-trend-up" : "stat-trend-down"}`}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </div>
  );
}
