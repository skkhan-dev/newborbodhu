"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export function AdminLoginGate() {
  const router = useRouter();
  const { user, isReady, signIn } = useAuth();
  const [isRouting, startTransition] = useTransition();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as admin/super-admin, redirect to dashboard
  useEffect(() => {
    if (isReady && user) {
      const isAdmin =
        user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
      if (isAdmin) {
        router.replace("/dashboard");
      } else {
        setError("Your account does not have admin access.");
      }
    }
  }, [isReady, router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: form.email, password: form.password },
      });

      const isAdmin =
        response.user.roles.includes("ADMIN") ||
        response.user.roles.includes("SUPER_ADMIN");

      if (!isAdmin) {
        setError("This login page is for admin and super-admin accounts only.");
        setIsSubmitting(false);
        return;
      }

      await signIn(response.accessToken, response.user);
      startTransition(() => {
        router.push("/dashboard");
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-grid">
      <article className="auth-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              background: "var(--rose)",
              color: "#fff",
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Admin access
          </span>
        </div>

        <p className="section-kicker">borbodhu.com</p>
        <h1>Admin &amp; Super Admin Login</h1>
        <p className="hero-copy auth-copy">
          This page is for platform administrators only. Members should use the{" "}
          <Link href="/login" style={{ color: "var(--rose)" }}>
            member login page
          </Link>
          .
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="admin@borbodhu.com"
              autoComplete="email"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || isRouting}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {isSubmitting || isRouting ? "Signing in…" : "Sign In to Admin"}
          </button>

          <div className="auth-note">
            <p>
              Forgot your password?{" "}
              <Link href="/forgot-password" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Reset password
              </Link>
            </p>
          </div>
        </form>
      </article>

      <aside className="auth-card auth-card-muted">
        <p className="section-kicker">Restricted access</p>
        <h2>Admin panel.</h2>
        <p className="hint">
          This login is restricted to accounts with Admin or Super Admin roles. Logging in with
          a member, ghotok, or vendor account will be rejected.
        </p>

        <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
          <div
            style={{
              padding: "18px",
              borderRadius: 20,
              background: "rgba(138, 57, 71, 0.06)",
              border: "1px solid rgba(138, 57, 71, 0.12)",
            }}
          >
            <p className="section-kicker">Admin capabilities</p>
            <ul
              style={{
                margin: "8px 0 0",
                paddingLeft: 18,
                color: "var(--muted)",
                lineHeight: 1.8,
              }}
            >
              <li>Review and approve pending profiles</li>
              <li>Manage member accounts</li>
              <li>Process membership payments</li>
              <li>Manage coupons</li>
              <li>View sales dashboard</li>
            </ul>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: 20,
              background: "rgba(53, 103, 87, 0.06)",
              border: "1px solid rgba(53, 103, 87, 0.12)",
            }}
          >
            <p className="section-kicker" style={{ color: "var(--leaf)" }}>
              Super Admin only
            </p>
            <ul
              style={{
                margin: "8px 0 0",
                paddingLeft: 18,
                color: "var(--muted)",
                lineHeight: 1.8,
              }}
            >
              <li>Manage admin accounts</li>
              <li>Email campaign management</li>
              <li>Membership plan configuration</li>
              <li>Platform-wide settings</li>
              <li>Full analytics and reporting</li>
            </ul>
          </div>
        </div>
      </aside>
    </section>
  );
}
