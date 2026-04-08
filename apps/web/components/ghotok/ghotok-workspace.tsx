"use client";

import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import { translateProfileStatus } from "@/lib/translate";
import type { GhotokDashboardResponse } from "@/lib/types/ghotok";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export { type GhotokDashboardResponse };

export function GhotokWorkspace({
  data,
  locale = null,
}: {
  data: GhotokDashboardResponse;
  locale?: PublicLocale | null;
}) {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Ghotok Dashboard", "ঘটক ড্যাশবোর্ড")}</p>
            <h2>{data.profile.displayName}</h2>
          </div>
          <Badge tone="leaf">{translateProfileStatus(data.profile.status, locale)}</Badge>
        </div>

        <div className="dashboard-stats">
          <StatCard value={data.wallet.balance} label={localeText(locale, "Credit balance", "ক্রেডিট ব্যালেন্স")} />
          <StatCard
            value={data.managedCounts.reduce((total, item) => total + item._count.status, 0)}
            label={localeText(locale, "Managed members", "ম্যানেজড মেম্বার")}
          />
        </div>

        <div className="tag-list">
          <span className="tag">{data.profile.email}</span>
          {data.profile.phone ? <span className="tag">{data.profile.phone}</span> : null}
        </div>
      </article>
    </section>
  );
}
