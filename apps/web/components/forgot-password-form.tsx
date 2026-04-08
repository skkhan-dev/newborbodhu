"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      try {
        await apiRequest("/auth/password-reset/request", {
          method: "POST",
          body: { email: trimmed },
        });
        setSubmitted(true);
      } catch (err) {
        // Always show success to prevent email enumeration
        const msg = getErrorMessage(err);
        if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no user")) {
          setSubmitted(true);
        } else {
          setError(msg);
        }
      }
    });
  }

  if (submitted) {
    return (
      <div className="auth-grid">
        <div className="auth-card">
          <p className="section-kicker">Email sent</p>
          <h2>Check your inbox.</h2>
          <p className="auth-copy" style={{ marginTop: 12 }}>
            If an account exists for <strong>{email}</strong>, you will receive a password reset
            link within a few minutes. Check your spam folder if you don&apos;t see it.
          </p>
          <div className="auth-note">
            <div className="inline-actions">
              <Link href="/login" className="button button-primary">
                Back to login
              </Link>
              <button
                type="button"
                className="button button-soft"
                onClick={() => { setSubmitted(false); setEmail(""); }}
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>

        <div className="auth-card auth-card-muted">
          <p className="section-kicker">Need help?</p>
          <h3>Contact our support team.</h3>
          <p className="auth-copy" style={{ marginTop: 12 }}>
            If you continue to have trouble accessing your account, please email us at{" "}
            <strong>support@borbodhu.com</strong> and our team will assist you within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-grid">
      <div className="auth-card">
        <p className="section-kicker">Reset password</p>
        <h2>Enter your email address.</h2>
        <p className="auth-copy" style={{ marginTop: 8 }}>
          We will send a secure link to this address. The link expires after 1 hour.
        </p>

        {error && <div className="error-banner dashboard-banner" style={{ marginTop: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: 20 }}>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              autoFocus
            />
          </label>

          <button
            type="submit"
            className="button button-primary"
            disabled={isPending || !email.trim()}
            style={{ marginTop: 4 }}
          >
            {isPending ? "Sending reset link…" : "Send Reset Link"}
          </button>

          <div className="auth-note">
            <p>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Back to login
              </Link>
            </p>
            <p style={{ marginTop: 8 }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Register free
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="auth-card auth-card-muted">
        <p className="section-kicker">Security note</p>
        <h3>Your privacy is protected.</h3>
        <p className="auth-copy" style={{ marginTop: 12 }}>
          For security, we never confirm whether an email address is registered. This protects
          member privacy — a core Borbodhu value.
        </p>

        <div style={{ marginTop: 20 }}>
          <p className="section-kicker">Tips</p>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
            <li>Check spam or junk mail folders</li>
            <li>Make sure you used the correct email at registration</li>
            <li>The reset link is valid for 1 hour only</li>
            <li>Contact support if problems persist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
