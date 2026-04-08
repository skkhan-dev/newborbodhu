"use client";

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

  // Redirect if already logged in
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
      <div className="hero-card">
        <div style={{ marginBottom: 24 }}>
          <p className="section-kicker">Create account</p>
          <h2>Join Borbodhu</h2>
          <p className="hint">Join thousands of Bangladeshi families finding their match.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-grid">
            <label className="field">
              <span>First name</span>
              <input type="text" value={form.firstName} onChange={(e) => u("firstName", e.target.value)} required autoComplete="given-name" autoFocus />
            </label>
            <label className="field">
              <span>Last name (optional)</span>
              <input type="text" value={form.lastName} onChange={(e) => u("lastName", e.target.value)} autoComplete="family-name" />
            </label>
          </div>

          <label className="field">
            <span>Email address</span>
            <input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} required autoComplete="email" />
          </label>

          <label className="field">
            <span>Phone number <span style={{ color: "var(--rose)", fontWeight: 700 }}>*</span></span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => u("phone", e.target.value)}
              required
              autoComplete="tel"
              placeholder="+880 1XXX XXXXXX"
            />
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
              Used by our team to verify your identity. Never shown publicly.
            </span>
          </label>

          <div className="input-grid">
            <label className="field">
              <span>Password</span>
              <PasswordInput value={form.password} onChange={(v) => u("password", v)} autoComplete="new-password" required />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <PasswordInput value={form.confirmPassword} onChange={(v) => u("confirmPassword", v)} autoComplete="new-password" required />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>Preferred language</span>
              <select value={form.preferredLocale} onChange={(e) => u("preferredLocale", e.target.value)}>
                <option value="EN">English</option>
                <option value="BN">বাংলা</option>
              </select>
            </label>
            <label className="field">
              <span>I am looking for</span>
              <select value={form.lookingFor} onChange={(e) => {
                u("lookingFor", e.target.value);
                u("gender", e.target.value === "MAN" ? "WOMAN" : "MAN");
              }}>
                <option value="MAN">A Groom (Man)</option>
                <option value="WOMAN">A Bride (Woman)</option>
              </select>
            </label>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="button button-primary" disabled={isBusy} style={{ width: "100%", justifyContent: "center" }}>
            {isBusy ? "Creating account…" : "Create Account & Continue"}
          </button>

          <p style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "center", marginTop: 8 }}>
            A verification email will be sent to confirm your address.
          </p>
        </form>
      </div>
    </div>
  );
}
