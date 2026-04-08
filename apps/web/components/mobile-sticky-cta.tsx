"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";

const COOKIE_CONSENT_KEY = "borbodhu.cookie-consent";

export function MobileStickyCtaBar() {
  const { isReady, user } = useAuth();
  const [cookieConsentGiven, setCookieConsentGiven] = useState(false);

  useEffect(() => {
    setCookieConsentGiven(!!localStorage.getItem(COOKIE_CONSENT_KEY));
    // Re-check periodically in case consent is given while this component is mounted
    const interval = setInterval(() => {
      setCookieConsentGiven(!!localStorage.getItem(COOKIE_CONSENT_KEY));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Only show for logged-out users on mobile, and only after cookie consent is resolved
  if (!isReady || user || !cookieConsentGiven) return null;

  return (
    <div className="mobile-sticky-cta">
      <Link href="/signup" className="button button-primary" style={{ flex: 1, justifyContent: "center", fontSize: "0.88rem", padding: "12px 16px" }}>
        Join Free
      </Link>
      <Link href="/login" className="button button-soft" style={{ flex: 1, justifyContent: "center", fontSize: "0.88rem", padding: "12px 16px", background: "white", color: "var(--rose)" }}>
        Log In
      </Link>
    </div>
  );
}
