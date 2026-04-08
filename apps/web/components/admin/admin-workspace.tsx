"use client";

import { useState } from "react";

import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import { translateGender, translateLookingFor } from "@/lib/public-page-locale";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  translateApprovalStatus,
  translateGateway,
  translateMediaType,
  translatePaymentStatus,
  translateProfileStatus,
} from "@/lib/translate";
import type {
  AdminOverviewResponse,
  AdminProfileReviewItem,
  ManualPayment,
} from "@/lib/types/admin";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export { type AdminOverviewResponse, type AdminProfileReviewItem, type ManualPayment };

function SectionTitle({
  kicker,
  title,
  detail,
}: {
  kicker: string;
  title: string;
  detail?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h3>{title}</h3>
      </div>
      {detail ? <div>{detail}</div> : null}
    </div>
  );
}

export function AdminWorkspace({
  accessToken,
  locale = null,
  overview,
  manualPayments,
  profileReviews,
  onRefresh,
}: {
  accessToken: string;
  locale?: PublicLocale | null;
  overview: AdminOverviewResponse;
  manualPayments: ManualPayment[];
  profileReviews: AdminProfileReviewItem[];
  onRefresh: () => Promise<void>;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  async function reviewManualPayment(paymentId: string, action: "approve" | "reject") {
    setBusyPaymentId(paymentId);
    setFeedback(null);
    setError(null);

    try {
      await apiRequest(`/admin/manual-payments/${paymentId}/${action}`, {
        method: "POST",
        token: accessToken,
        body: {
          notes: `Reviewed from browser dashboard: ${action}.`,
        },
      });

      setFeedback(`Manual payment ${action}d.`);
      await onRefresh();
    } catch (reviewError) {
      setError(getErrorMessage(reviewError));
    } finally {
      setBusyPaymentId(null);
    }
  }

  async function reviewProfile(memberProfileId: string, action: "approve" | "reject") {
    setBusyProfileId(memberProfileId);
    setFeedback(null);
    setError(null);

    try {
      await apiRequest(`/admin/profile-reviews/${memberProfileId}/${action}`, {
        method: "POST",
        token: accessToken,
        body: {
          notes: reviewNotes[memberProfileId] || undefined,
        },
      });

      setFeedback(
        action === "approve" ? "Profile approved successfully." : "Profile rejected.",
      );
      setReviewNotes((current) => ({
        ...current,
        [memberProfileId]: "",
      }));
      await onRefresh();
    } catch (profileError) {
      setError(getErrorMessage(profileError));
    } finally {
      setBusyProfileId(null);
    }
  }

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Admin Dashboard", "অ্যাডমিন ড্যাশবোর্ড")}</p>
            <h2>{localeText(locale, "Operational overview", "অপারেশনাল সারাংশ")}</h2>
          </div>
          <Badge tone="leaf">{localeText(locale, "Review-ready", "রিভিউ-প্রস্তুত")}</Badge>
        </div>

        <div className="dashboard-stats">
          <StatCard value={overview.profiles.active} label={localeText(locale, "Active profiles", "সক্রিয় প্রোফাইল")} />
          <StatCard value={overview.profiles.pending} label={localeText(locale, "Pending profiles", "অপেক্ষমাণ প্রোফাইল")} />
          <StatCard value={overview.payments.pendingManualReview} label={localeText(locale, "Manual payment reviews", "ম্যানুয়াল পেমেন্ট রিভিউ")} />
          <StatCard value={overview.payments.collectedAmount} label={localeText(locale, "Collected amount", "সংগৃহীত পরিমাণ")} />
        </div>

        {feedback ? <div className="success-banner">{feedback}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <SectionTitle
          kicker={localeText(locale, "Profile Review Queue", "প্রোফাইল রিভিউ কিউ")}
          title={localeText(locale, "Pending member moderation", "অপেক্ষমাণ মেম্বার রিভিউ")}
          detail={<Badge tone="gold">{profileReviews.length} {localeText(locale, "pending", "অপেক্ষমাণ")}</Badge>}
        />

        {profileReviews.length ? (
          <div className="stack-list">
            {profileReviews.map((profile) => (
              <article key={profile.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{profile.displayName}</strong>
                      <p className="mini-text">
                        {profile.user.email} • {profile.displayId}
                      </p>
                    </div>
                    <div className="status-row">
                      <Badge tone="gold">
                        {translateApprovalStatus(profile.approvalStatus, locale)}
                      </Badge>
                      <Badge tone="teal">
                        {translateProfileStatus(profile.status, locale)}
                      </Badge>
                    </div>
                  </div>

                  <div className="tag-list">
                    <span className="tag">{translateGender(profile.gender, locale ?? "en")}</span>
                    <span className="tag">
                      {translateLookingFor(profile.lookingFor, locale ?? "en")}
                    </span>
                    {profile.currentCountryCode ? (
                      <span className="tag">
                        {[profile.currentCity, profile.currentCountryCode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    ) : null}
                    <span className="tag">{profile.profileCompletionPct}% {localeText(locale, "complete", "সম্পূর্ণ")}</span>
                  </div>

                  <p className="mini-text">
                    {profile.aboutMe ??
                      localeText(
                        locale,
                        "This profile has not added an about section yet.",
                        "এই প্রোফাইলে এখনও কোনো 'আমার সম্পর্কে' অংশ যোগ করা হয়নি।",
                      )}
                  </p>

                  {profile.media.length ? (
                    <div className="card-grid review-media-grid">
                      {profile.media.map((mediaItem) => (
                        <article key={mediaItem.id} className="mini-card">
                          {mediaItem.thumbnailUrl || mediaItem.storageUrl ? (
                            <img
                              src={mediaItem.thumbnailUrl ?? mediaItem.storageUrl ?? undefined}
                              alt={translateMediaType(mediaItem.mediaType, locale)}
                              className="mini-card-media"
                            />
                          ) : (
                            <div className="mini-card-media mini-card-media-placeholder">
                              {translateMediaType(mediaItem.mediaType, locale)}
                            </div>
                          )}
                          <div className="mini-card-body">
                            <strong>{translateMediaType(mediaItem.mediaType, locale)}</strong>
                            <p className="mini-text">
                              {translateApprovalStatus(mediaItem.approvalStatus, locale)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  <label className="field">
                    <span>{localeText(locale, "Review notes", "রিভিউ নোট")}</span>
                    <textarea
                      rows={3}
                      value={reviewNotes[profile.id] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [profile.id]: event.target.value,
                        }))
                      }
                      placeholder={localeText(locale, "Visible reason for approval adjustments or rejection.", "অনুমোদন পরিবর্তন বা বাতিলের দৃশ্যমান কারণ।")}
                    />
                  </label>

                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void reviewProfile(profile.id, "approve")}
                      disabled={busyProfileId === profile.id}
                    >
                      {busyProfileId === profile.id
                        ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                        : localeText(locale, "Approve Profile", "প্রোফাইল অনুমোদন")}
                    </button>
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => void reviewProfile(profile.id, "reject")}
                      disabled={busyProfileId === profile.id}
                    >
                      {busyProfileId === profile.id
                        ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                        : localeText(locale, "Reject Profile", "প্রোফাইল বাতিল")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">{localeText(locale, "No pending profile reviews right now.", "এই মুহূর্তে কোনো অপেক্ষমাণ প্রোফাইল রিভিউ নেই।")}</div>
        )}
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <SectionTitle
          kicker={localeText(locale, "Manual Payments", "ম্যানুয়াল পেমেন্ট")}
          title={localeText(locale, "Pending review queue", "অপেক্ষমাণ রিভিউ কিউ")}
        />

        {manualPayments.length ? (
          <div className="stack-list">
            {manualPayments.map((payment) => (
              <article key={payment.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <h4>{payment.user.email}</h4>
                      <p className="mini-text">
                        {translateGateway(payment.gateway, locale)} • {payment.finalAmount}{" "}
                        {payment.currency}
                      </p>
                    </div>
                    <Badge tone="gold">
                      {translatePaymentStatus(payment.status, locale)}
                    </Badge>
                  </div>
                  <p className="hint">
                    {localeText(locale, "Created", "তৈরি হয়েছে")}{" "}
                    {formatDate(payment.createdAt, locale)}
                  </p>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void reviewManualPayment(payment.id, "approve")}
                      disabled={busyPaymentId === payment.id}
                    >
                      {busyPaymentId === payment.id
                        ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                        : localeText(locale, "Approve", "অনুমোদন")}
                    </button>
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => void reviewManualPayment(payment.id, "reject")}
                      disabled={busyPaymentId === payment.id}
                    >
                      {busyPaymentId === payment.id
                        ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                        : localeText(locale, "Reject", "বাতিল")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">{localeText(locale, "No manual payments are waiting for review right now.", "এই মুহূর্তে কোনো ম্যানুয়াল পেমেন্ট রিভিউয়ের অপেক্ষায় নেই।")}</div>
        )}
      </article>
    </section>
  );
}
