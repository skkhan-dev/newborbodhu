"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api";
import type {
  MemberProfileDetail,
  MembershipStatusResponse,
} from "@/lib/types/member";

type Props = {
  displayId: string;
  publicProfile: {
    id: string;
    publicName: string;
    displayId: string;
    primaryPhotoUrl: string | null;
  };
};

export function ProfileDetailClient({ displayId, publicProfile }: Props) {
  const { isReady, user, accessToken } = useAuth();

  const [memberDetail, setMemberDetail] =
    useState<MemberProfileDetail | null>(null);
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [requestingPhotos, setRequestingPhotos] = useState(false);

  useEffect(() => {
    if (!isReady || !accessToken) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [profile, status] = await Promise.all([
          apiRequest<MemberProfileDetail>(
            `/member-profiles/${publicProfile.id}`,
            { token: accessToken },
          ),
          apiRequest<MembershipStatusResponse>("/billing/me/status", {
            token: accessToken,
          }),
        ]);

        if (!cancelled) {
          setMemberDetail(profile);
          setMembershipStatus(status);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [isReady, accessToken, publicProfile.id]);

  async function handleUnlockContact() {
    if (
      !window.confirm(
        `This will use 1 of your ${membershipStatus?.contactsRemaining === -1 ? "unlimited" : membershipStatus?.contactsRemaining} contact views. Continue?`,
      )
    )
      return;

    setUnlocking(true);

    try {
      const result = await apiRequest<MemberProfileDetail>(
        `/member-profiles/${publicProfile.id}/contact-unlocks`,
        { method: "POST", token: accessToken },
      );
      setMemberDetail(result);

      const status = await apiRequest<MembershipStatusResponse>(
        "/billing/me/status",
        { token: accessToken },
      );
      setMembershipStatus(status);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUnlocking(false);
    }
  }

  async function handleRequestPhotos() {
    setRequestingPhotos(true);

    try {
      await apiRequest(
        `/member-profiles/${publicProfile.id}/photo-requests`,
        { method: "POST", token: accessToken },
      );
      setMemberDetail((prev) =>
        prev
          ? {
              ...prev,
              privatePhotoAccess: { granted: false, requestStatus: "PENDING" },
            }
          : prev,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRequestingPhotos(false);
    }
  }

  // Not logged in or auth not ready yet — render nothing
  if (!isReady || !accessToken || !user) return null;

  // Loading state
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <p style={{ fontSize: "0.9rem", color: "#888" }}>
          Loading member details...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !memberDetail) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "16px 20px",
          background: "#fef2f2",
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <p style={{ fontSize: "0.9rem", color: "#b91c1c", margin: 0 }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
      {/* Section A: Membership Status Bar */}
      <div className="membership-bar">
        {!membershipStatus?.membership && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              background: "#fef3c7",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: "0.88rem" }}>
              Upgrade to unlock contact info, private photos &amp; messaging
            </span>
            <Link
              href="/upgrade"
              className="button button-primary"
              style={{ padding: "6px 16px", fontSize: "0.82rem" }}
            >
              Upgrade
            </Link>
          </div>
        )}
        {membershipStatus?.membership?.status === "ACTIVE" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              background: "#dcfce7",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: "0.88rem" }}>
              {membershipStatus.membership.planName} Member{" "}
              {membershipStatus.contactsRemaining === -1
                ? "Unlimited"
                : `${membershipStatus.contactsRemaining} contacts remaining`}{" "}
              Expires{" "}
              {new Date(
                membershipStatus.membership.endsAt!,
              ).toLocaleDateString()}
            </span>
            <Link
              href="/dashboard?tab=billing"
              className="button button-soft"
              style={{ padding: "6px 16px", fontSize: "0.82rem" }}
            >
              Manage
            </Link>
          </div>
        )}
      </div>

      {/* Section B: Contact Information Card */}
      {memberDetail && (
        <div className="summary-card" style={{ marginTop: 16 }}>
          <p
            className="section-kicker"
            style={{ marginBottom: 8, fontSize: 11 }}
          >
            Contact Information
          </p>
          {memberDetail.contact.unlocked ? (
            <div className="detail-columns">
              <div>
                {memberDetail.contact.guardianPhone && (
                  <div className="summary-row">
                    <span>Phone</span>
                    <strong>{memberDetail.contact.guardianPhone}</strong>
                  </div>
                )}
                {memberDetail.contact.guardianEmail && (
                  <div className="summary-row">
                    <span>Email</span>
                    <strong>{memberDetail.contact.guardianEmail}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  margin: "0 0 12px",
                }}
              >
                Contact information is hidden
              </p>
              {membershipStatus?.canViewContacts ? (
                <>
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={unlocking}
                    onClick={handleUnlockContact}
                  >
                    {unlocking
                      ? "Unlocking..."
                      : `Unlock Contact (uses 1 of ${membershipStatus.contactsRemaining === -1 ? "\u221E" : membershipStatus.contactsRemaining})`}
                  </button>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#999",
                      marginTop: 8,
                    }}
                  >
                    This action cannot be undone
                  </p>
                </>
              ) : (
                <Link href="/upgrade" className="button button-primary">
                  Upgrade to View Contact
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline error (non-blocking) */}
      {error && memberDetail && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 20px",
            background: "#fef2f2",
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "#b91c1c", margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Section C: Private Photo Request */}
      {memberDetail && !memberDetail.privatePhotoAccess.granted && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            background: "#f8fafc",
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <p style={{ fontSize: "0.9rem", margin: "0 0 8px" }}>
            This member has private photos
          </p>
          {memberDetail.privatePhotoAccess.requestStatus === "PENDING" ? (
            <span
              className="status-pill status-pill-gold"
              style={{ fontSize: "0.82rem" }}
            >
              Photo Request Pending
            </span>
          ) : memberDetail.privatePhotoAccess.requestStatus === "APPROVED" ? (
            <span
              className="status-pill status-pill-leaf"
              style={{ fontSize: "0.82rem" }}
            >
              Photo Access Granted
            </span>
          ) : (
            <button
              type="button"
              className="button button-soft"
              disabled={requestingPhotos}
              onClick={handleRequestPhotos}
            >
              {requestingPhotos ? "Sending..." : "Request Private Photos"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
