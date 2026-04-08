"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type PhotoRequestItem = {
  id: string;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    displayId: string;
    displayName: string;
    primaryPhotoUrl: string | null;
  };
};

export function MemberPhotoRequestsPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PhotoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiRequest<PhotoRequestItem[]>(
        "/member-profiles/me/photo-requests",
        { token: accessToken },
      );
      setRequests(response);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDecision(requestId: string, action: "grant" | "deny") {
    if (!accessToken) return;
    setBusyId(requestId);
    try {
      await apiRequest(`/member-profiles/me/photo-requests/${requestId}/decision`, {
        method: "POST",
        token: accessToken,
        body: { decision: action === "grant" ? "GRANTED" : "DENIED" },
      });
      toast(
        action === "grant"
          ? localeText(locale, "Photo access granted.", "ছবির অ্যাক্সেস দেওয়া হয়েছে।")
          : localeText(locale, "Photo access denied.", "ছবির অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে।"),
        action === "grant" ? "success" : "info",
      );
      void load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING");

  return (
    <main className="page-shell">
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-kicker">{localeText(locale, "Photo Requests", "ছবির অনুরোধ")}</p>
          <h2>{localeText(locale, "Private photo access requests", "প্রাইভেট ছবির অ্যাক্সেস অনুরোধ")}</h2>
        </div>
        {pending.length > 0 && <Badge tone="rose">{pending.length} {localeText(locale, "pending", "অপেক্ষমাণ")}</Badge>}
      </div>

      {loading ? (
        <div className="stack-list">
          <Skeleton variant="card" count={3} height="70px" />
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          {localeText(locale, "No photo access requests.", "কোনো ছবি দেখার অনুরোধ নেই।")}
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <p className="hint" style={{ marginBottom: 8 }}>
                {localeText(locale, "Pending requests", "অপেক্ষমাণ অনুরোধ")}
              </p>
              <div className="stack-list" style={{ marginBottom: 24 }}>
                {pending.map((req) => (
                  <article key={req.id} className="mini-card mini-card-horizontal">
                    <div className="mini-card-body" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
                      <Avatar
                        src={req.requester.primaryPhotoUrl}
                        name={req.requester.displayName}
                        size="md"
                        seed={req.requester.displayId}
                      />
                      <div style={{ flex: 1 }}>
                        <Link
                          href={localizePath(`/profiles/${req.requester.displayId}`, locale)}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <strong>{req.requester.displayName}</strong>
                        </Link>
                        <p className="mini-text">{formatDateTime(req.createdAt, locale)}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => void handleDecision(req.id, "grant")}
                          disabled={busyId === req.id}
                          style={{ fontSize: 13, padding: "8px 14px" }}
                        >
                          {localeText(locale, "Grant", "দিন")}
                        </button>
                        <button
                          type="button"
                          className="button button-soft"
                          onClick={() => void handleDecision(req.id, "deny")}
                          disabled={busyId === req.id}
                          style={{ fontSize: 13, padding: "8px 14px" }}
                        >
                          {localeText(locale, "Deny", "প্রত্যাখ্যান")}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {resolved.length > 0 && (
            <>
              <p className="hint" style={{ marginBottom: 8 }}>
                {localeText(locale, "Previous requests", "পূর্ববর্তী অনুরোধ")}
              </p>
              <div className="stack-list">
                {resolved.map((req) => (
                  <article key={req.id} className="mini-card mini-card-horizontal">
                    <div className="mini-card-body" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
                      <Avatar
                        src={req.requester.primaryPhotoUrl}
                        name={req.requester.displayName}
                        size="md"
                        seed={req.requester.displayId}
                      />
                      <div style={{ flex: 1 }}>
                        <strong>{req.requester.displayName}</strong>
                        <p className="mini-text">{formatDateTime(req.createdAt, locale)}</p>
                      </div>
                      <Badge tone={req.status === "GRANTED" ? "leaf" : "muted"}>
                        {req.status}
                      </Badge>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
