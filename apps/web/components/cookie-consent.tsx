"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "borbodhu.cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 950,
        background: "var(--deep)",
        color: "rgba(255,255,255,0.9)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        fontSize: "0.85rem",
        lineHeight: 1.5,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ margin: 0, maxWidth: 600 }}>
        We use essential cookies to keep you signed in and improve your experience.{" "}
        <Link href="/privacy" style={{ color: "var(--gold)", textDecoration: "underline" }}>
          Privacy policy
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={accept}
          className="button button-primary"
          style={{ fontSize: "0.82rem", padding: "8px 20px" }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          className="button button-soft"
          style={{ fontSize: "0.82rem", padding: "8px 16px", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.3)" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
