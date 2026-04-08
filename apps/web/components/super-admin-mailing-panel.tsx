"use client";

import { useEffect, useState } from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";
import { type PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type AudiencePreview = {
  count: number;
  sampleRecipients: Array<{
    userId: string;
    email: string;
    displayName: string;
    currentCountryCode: string | null;
    preferredLocale: string;
    profileCompletionPct: number;
    activeMembershipCode: string | null;
  }>;
  byLocale: Record<string, number>;
};

export type SuperAdminMatchMailResponse = {
  settings: {
    enabled: boolean;
    frequency: "DAILY" | "WEEKLY";
    dayOfWeek: string;
    timeZone: string;
    sendHourLocal: number;
    sendMinuteLocal: number;
    includeNewMembersDays: number;
    minimumProfileCompletionPct: number;
    maxMatchesPerRecipient: number;
    membershipState: "ANY" | "PAID" | "FREE";
    recipientGender: "MAN" | "WOMAN" | null;
    preferredLocale: "EN" | "BN" | null;
    outsideBangladeshOnly: boolean;
  };
  audience: AudiencePreview;
};

export type SuperAdminMailCampaignItem = {
  id: string;
  name: string;
  templateKey: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  queuedAt: string | null;
  recipientCount: number;
  createdAt: string;
  bodyJson: Record<string, unknown>;
  audienceFiltersJson: Record<string, unknown>;
  metadataJson: Record<string, unknown> | null;
  createdByUser: {
    id: string;
    email: string;
  } | null;
};

export type SuperAdminMailCampaignPreviewResponse = {
  filters: Record<string, unknown>;
  audience: AudiencePreview;
};

type MatchMailSettingsForm = {
  enabled: boolean;
  frequency: "DAILY" | "WEEKLY";
  dayOfWeek: string;
  timeZone: string;
  sendHourLocal: string;
  sendMinuteLocal: string;
  includeNewMembersDays: string;
  minimumProfileCompletionPct: string;
  maxMatchesPerRecipient: string;
  membershipState: "ANY" | "PAID" | "FREE";
  recipientGender: "" | "MAN" | "WOMAN";
  preferredLocale: "" | "EN" | "BN";
  outsideBangladeshOnly: boolean;
};

type CampaignForm = {
  name: string;
  subject: string;
  headline: string;
  bodyText: string;
  ctaLabel: string;
  ctaUrl: string;
  templateKey: string;
  recipientGender: "" | "MAN" | "WOMAN";
  currentCountryCode: string;
  homeCountryCode: string;
  preferredLocale: "" | "EN" | "BN";
  membershipState: "ANY" | "PAID" | "FREE";
  outsideBangladeshOnly: boolean;
  minimumProfileCompletionPct: string;
  scheduledAt: string;
};

function toSettingsFormState(
  settings: SuperAdminMatchMailResponse["settings"],
): MatchMailSettingsForm {
  return {
    enabled: settings.enabled,
    frequency: settings.frequency,
    dayOfWeek: settings.dayOfWeek,
    timeZone: settings.timeZone,
    sendHourLocal: String(settings.sendHourLocal),
    sendMinuteLocal: String(settings.sendMinuteLocal),
    includeNewMembersDays: String(settings.includeNewMembersDays),
    minimumProfileCompletionPct: String(settings.minimumProfileCompletionPct),
    maxMatchesPerRecipient: String(settings.maxMatchesPerRecipient),
    membershipState: settings.membershipState,
    recipientGender: settings.recipientGender ?? "",
    preferredLocale: settings.preferredLocale ?? "",
    outsideBangladeshOnly: settings.outsideBangladeshOnly,
  };
}

function createCampaignFormState(locale: PublicLocale | null = null): CampaignForm {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);

  return {
    name: localeText(locale, "Diaspora spotlight", "প্রবাসী স্পটলাইট"),
    subject: localeText(locale, "Fresh Borbodhu updates for you", "আপনার জন্য নতুন Borbodhu আপডেট"),
    headline: localeText(
      locale,
      "New trusted profiles and wedding planning tools are live",
      "নতুন বিশ্বস্ত প্রোফাইল এবং ওয়েডিং প্ল্যানিং টুল এখন লাইভ",
    ),
    bodyText: localeText(
      locale,
      "Review newly active members, refine your partner preference, and revisit your wedding planning shortlist.",
      "নতুন সক্রিয় মেম্বার দেখুন, পার্টনার প্রেফারেন্স ঠিক করুন, এবং আপনার ওয়েডিং শর্টলিস্ট আবার দেখুন।",
    ),
    ctaLabel: localeText(locale, "Open Borbodhu", "Borbodhu খুলুন"),
    ctaUrl: "/dashboard",
    templateKey: "super_admin_campaign",
    recipientGender: "",
    currentCountryCode: "",
    homeCountryCode: "",
    preferredLocale: "",
    membershipState: "ANY",
    outsideBangladeshOnly: false,
    minimumProfileCompletionPct: "60",
    scheduledAt: now.toISOString().slice(0, 16),
  };
}

function formatDateTime(value: string | null, locale: PublicLocale | null = null) {
  if (!value) {
    return localeText(locale, "Not scheduled", "নির্ধারিত নয়");
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFilters(filters: Record<string, unknown>) {
  return Object.entries(filters)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ");
}

export function SuperAdminMailingPanel({
  accessToken,
  locale = null,
  matchMail,
  campaigns,
  onRefresh,
}: {
  accessToken: string;
  locale?: PublicLocale | null;
  matchMail: SuperAdminMatchMailResponse;
  campaigns: SuperAdminMailCampaignItem[];
  onRefresh: () => Promise<void>;
}) {
  const [settingsForm, setSettingsForm] = useState<MatchMailSettingsForm>(
    toSettingsFormState(matchMail.settings),
  );
  const [matchMailAudience, setMatchMailAudience] = useState(matchMail.audience);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(
    createCampaignFormState(locale),
  );
  const [campaignPreview, setCampaignPreview] =
    useState<SuperAdminMailCampaignPreviewResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(toSettingsFormState(matchMail.settings));
    setMatchMailAudience(matchMail.audience);
  }, [matchMail]);

  useEffect(() => {
    setCampaignForm((current) =>
      current.name || current.subject || current.headline || current.bodyText
        ? current
        : createCampaignFormState(locale),
    );
  }, [locale]);

  function resetMessages() {
    setFeedback(null);
    setError(null);
  }

  async function saveMatchMailSettings() {
    setBusyKey("save-match-mail");
    resetMessages();

    try {
      const response = await apiRequest<SuperAdminMatchMailResponse>(
        "/super-admin/match-mail/settings",
        {
          method: "PATCH",
          token: accessToken,
          body: {
            enabled: settingsForm.enabled,
            frequency: settingsForm.frequency,
            dayOfWeek: settingsForm.dayOfWeek,
            timeZone: settingsForm.timeZone,
            sendHourLocal: Number(settingsForm.sendHourLocal),
            sendMinuteLocal: Number(settingsForm.sendMinuteLocal),
            includeNewMembersDays: Number(settingsForm.includeNewMembersDays),
            minimumProfileCompletionPct: Number(
              settingsForm.minimumProfileCompletionPct,
            ),
            maxMatchesPerRecipient: Number(settingsForm.maxMatchesPerRecipient),
            membershipState: settingsForm.membershipState,
            recipientGender: settingsForm.recipientGender || undefined,
            preferredLocale: settingsForm.preferredLocale || undefined,
            outsideBangladeshOnly: settingsForm.outsideBangladeshOnly,
          },
        },
      );

      setSettingsForm(toSettingsFormState(response.settings));
      setMatchMailAudience(response.audience);
      setFeedback(localeText(locale, "Match mail settings saved.", "ম্যাচ মেইল সেটিংস সেভ হয়েছে।"));
      await onRefresh();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function previewMatchMailAudience() {
    setBusyKey("preview-match-mail");
    resetMessages();

    try {
      const response = await apiRequest<SuperAdminMatchMailResponse>(
        "/super-admin/match-mail/preview",
        {
          token: accessToken,
        },
      );

      setMatchMailAudience(response.audience);
      setFeedback(localeText(locale, "Match mail audience refreshed.", "ম্যাচ মেইল অডিয়েন্স রিফ্রেশ হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function queueMatchMailNow() {
    setBusyKey("queue-match-mail");
    resetMessages();

    try {
      const response = await apiRequest<{
        queuedRecipients: number;
        totalSuggestedMatches: number;
      }>("/super-admin/match-mail/queue", {
        method: "POST",
        token: accessToken,
      });

      setFeedback(
        localeText(
          locale,
          `Queued match mail for ${response.queuedRecipients} recipients with ${response.totalSuggestedMatches} total suggestions.`,
          `${response.queuedRecipients} জন প্রাপকের জন্য ${response.totalSuggestedMatches}টি মোট সাজেশনসহ ম্যাচ মেইল কিউ করা হয়েছে।`,
        ),
      );
      await onRefresh();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function previewCampaign() {
    setBusyKey("preview-campaign");
    resetMessages();

    try {
      const response = await apiRequest<SuperAdminMailCampaignPreviewResponse>(
        "/super-admin/mail-campaigns/preview",
        {
          method: "POST",
          token: accessToken,
          body: {
            recipientGender: campaignForm.recipientGender || undefined,
            currentCountryCode: campaignForm.currentCountryCode || undefined,
            homeCountryCode: campaignForm.homeCountryCode || undefined,
            preferredLocale: campaignForm.preferredLocale || undefined,
            membershipState: campaignForm.membershipState,
            outsideBangladeshOnly: campaignForm.outsideBangladeshOnly,
            minimumProfileCompletionPct: Number(
              campaignForm.minimumProfileCompletionPct,
            ),
          },
        },
      );

      setCampaignPreview(response);
      setFeedback(localeText(locale, "Campaign audience preview loaded.", "ক্যাম্পেইন অডিয়েন্স প্রিভিউ লোড হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function createCampaign() {
    setBusyKey("create-campaign");
    resetMessages();

    try {
      await apiRequest("/super-admin/mail-campaigns", {
        method: "POST",
        token: accessToken,
        body: {
          name: campaignForm.name,
          subject: campaignForm.subject,
          headline: campaignForm.headline,
          bodyText: campaignForm.bodyText,
          ctaLabel: campaignForm.ctaLabel || undefined,
          ctaUrl: campaignForm.ctaUrl || undefined,
          templateKey: campaignForm.templateKey || undefined,
          recipientGender: campaignForm.recipientGender || undefined,
          currentCountryCode: campaignForm.currentCountryCode || undefined,
          homeCountryCode: campaignForm.homeCountryCode || undefined,
          preferredLocale: campaignForm.preferredLocale || undefined,
          membershipState: campaignForm.membershipState,
          outsideBangladeshOnly: campaignForm.outsideBangladeshOnly,
          minimumProfileCompletionPct: Number(
            campaignForm.minimumProfileCompletionPct,
          ),
          scheduledAt: campaignForm.scheduledAt
            ? new Date(campaignForm.scheduledAt).toISOString()
            : undefined,
        },
      });

      setCampaignForm(createCampaignFormState(locale));
      setCampaignPreview(null);
      setFeedback(localeText(locale, "Campaign queued successfully.", "ক্যাম্পেইন সফলভাবে কিউ হয়েছে।"));
      await onRefresh();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <>
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Match Mail", "ম্যাচ মেইল")}</p>
            <h3>
              {localeText(
                locale,
                "Schedule recurring match digest and preview the audience",
                "পুনরাবৃত্ত ম্যাচ ডাইজেস্ট নির্ধারণ করুন এবং অডিয়েন্স প্রিভিউ দেখুন",
              )}
            </h3>
          </div>
          <div className="tag-list">
            <span className="tag">
              {matchMailAudience.count} {localeText(locale, "eligible recipients", "যোগ্য প্রাপক")}
            </span>
            <span className="tag">{settingsForm.frequency}</span>
          </div>
        </div>

        {feedback ? <div className="success-banner dashboard-banner">{feedback}</div> : null}
        {error ? <div className="error-banner dashboard-banner">{error}</div> : null}

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Frequency", "ফ্রিকোয়েন্সি")}</span>
            <select
              value={settingsForm.frequency}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  frequency: event.target.value as "DAILY" | "WEEKLY",
                }))
              }
            >
              <option value="DAILY">{localeText(locale, "Daily", "দৈনিক")}</option>
              <option value="WEEKLY">{localeText(locale, "Weekly", "সাপ্তাহিক")}</option>
            </select>
          </label>

          <label className="field">
            <span>{localeText(locale, "Weekly send day", "সাপ্তাহিক পাঠানোর দিন")}</span>
            <select
              value={settingsForm.dayOfWeek}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  dayOfWeek: event.target.value,
                }))
              }
            >
              <option value="SUNDAY">{localeText(locale, "Sunday", "রবিবার")}</option>
              <option value="MONDAY">{localeText(locale, "Monday", "সোমবার")}</option>
              <option value="TUESDAY">{localeText(locale, "Tuesday", "মঙ্গলবার")}</option>
              <option value="WEDNESDAY">{localeText(locale, "Wednesday", "বুধবার")}</option>
              <option value="THURSDAY">{localeText(locale, "Thursday", "বৃহস্পতিবার")}</option>
              <option value="FRIDAY">{localeText(locale, "Friday", "শুক্রবার")}</option>
              <option value="SATURDAY">{localeText(locale, "Saturday", "শনিবার")}</option>
            </select>
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Time zone", "টাইম জোন")}</span>
            <input
              type="text"
              value={settingsForm.timeZone}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  timeZone: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Send hour", "পাঠানোর ঘন্টা")}</span>
            <input
              type="number"
              min="0"
              max="23"
              value={settingsForm.sendHourLocal}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  sendHourLocal: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Send minute", "পাঠানোর মিনিট")}</span>
            <input
              type="number"
              min="0"
              max="59"
              value={settingsForm.sendMinuteLocal}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  sendMinuteLocal: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Include recent members from last", "সাম্প্রতিক মেম্বার অন্তর্ভুক্ত করুন, গত")}</span>
            <input
              type="number"
              min="1"
              max="90"
              value={settingsForm.includeNewMembersDays}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  includeNewMembersDays: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Minimum profile completion", "ন্যূনতম প্রোফাইল সম্পূর্ণতা")}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={settingsForm.minimumProfileCompletionPct}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  minimumProfileCompletionPct: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Max matches per recipient", "প্রতি প্রাপকের সর্বোচ্চ ম্যাচ")}</span>
            <input
              type="number"
              min="1"
              max="20"
              value={settingsForm.maxMatchesPerRecipient}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  maxMatchesPerRecipient: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Recipient membership", "প্রাপকের মেম্বারশিপ")}</span>
            <select
              value={settingsForm.membershipState}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  membershipState: event.target.value as "ANY" | "PAID" | "FREE",
                }))
              }
            >
              <option value="ANY">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="PAID">{localeText(locale, "Paid only", "শুধু পেইড")}</option>
              <option value="FREE">{localeText(locale, "Free only", "শুধু ফ্রি")}</option>
            </select>
          </label>
          <label className="field">
            <span>{localeText(locale, "Recipient gender", "প্রাপকের লিঙ্গ")}</span>
            <select
              value={settingsForm.recipientGender}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  recipientGender: event.target.value as "" | "MAN" | "WOMAN",
                }))
              }
            >
              <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="MAN">{localeText(locale, "Man", "পুরুষ")}</option>
              <option value="WOMAN">{localeText(locale, "Woman", "নারী")}</option>
            </select>
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Preferred locale", "পছন্দের ভাষা")}</span>
            <select
              value={settingsForm.preferredLocale}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  preferredLocale: event.target.value as "" | "EN" | "BN",
                }))
              }
            >
              <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="EN">{localeText(locale, "English", "ইংরেজি")}</option>
              <option value="BN">{localeText(locale, "Bangla", "বাংলা")}</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settingsForm.outsideBangladeshOnly}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  outsideBangladeshOnly: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Only members currently outside Bangladesh", "শুধু বর্তমানে বাংলাদেশের বাইরে থাকা মেম্বার")}</span>
          </label>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settingsForm.enabled}
            onChange={(event) =>
              setSettingsForm((current) => ({
                ...current,
                enabled: event.target.checked,
              }))
            }
          />
          <span>{localeText(locale, "Enable recurring match mail", "পুনরাবৃত্ত ম্যাচ মেইল চালু করুন")}</span>
        </label>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void saveMatchMailSettings()}
            disabled={busyKey === "save-match-mail"}
          >
            {busyKey === "save-match-mail"
              ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
              : localeText(locale, "Save Settings", "সেটিংস সেভ করুন")}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void previewMatchMailAudience()}
            disabled={busyKey === "preview-match-mail"}
          >
            {busyKey === "preview-match-mail"
              ? localeText(locale, "Loading...", "লোড হচ্ছে...")
              : localeText(locale, "Preview Audience", "অডিয়েন্স প্রিভিউ")}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void queueMatchMailNow()}
            disabled={busyKey === "queue-match-mail"}
          >
            {busyKey === "queue-match-mail"
              ? localeText(locale, "Queueing...", "কিউ হচ্ছে...")
              : localeText(locale, "Queue Now", "এখনই কিউ করুন")}
          </button>
        </div>

        <div className="stack-list">
          <article className="summary-card">
            <div className="summary-row">
              <span>{localeText(locale, "Eligible recipients", "যোগ্য প্রাপক")}</span>
              <strong>{matchMailAudience.count}</strong>
            </div>
            <div className="summary-row">
              <span>{localeText(locale, "Locale mix", "ভাষাভিত্তিক ভাগ")}</span>
              <strong>
                {Object.entries(matchMailAudience.byLocale)
                  .map(([audienceLocale, count]) => `${audienceLocale} ${count}`)
                  .join(" • ") ||
                  localeText(locale, "No recipients yet", "এখনও কোনো প্রাপক নেই")}
              </strong>
            </div>
          </article>

          <div className="stack-list">
            {matchMailAudience.sampleRecipients.map((recipient) => (
              <article key={recipient.userId} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <strong>{recipient.displayName}</strong>
                  <p className="mini-text">{recipient.email}</p>
                  <p className="mini-text">
                    {recipient.currentCountryCode ??
                      localeText(locale, "Country pending", "দেশ অপেক্ষমাণ")}{" "}
                    • {recipient.preferredLocale} • {recipient.profileCompletionPct}%{" "}
                    {localeText(locale, "complete", "সম্পূর্ণ")}
                  </p>
                  <p className="mini-text">
                    {recipient.activeMembershipCode
                      ? localeText(
                          locale,
                          `${recipient.activeMembershipCode} member`,
                          `${recipient.activeMembershipCode} মেম্বার`,
                        )
                      : localeText(locale, "Free member", "ফ্রি মেম্বার")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Campaign Mail", "ক্যাম্পেইন মেইল")}</p>
            <h3>
              {localeText(
                locale,
                "Preview and queue targeted outreach",
                "টার্গেটেড আউটরিচ প্রিভিউ করুন এবং কিউ করুন",
              )}
            </h3>
          </div>
          <div className="tag-list">
            <span className="tag">
              {campaigns.length} {localeText(locale, "recent campaigns", "সাম্প্রতিক ক্যাম্পেইন")}
            </span>
          </div>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Campaign name", "ক্যাম্পেইনের নাম")}</span>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Subject", "সাবজেক্ট")}</span>
            <input
              type="text"
              value={campaignForm.subject}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Headline", "হেডলাইন")}</span>
            <input
              type="text"
              value={campaignForm.headline}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  headline: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Template key", "টেমপ্লেট কী")}</span>
            <input
              type="text"
              value={campaignForm.templateKey}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  templateKey: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <label className="field">
          <span>{localeText(locale, "Body", "বডি")}</span>
          <textarea
            rows={4}
            value={campaignForm.bodyText}
            onChange={(event) =>
              setCampaignForm((current) => ({
                ...current,
                bodyText: event.target.value,
              }))
            }
          />
        </label>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "CTA label", "CTA লেবেল")}</span>
            <input
              type="text"
              value={campaignForm.ctaLabel}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  ctaLabel: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "CTA URL", "CTA URL")}</span>
            <input
              type="text"
              value={campaignForm.ctaUrl}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  ctaUrl: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Recipient gender", "প্রাপকের লিঙ্গ")}</span>
            <select
              value={campaignForm.recipientGender}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  recipientGender: event.target.value as "" | "MAN" | "WOMAN",
                }))
              }
            >
              <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="MAN">{localeText(locale, "Man", "পুরুষ")}</option>
              <option value="WOMAN">{localeText(locale, "Woman", "নারী")}</option>
            </select>
          </label>
          <label className="field">
            <span>{localeText(locale, "Preferred locale", "পছন্দের ভাষা")}</span>
            <select
              value={campaignForm.preferredLocale}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  preferredLocale: event.target.value as "" | "EN" | "BN",
                }))
              }
            >
              <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="EN">{localeText(locale, "English", "ইংরেজি")}</option>
              <option value="BN">{localeText(locale, "Bangla", "বাংলা")}</option>
            </select>
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Current country", "বর্তমান দেশ")}</span>
            <input
              type="text"
              value={campaignForm.currentCountryCode}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  currentCountryCode: event.target.value.toUpperCase(),
                }))
              }
              placeholder={localeText(locale, "BD", "BD")}
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Home country", "নিজ দেশ")}</span>
            <input
              type="text"
              value={campaignForm.homeCountryCode}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  homeCountryCode: event.target.value.toUpperCase(),
                }))
              }
              placeholder={localeText(locale, "BD", "BD")}
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Membership", "মেম্বারশিপ")}</span>
            <select
              value={campaignForm.membershipState}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  membershipState: event.target.value as "ANY" | "PAID" | "FREE",
                }))
              }
            >
              <option value="ANY">{localeText(locale, "Any", "যেকোনো")}</option>
              <option value="PAID">{localeText(locale, "Paid only", "শুধু পেইড")}</option>
              <option value="FREE">{localeText(locale, "Free only", "শুধু ফ্রি")}</option>
            </select>
          </label>
          <label className="field">
            <span>{localeText(locale, "Minimum profile completion", "ন্যূনতম প্রোফাইল সম্পূর্ণতা")}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={campaignForm.minimumProfileCompletionPct}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  minimumProfileCompletionPct: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Schedule for", "নির্ধারণ করুন")}</span>
            <input
              type="datetime-local"
              value={campaignForm.scheduledAt}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  scheduledAt: event.target.value,
                }))
              }
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={campaignForm.outsideBangladeshOnly}
              onChange={(event) =>
                setCampaignForm((current) => ({
                  ...current,
                  outsideBangladeshOnly: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Only members currently outside Bangladesh", "শুধু বর্তমানে বাংলাদেশের বাইরে থাকা মেম্বার")}</span>
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void previewCampaign()}
            disabled={busyKey === "preview-campaign"}
          >
            {busyKey === "preview-campaign"
              ? localeText(locale, "Loading...", "লোড হচ্ছে...")
              : localeText(locale, "Preview Campaign", "ক্যাম্পেইন প্রিভিউ")}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void createCampaign()}
            disabled={busyKey === "create-campaign"}
          >
            {busyKey === "create-campaign"
              ? localeText(locale, "Queueing...", "কিউ হচ্ছে...")
              : localeText(locale, "Queue Campaign", "ক্যাম্পেইন কিউ করুন")}
          </button>
        </div>

        {campaignPreview ? (
          <div className="stack-list">
            <article className="summary-card">
              <div className="summary-row">
                <span>{localeText(locale, "Audience size", "অডিয়েন্সের আকার")}</span>
                <strong>{campaignPreview.audience.count}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Filters", "ফিল্টার")}</span>
                <strong>{formatFilters(campaignPreview.filters)}</strong>
              </div>
            </article>

            <div className="stack-list">
              {campaignPreview.audience.sampleRecipients.map((recipient) => (
                <article key={recipient.userId} className="mini-card mini-card-horizontal">
                  <div className="mini-card-body">
                  <strong>{recipient.displayName}</strong>
                  <p className="mini-text">{recipient.email}</p>
                  <p className="mini-text">
                    {recipient.currentCountryCode ??
                      localeText(locale, "Country pending", "দেশ অপেক্ষমাণ")}{" "}
                    • {recipient.preferredLocale} • {recipient.profileCompletionPct}%{" "}
                    {localeText(locale, "complete", "সম্পূর্ণ")}
                  </p>
                </div>
              </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="stack-list">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="mini-card mini-card-horizontal">
              <div className="mini-card-body">
                <div className="panel-header">
                  <div>
                    <strong>{campaign.name}</strong>
                    <p className="mini-text">{campaign.subject}</p>
                  </div>
                  <div className="tag-list">
                    <span className="tag">{campaign.status}</span>
                    <span className="tag">
                      {campaign.recipientCount} {localeText(locale, "recipients", "প্রাপক")}
                    </span>
                  </div>
                </div>
                <p className="mini-text">
                  {localeText(locale, "Scheduled", "নির্ধারিত")}{" "}
                  {formatDateTime(campaign.scheduledAt, locale)} •{" "}
                  {localeText(locale, "Queued", "কিউ হয়েছে")}{" "}
                  {formatDateTime(campaign.queuedAt, locale)}
                </p>
                <p className="mini-text">
                  {formatFilters(campaign.audienceFiltersJson) ||
                    localeText(locale, "No filters applied", "কোনো ফিল্টার প্রয়োগ হয়নি")}
                </p>
                <p className="mini-text">
                  {localeText(locale, "Created by", "তৈরি করেছেন")}{" "}
                  {campaign.createdByUser?.email ?? localeText(locale, "system", "সিস্টেম")}{" "}
                  {localeText(locale, "on", "তারিখ")}{" "}
                  {formatDateTime(campaign.createdAt, locale)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </article>
    </>
  );
}
