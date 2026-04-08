"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { apiRequest, getErrorMessage } from "@/lib/api";
import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type InterestItem = {
  id: string;
  status: string;
  createdAt: string;
  counterpart: {
    id: string;
    displayId: string;
    displayName: string;
    age: number | null;
    gender: string;
    religion: string | null;
    currentCity: string | null;
    currentCountryCode: string | null;
    primaryPhotoUrl: string | null;
  };
};

type InterestsResponse = {
  received: InterestItem[];
  sent: InterestItem[];
};

export function MemberInterestsPage({ locale = null }: { locale?: PublicLocale | null }) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<InterestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiRequest<InterestsResponse>(
        "/member-profiles/me/interests",
        { token: accessToken },
      );
      setData(response);
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respondToInterest(interestId: string, action: "accept" | "decline") {
    if (!accessToken) return;
    setBusyId(interestId);
    try {
      await apiRequest(`/member-profiles/me/interests/${interestId}/${action}`, {
        method: "POST",
        token: accessToken,
      });
      toast(
        action === "accept"
          ? localeText(locale, "Interest accepted!", "আগ্রহ গ্রহণ করা হয়েছে!")
          : localeText(locale, "Interest declined.", "আগ্রহ প্রত্যাখ্যান করা হয়েছে।"),
        action === "accept" ? "success" : "info",
      );
      void load();
    } catch (e) {
      toast(getErrorMessage(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  const received = data?.received ?? [];
  const sent = data?.sent ?? [];
  const items = activeTab === "received" ? received : sent;

  return (
    <main className="page-shell">
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-kicker">{localeText(locale, "Interests", "আগ্রহ")}</p>
          <h2>{localeText(locale, "Manage your interests", "আগ্রহ পরিচালনা")}</h2>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "received", label: localeText(locale, "Received", "প্রাপ্ত"), count: received.length },
          { key: "sent", label: localeText(locale, "Sent", "পাঠানো"), count: sent.length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {loading ? (
          <div className="stack-list" style={{ marginTop: 16 }}>
            <Skeleton variant="card" count={3} height="80px" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 16 }}>
            {activeTab === "received"
              ? localeText(locale, "No interests received yet.", "এখনও কোনো আগ্রহ পাওয়া যায়নি।")
              : localeText(locale, "You haven't sent any interests yet.", "আপনি এখনও কোনো আগ্রহ পাঠাননি।")}
          </div>
        ) : (
          <div className="stack-list" style={{ marginTop: 16 }}>
            {items.map((item) => (
              <article key={item.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
                  <Avatar
                    src={item.counterpart.primaryPhotoUrl}
                    name={item.counterpart.displayName}
                    size="lg"
                    seed={item.counterpart.displayId}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={localizePath(`/profiles/${item.counterpart.displayId}`, locale)}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <strong>{item.counterpart.displayName}</strong>
                    </Link>
                    <p className="mini-text" style={{ margin: "2px 0" }}>
                      {item.counterpart.displayId}
                      {item.counterpart.age ? ` • ${item.counterpart.age} yrs` : ""}
                      {item.counterpart.currentCity ? ` • ${item.counterpart.currentCity}` : ""}
                    </p>
                    <Badge tone={item.status === "ACCEPTED" ? "leaf" : item.status === "DECLINED" ? "rose" : "gold"}>
                      {item.status}
                    </Badge>
                  </div>

                  {activeTab === "received" && item.status === "SENT" && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => void respondToInterest(item.id, "accept")}
                        disabled={busyId === item.id}
                        style={{ fontSize: 13, padding: "8px 14px" }}
                      >
                        {localeText(locale, "Accept", "গ্রহণ")}
                      </button>
                      <button
                        type="button"
                        className="button button-soft"
                        onClick={() => void respondToInterest(item.id, "decline")}
                        disabled={busyId === item.id}
                        style={{ fontSize: 13, padding: "8px 14px" }}
                      >
                        {localeText(locale, "Decline", "প্রত্যাখ্যান")}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Tabs>
    </main>
  );
}
