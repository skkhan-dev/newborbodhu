"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type VisitorItem = {
  id: string;
  visitedAt: string;
  visitor: {
    id: string;
    displayId: string;
    displayName: string;
    age: number | null;
    currentCity: string | null;
    primaryPhotoUrl: string | null;
  };
};

export function MemberVisitorsPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiRequest<VisitorItem[]>(
        "/member-profiles/me/visitors",
        { token: accessToken },
      );
      setVisitors(response);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page-shell">
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-kicker">{localeText(locale, "Profile Visitors", "প্রোফাইল ভিজিটর")}</p>
          <h2>{localeText(locale, "Who viewed your profile", "কে আপনার প্রোফাইল দেখেছে")}</h2>
        </div>
      </div>

      {loading ? (
        <div className="stack-list">
          <Skeleton variant="card" count={4} height="70px" />
        </div>
      ) : visitors.length === 0 ? (
        <div className="empty-state">
          {localeText(locale, "No one has visited your profile yet.", "এখনও কেউ আপনার প্রোফাইল দেখেনি।")}
        </div>
      ) : (
        <div className="stack-list">
          {visitors.map((v) => (
            <Link
              key={v.id}
              href={localizePath(`/profiles/${v.visitor.displayId}`, locale)}
              className="mini-card mini-card-horizontal"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="mini-card-body" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
                <Avatar
                  src={v.visitor.primaryPhotoUrl}
                  name={v.visitor.displayName}
                  size="md"
                  seed={v.visitor.displayId}
                />
                <div style={{ flex: 1 }}>
                  <strong>{v.visitor.displayName}</strong>
                  <p className="mini-text">
                    {v.visitor.displayId}
                    {v.visitor.age ? ` • ${v.visitor.age} yrs` : ""}
                    {v.visitor.currentCity ? ` • ${v.visitor.currentCity}` : ""}
                  </p>
                </div>
                <span className="hint">{formatDateTime(v.visitedAt, locale)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
