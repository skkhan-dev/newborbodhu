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
    <div className="page-shell">
      <div className="hero-card" style={{ maxWidth: 480 }}>
        {state === "loading" && (
          <>
            <p className="section-kicker">Verifying</p>
            <h2>Confirming your email…</h2>
            <p className="hint">Please wait a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <p className="section-kicker" style={{ color: "var(--leaf)" }}>Verified!</p>
            <h2>Email confirmed.</h2>
            <p className="hint">
              Your email address has been verified. Redirecting you to your dashboard…
            </p>
            <Link href="/dashboard" className="button button-primary" style={{ marginTop: 16, display: "inline-block" }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <p className="section-kicker" style={{ color: "var(--rose)" }}>Link expired</p>
            <h2>This verification link is not valid.</h2>
            <p className="hint" style={{ marginBottom: 16 }}>
              {errorMsg ?? "The link may have expired or already been used. Request a new one from your dashboard."}
            </p>
            <Link href="/dashboard" className="button button-primary">
              Go to Dashboard
            </Link>
          </>
        )}

        {state === "missing" && (
          <>
            <p className="section-kicker" style={{ color: "var(--rose)" }}>Invalid link</p>
            <h2>No verification token found.</h2>
            <p className="hint" style={{ marginBottom: 16 }}>
              This link is missing a token. Please use the link from your verification email, or request a new one from your dashboard.
            </p>
            <Link href="/dashboard" className="button button-primary">
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
