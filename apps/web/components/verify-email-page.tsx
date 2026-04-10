"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

type State = "loading" | "success" | "error" | "missing";

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "loading" : "missing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setState("success");
        setTimeout(() => router.push("/dashboard"), 3000);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Verification failed.";
        setErrorMsg(msg);
        setState("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="page-shell" style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
      <div className="auth-card" style={{ maxWidth: 480, width: "100%" }}>
        {state === "loading" && (
          <>
            <p className="section-kicker">Verifying</p>
            <h2>Confirming your email…</h2>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>Please wait a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <p className="section-kicker" style={{ color: "#2d7a50" }}>✓ Verified!</p>
            <h2>Email confirmed.</h2>
            <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>
              Your email address has been verified. Redirecting you to your dashboard…
            </p>
            <Link href="/dashboard" className="button button-primary" style={{ display: "inline-flex" }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <p className="section-kicker" style={{ color: "var(--rose)" }}>Link not valid</p>
            <h2>Verification failed.</h2>
            <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>
              {errorMsg && errorMsg !== "Verification failed."
                ? errorMsg
                : "This link may have expired (links are valid for 72 hours) or has already been used. Request a new verification email from your dashboard."}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="button button-primary">
                Go to Dashboard
              </Link>
              <Link href="/login" className="button button-soft">
                Sign in
              </Link>
            </div>
          </>
        )}

        {state === "missing" && (
          <>
            <p className="section-kicker" style={{ color: "var(--rose)" }}>Invalid link</p>
            <h2>No verification token found.</h2>
            <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 20 }}>
              This link is missing a token. Please use the link from your verification email, or request a new one from your dashboard.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="button button-primary">
                Go to Dashboard
              </Link>
              <Link href="/login" className="button button-soft">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
