"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";

import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/ui/password-input";
import { trackProductEvent } from "@/lib/analytics";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginFormCopy = {
  kicker: string;
  title: string;
  body: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  submitLabel: string;
  submittingLabel: string;
  memberSignupLabel: string;
  vendorSignupLabel: string;
  quickAccountsKicker: string;
  quickAccountsTitle: string;
  quickAccountsBody: string;
  note: string;
  vendorNote: string;
};

type LoginFormProps = {
  copy?: Partial<LoginFormCopy>;
  memberSignupHref?: string;
  vendorSignupHref?: string;
  redirectTo?: string;
};

const defaultCopy: LoginFormCopy = {
  kicker: "Member Login",
  title: "Welcome back to Borbodhu.",
  body: "Enter your email and password to access your account.",
  emailLabel: "Email address",
  emailPlaceholder: "your@email.com",
  passwordLabel: "Password",
  submitLabel: "Log In",
  submittingLabel: "Signing in...",
  memberSignupLabel: "Join Free",
  vendorSignupLabel: "Register your business",
  quickAccountsKicker: "New to Borbodhu?",
  quickAccountsTitle: "Join thousands of families finding their match.",
  quickAccountsBody: "Registration is free. Create your profile today and let our team review and activate it within 24 hours.",
  note: "Forgot your password?",
  vendorNote: "Looking to list your wedding business?",
};

export function LoginForm({
  copy,
  memberSignupHref = "/signup",
  vendorSignupHref = "/signup/vendor",
  redirectTo = "/dashboard",
}: LoginFormProps) {
  const router = useRouter();
  const { user, isReady, signIn } = useAuth();
  const resolvedCopy = { ...defaultCopy, ...copy };
  const [isRouting, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace(redirectTo);
    }
  }, [isReady, redirectTo, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: form,
      });

      await signIn(response.accessToken, response.user);
      void trackProductEvent({
        eventName: "LOGIN_SUCCEEDED",
        token: response.accessToken,
        pagePath: "/login",
        metadataJson: {
          roles: response.user.roles,
          redirectTo,
        },
      });
      startTransition(() => {
        router.push(redirectTo);
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-grid">
      <article className="auth-card">
        <p className="section-kicker">{resolvedCopy.kicker}</p>
        <h1>{resolvedCopy.title}</h1>
        <p className="hero-copy auth-copy">{resolvedCopy.body}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{resolvedCopy.emailLabel}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder={resolvedCopy.emailPlaceholder}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>{resolvedCopy.passwordLabel}</span>
            <PasswordInput
              value={form.password}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  password: value,
                }))
              }
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}

          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting || isRouting}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {isSubmitting || isRouting ? resolvedCopy.submittingLabel : resolvedCopy.submitLabel}
          </button>

          <div className="auth-note">
            <p>
              {resolvedCopy.note}{" "}
              <Link href="/forgot-password" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Reset password
              </Link>
            </p>
          </div>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>Or continue with</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="button button-soft"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => nextAuthSignIn("google", { callbackUrl: "/auth/callback" })}
            >
              Google
            </button>
            <button
              type="button"
              className="button button-soft"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => nextAuthSignIn("facebook", { callbackUrl: "/auth/callback" })}
            >
              Facebook
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={memberSignupHref} className="button button-primary" style={{ flex: 1, justifyContent: "center" }}>
            {resolvedCopy.memberSignupLabel}
          </Link>
          <Link href={vendorSignupHref} className="button button-soft" style={{ flex: 1, justifyContent: "center" }}>
            {resolvedCopy.vendorSignupLabel}
          </Link>
        </div>
      </article>

      <aside className="auth-card auth-card-muted">
        <p className="section-kicker">{resolvedCopy.quickAccountsKicker}</p>
        <h2>{resolvedCopy.quickAccountsTitle}</h2>
        <p className="hint">{resolvedCopy.quickAccountsBody}</p>

        <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
          <div style={{ padding: "18px", borderRadius: 20, background: "rgba(138, 57, 71, 0.06)", border: "1px solid rgba(138, 57, 71, 0.12)" }}>
            <p className="section-kicker">Why Borbodhu?</p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
              <li>Admin-reviewed profiles before they go live</li>
              <li>Private photo access with approval system</li>
              <li>Ghotok matchmakers available to help</li>
              <li>Wedding planning tools built in</li>
              <li>BD residents and global diaspora welcome</li>
            </ul>
          </div>

          <div style={{ padding: "18px", borderRadius: 20, background: "rgba(53, 103, 87, 0.06)", border: "1px solid rgba(53, 103, 87, 0.12)" }}>
            <p className="section-kicker" style={{ color: "var(--leaf)" }}>Vendor access</p>
            <p className="hint">{resolvedCopy.vendorNote}</p>
            <Link href={vendorSignupHref} className="button button-soft" style={{ marginTop: 12, display: "inline-flex" }}>
              Register your business →
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}
