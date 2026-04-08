"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readStoredAccessToken } from "@/lib/auth";
import { apiRequest, getErrorMessage } from "@/lib/api";

export default function ProfileActionButtons({ displayId }: { displayId: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";

  useEffect(() => {
    setIsLoggedIn(!!readStoredAccessToken());
  }, []);

  async function handleExpressInterest() {
    const token = readStoredAccessToken();
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      // First get the member profile ID from the displayId
      const profile = await apiRequest<{ id: string }>(
        `/public/profiles/${displayId}`,
      );
      await apiRequest(`/member-profiles/${profile.id}/interests`, {
        method: "POST",
        token,
      });
      setInterestSent(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  if (isLoggedIn) {
    return (
      <div className="hero-actions">
        {interestSent ? (
          <span className="button button-primary" style={{ opacity: 0.7, cursor: "default" }}>
            Interest sent
          </span>
        ) : (
          <button
            type="button"
            className="button button-primary"
            onClick={handleExpressInterest}
            disabled={sending}
          >
            {sending ? "Sending..." : "Express interest"}
          </button>
        )}
        <Link href={fromDashboard ? "/search" : "/profiles"} className="button button-secondary">
          {fromDashboard ? "Back to search" : "Back to profiles"}
        </Link>
        {error && <p style={{ color: "var(--rose)", fontSize: "0.82rem", margin: "4px 0 0" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="hero-actions">
      <Link href="/signup" className="button button-primary">
        Join to express interest
      </Link>
      <Link href="/login" className="button button-soft">
        Log in
      </Link>
      <Link href="/profiles" className="button button-secondary">
        Back to public profiles
      </Link>
    </div>
  );
}
