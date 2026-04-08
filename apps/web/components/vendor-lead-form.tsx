"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { trackProductEvent } from "@/lib/analytics";
import { apiRequest, getErrorMessage } from "@/lib/api";

export type VendorLeadFormCopy = {
  kicker: string;
  title: string;
  memberHint: string;
  guestHint: string;
  memberMessageLabel: string;
  memberMessagePlaceholder: string;
  memberSubmit: string;
  guestNameLabel: string;
  guestEmailLabel: string;
  guestPhoneLabel: string;
  guestMessageLabel: string;
  guestMessagePlaceholder: string;
  guestSubmit: string;
  sending: string;
  guestSuccessTemplate: string;
  memberSuccessTemplate: string;
};

type VendorLeadFormProps = {
  vendorName: string;
  vendorSlug: string;
  copy?: Partial<VendorLeadFormCopy>;
};

const defaultCopy: VendorLeadFormCopy = {
  kicker: "Lead Capture",
  title: "Send this vendor an inquiry.",
  memberHint:
    "Because you are logged in as a member, this inquiry will be linked to your Borbodhu account.",
  guestHint:
    "Guests can still inquire here. Logged-in members get a cleaner follow-up trail.",
  memberMessageLabel: "Message",
  memberMessagePlaceholder:
    "Share your wedding date, city, guest count, or what you want help with.",
  memberSubmit: "Send member inquiry",
  guestNameLabel: "Your name",
  guestEmailLabel: "Email",
  guestPhoneLabel: "Phone",
  guestMessageLabel: "Message",
  guestMessagePlaceholder: "Tell the vendor what kind of wedding support you need.",
  guestSubmit: "Send inquiry",
  sending: "Sending...",
  guestSuccessTemplate: "Your inquiry has been sent to {vendorName}.",
  memberSuccessTemplate: "Your member inquiry has been sent to {vendorName}.",
};

export function VendorLeadForm({
  vendorName,
  vendorSlug,
  copy,
}: VendorLeadFormProps) {
  const { accessToken, user } = useAuth();
  const resolvedCopy = { ...defaultCopy, ...copy };
  const isMember = Boolean(user?.roles.includes("MEMBER"));
  const [guestForm, setGuestForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    message: "",
  });
  const [memberMessage, setMemberMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGuestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await apiRequest(`/vendors/${vendorSlug}/leads/public`, {
        method: "POST",
        body: guestForm,
      });
      setSuccess(
        resolvedCopy.guestSuccessTemplate.replace("{vendorName}", vendorName),
      );
      void trackProductEvent({
        eventName: "VENDOR_LEAD_SUBMITTED",
        pagePath: `/vendors/${vendorSlug}`,
        entityType: "VENDOR",
        entityId: vendorSlug,
        metadataJson: {
          leadType: "GUEST",
        },
      });
      setGuestForm({
        requesterName: "",
        requesterEmail: "",
        requesterPhone: "",
        message: "",
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMemberSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await apiRequest(`/vendors/${vendorSlug}/leads/member`, {
        method: "POST",
        token: accessToken,
        body: {
          message: memberMessage || undefined,
        },
      });
      setSuccess(
        resolvedCopy.memberSuccessTemplate.replace("{vendorName}", vendorName),
      );
      void trackProductEvent({
        eventName: "VENDOR_LEAD_SUBMITTED",
        token: accessToken,
        pagePath: `/vendors/${vendorSlug}`,
        entityType: "VENDOR",
        entityId: vendorSlug,
        metadataJson: {
          leadType: "MEMBER",
        },
      });
      setMemberMessage("");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="feature-panel">
      <p className="section-kicker">{resolvedCopy.kicker}</p>
      <h2>{resolvedCopy.title}</h2>
      <p className="hint">
        {isMember
          ? resolvedCopy.memberHint
          : resolvedCopy.guestHint}
      </p>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      {isMember ? (
        <form className="auth-form" onSubmit={handleMemberSubmit}>
          <label className="field">
            <span>{resolvedCopy.memberMessageLabel}</span>
            <textarea
              rows={4}
              value={memberMessage}
              onChange={(event) => setMemberMessage(event.target.value)}
              placeholder={resolvedCopy.memberMessagePlaceholder}
            />
          </label>

          <div className="inline-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? resolvedCopy.sending : resolvedCopy.memberSubmit}
            </button>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleGuestSubmit}>
          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.guestNameLabel}</span>
              <input
                type="text"
                value={guestForm.requesterName}
                onChange={(event) =>
                  setGuestForm((current) => ({
                    ...current,
                    requesterName: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.guestEmailLabel}</span>
              <input
                type="email"
                value={guestForm.requesterEmail}
                onChange={(event) =>
                  setGuestForm((current) => ({
                    ...current,
                    requesterEmail: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <label className="field">
            <span>{resolvedCopy.guestPhoneLabel}</span>
            <input
              type="text"
              value={guestForm.requesterPhone}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  requesterPhone: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{resolvedCopy.guestMessageLabel}</span>
            <textarea
              rows={4}
              value={guestForm.message}
              onChange={(event) =>
                setGuestForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              placeholder={resolvedCopy.guestMessagePlaceholder}
            />
          </label>

          <div className="inline-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? resolvedCopy.sending : resolvedCopy.guestSubmit}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
