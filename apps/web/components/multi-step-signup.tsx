"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/ui/password-input";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type RegisterResponse = { accessToken: string; user: AuthUser; nextStep: string };

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  preferredLocale: string;
  lookingFor: string;
  gender: string;
};

const defaultForm: SignupForm = {
  firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  preferredLocale: "EN", lookingFor: "MAN", gender: "WOMAN",
};

export function MultiStepSignup({ redirectTo = "/dashboard/setup" }: { redirectTo?: string }) {
  const router = useRouter();
  const auth = useAuth();
  const [form, setForm] = useState<SignupForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (auth.isReady && auth.user) {
      router.replace("/dashboard");
    }
  }, [auth.isReady, auth.user, router]);

  function u(key: keyof SignupForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    // Accept formats: +8801XXXXXXXXX, 01XXXXXXXXX, or other international +XX... numbers
    if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone.trim())) { setError("Please enter a valid phone number (e.g. +880 1XXX XXXXXX)."); return; }
    setIsBusy(true);
    try {
      const res = await apiRequest<RegisterResponse>("/auth/register/member", {
        method: "POST",
        body: {
          email: form.email,
          password: form.password,
          preferredLocale: form.preferredLocale,
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          gender: form.gender,
          lookingFor: form.lookingFor,
          phone: form.phone,
        },
      });
      await auth.signIn(res.accessToken, res.user);
      router.push(redirectTo);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (!auth.isReady) return null;

  return (
    <div className="page-shell">
      <section className="auth-grid">
        {/* ── Form card ─────────────────────────────────────────────────── */}
        <article className="auth-card">
          <p className="section-kicker">Join Free</p>
          <h1 style={{ marginBottom: 4 }}>Join Borbodhu</h1>
          <p className="auth-copy" style={{ marginBottom: 24 }}>
            Free registration. Our team reviews and activates your profile within 24 hours.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-grid">
              <label className="field">
                <span>First name</span>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => u("firstName", e.target.value)}
                  required
                  autoComplete="given-name"
                  autoFocus
                  placeholder="e.g. Ayesha"
                />
              </label>
              <label className="field">
                <span>Last name <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></span>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => u("lastName", e.target.value)}
                  autoComplete="family-name"
                  placeholder="e.g. Rahman"
                />
              </label>
            </div>

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => u("email", e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
              />
            </label>

            <label className="field">
              <span>Phone number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => u("phone", e.target.value)}
                required
                autoComplete="tel"
                placeholder="+880 1XXX XXXXXX"
              />
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                Used to verify your identity. Never shown publicly.
              </span>
            </label>

            <div className="input-grid">
              <label className="field">
                <span>Password</span>
                <PasswordInput
                  value={form.password}
                  onChange={(v) => u("password", v)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(v) => u("confirmPassword", v)}
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            <div
              style={{
                padding: "16px 18px",
                borderRadius: 16,
                background: "var(--rose-soft)",
                border: "1px solid rgba(139,26,48,0.1)",
                display: "grid",
                gap: 14,
              }}
            >
              <label className="field">
                <span style={{ color: "var(--ink)" }}>I am looking for</span>
                <select
                  value={form.lookingFor}
                  onChange={(e) => {
                    u("lookingFor", e.target.value);
                    u("gender", e.target.value === "MAN" ? "WOMAN" : "MAN");
                  }}
                >
                  <option value="MAN">A Groom (Man)</option>
                  <option value="WOMAN">A Bride (Woman)</option>
                </select>
              </label>
              <label className="field">
                <span style={{ color: "var(--ink)" }}>Preferred language</span>
                <select
                  value={form.preferredLocale}
                  onChange={(e) => u("preferredLocale", e.target.value)}
                >
                  <option value="EN">English</option>
                  <option value="BN">বাংলা</option>
                </select>
              </label>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="submit"
              className="button button-primary"
              disabled={isBusy}
              style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: "1rem" }}
            >
              {isBusy ? "Creating account…" : "Join Free →"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center" }}>
              By signing up you agree to our{" "}
              <Link href="/privacy" style={{ color: "var(--rose)", fontWeight: 600 }}>Privacy Policy</Link>
              {". "}
              A verification email will be sent after registration.
            </p>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)", textAlign: "center" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--rose)", fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </div>
        </article>

        {/* ── Info panel ────────────────────────────────────────────────── */}
        <aside className="auth-card auth-card-muted">
          <p className="section-kicker">Why Borbodhu?</p>
          <h2 style={{ marginBottom: 8 }}>Trusted by thousands of Bangladeshi families.</h2>
          <p className="hint" style={{ marginBottom: 20 }}>
            Bangladesh&apos;s first matrimony platform with admin-reviewed profiles and built-in wedding services.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              { icon: "✅", title: "Admin-reviewed profiles", body: "Every profile is checked by our team before going live. No fake accounts." },
              { icon: "🔒", title: "Private photo system", body: "Your photos are only shared when you approve a request." },
              { icon: "🤝", title: "Ghotok matchmakers", body: "Professional matchmakers available to help find the right match." },
              { icon: "🌏", title: "BD residents & diaspora", body: "Members across Bangladesh, UK, USA, Canada, Australia, and beyond." },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(255,253,249,0.7)",
                  border: "1px solid rgba(201,151,58,0.13)",
                }}
              >
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0, color: "var(--ink)" }}>{title}</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "3px 0 0", lineHeight: 1.5 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(53,103,87,0.06)",
              border: "1px solid rgba(53,103,87,0.15)",
            }}
          >
            <p className="section-kicker" style={{ color: "var(--leaf, #2d6a4f)" }}>Wedding business?</p>
            <p className="hint" style={{ marginBottom: 12, fontSize: "0.82rem" }}>
              List your venue, photography, catering, or other wedding services on Borbodhu.
            </p>
            <Link href="/signup/vendor" className="button button-soft" style={{ display: "inline-flex", fontSize: "0.85rem" }}>
              Register your business →
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
