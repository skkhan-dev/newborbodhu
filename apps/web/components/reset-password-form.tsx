"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await apiRequest("/auth/password-reset/confirm", {
          method: "POST",
          body: { token, newPassword: form.newPassword },
        });
        setDone(true);
      } catch (err) {
        const msg = getErrorMessage(err);
        if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
          setError("This reset link has expired or is invalid. Please request a new one.");
        } else {
          setError(msg);
        }
      }
    });
  }

  if (!token) {
    return (
      <div className="auth-grid">
        <div className="auth-card">
          <p className="section-kicker">Invalid link</p>
          <h2>This reset link is not valid.</h2>
          <p className="auth-copy" style={{ marginTop: 12 }}>
            The password reset link is missing a token. Please request a new reset link from the
            forgot password page.
          </p>
          <div className="auth-note" style={{ marginTop: 20 }}>
            <Link href="/forgot-password" className="button button-primary">
              Request new link
            </Link>
          </div>
        </div>
        <div className="auth-card auth-card-muted">
          <p className="section-kicker">Need help?</p>
          <h3>Contact our support team.</h3>
          <p className="auth-copy" style={{ marginTop: 12 }}>
            Email us at <strong>support@borbodhu.com</strong> and our team will assist you within
            24 hours.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-grid">
        <div className="auth-card">
          <p className="section-kicker">Password updated</p>
          <h2>Your password has been reset.</h2>
          <p className="auth-copy" style={{ marginTop: 12 }}>
            You can now log in with your new password. For security, this reset link can no longer
            be used.
          </p>
          <div className="auth-note" style={{ marginTop: 20 }}>
            <Link href="/login" className="button button-primary">
              Log in now
            </Link>
          </div>
        </div>
        <div className="auth-card auth-card-muted">
          <p className="section-kicker">Security tips</p>
          <h3>Keep your account safe.</h3>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
            <li>Use a unique password not used on other sites</li>
            <li>Store it in a password manager</li>
            <li>Never share your password with anyone</li>
            <li>Contact support if you suspect unauthorised access</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-grid">
      <div className="auth-card">
        <p className="section-kicker">Set new password</p>
        <h2>Choose a new password.</h2>
        <p className="auth-copy" style={{ marginTop: 8 }}>
          Enter and confirm your new password below. It must be at least 8 characters.
        </p>

        {error && (
          <div className="error-banner dashboard-banner" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: 20 }}>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="button button-primary"
            disabled={isPending || !form.newPassword || !form.confirm}
            style={{ marginTop: 4 }}
          >
            {isPending ? "Saving…" : "Set New Password"}
          </button>

          <div className="auth-note">
            <p>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Back to login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="auth-card auth-card-muted">
        <p className="section-kicker">Reset link</p>
        <h3>This link is single-use and expires in 1 hour.</h3>
        <p className="auth-copy" style={{ marginTop: 12 }}>
          For your security, each reset link can only be used once. Once you submit your new
          password, this link is invalidated.
        </p>

        <div style={{ marginTop: 20 }}>
          <p className="section-kicker">Need a new link?</p>
          <p className="hint" style={{ marginTop: 8 }}>
            If this link has expired, request a fresh one at any time.
          </p>
          <Link
            href="/forgot-password"
            className="button button-soft"
            style={{ marginTop: 12, display: "inline-flex" }}
          >
            Request new link →
          </Link>
        </div>
      </div>
    </div>
  );
}
