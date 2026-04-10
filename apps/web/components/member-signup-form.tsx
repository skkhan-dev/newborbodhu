"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useAuth } from "@/components/auth-provider";
import { trackProductEvent } from "@/lib/analytics";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

type RegisterResponse = {
  accessToken: string;
  user: AuthUser;
  nextStep: string;
};

export type MemberSignupCopy = {
  kicker: string;
  title: string;
  body: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  locale: string;
  gender: string;
  lookingFor: string;
  birthDate: string;
  currentCountry: string;
  homeCountry: string;
  submitLabel: string;
  submittingLabel: string;
};

type MemberSignupFormProps = {
  copy?: Partial<MemberSignupCopy>;
  redirectTo?: string;
};

const countryOptions = ["BD", "US", "GB", "CA", "AE", "AU"];

const defaultCopy: MemberSignupCopy = {
  kicker: "বিনামূল্যে রেজিস্ট্রেশন · Free Registration",
  title: "Create your Borbodhu profile and start your journey.",
  body: "Registration is free. Fill in the basics below — you can complete your full profile, partner preferences, and photo uploads from your dashboard after signing up.",
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  password: "Password",
  confirmPassword: "Confirm password",
  locale: "Preferred language",
  gender: "I am a",
  lookingFor: "Looking for",
  birthDate: "Date of birth",
  currentCountry: "Current country",
  homeCountry: "Home country (origin)",
  submitLabel: "Join Free",
  submittingLabel: "Creating your account…",
};

export function MemberSignupForm({
  copy,
  redirectTo = "/dashboard",
}: MemberSignupFormProps) {
  const router = useRouter();
  const { user, isReady, signIn } = useAuth();
  const resolvedCopy = { ...defaultCopy, ...copy };
  const [isRouting, startTransition] = useTransition();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredLocale: "EN",
    gender: "WOMAN",
    lookingFor: "MAN",
    birthDate: "",
    currentCountryCode: "BD",
    homeCountryCode: "BD",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace(redirectTo);
    }
  }, [isReady, redirectTo, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation must match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<RegisterResponse>("/auth/register/member", {
        method: "POST",
        body: {
          email: form.email,
          password: form.password,
          preferredLocale: form.preferredLocale,
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          gender: form.gender,
          lookingFor: form.lookingFor,
          birthDate: form.birthDate || undefined,
          currentCountryCode: form.currentCountryCode,
          homeCountryCode: form.homeCountryCode,
        },
      });

      setSuccess("Member account created. You are being taken to your dashboard.");
      await signIn(response.accessToken, response.user);
      void trackProductEvent({
        eventName: "MEMBER_SIGNUP_COMPLETED",
        token: response.accessToken,
        locale: form.preferredLocale === "BN" ? "bn" : "en",
        pagePath: "/signup",
        metadataJson: {
          gender: form.gender,
          lookingFor: form.lookingFor,
          currentCountryCode: form.currentCountryCode,
          homeCountryCode: form.homeCountryCode,
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
          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.firstName}</span>
              <input
                type="text"
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.lastName}</span>
              <input
                type="text"
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span>{resolvedCopy.email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              autoComplete="email"
              required
            />
          </label>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.password}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                autoComplete="new-password"
                required
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.confirmPassword}</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                autoComplete="new-password"
                required
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.locale}</span>
              <select
                value={form.preferredLocale}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferredLocale: event.target.value,
                  }))
                }
              >
                <option value="EN">English</option>
                <option value="BN">Bangla</option>
              </select>
            </label>

            <label className="field">
              <span>{resolvedCopy.gender}</span>
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
              >
                <option value="MAN">Man</option>
                <option value="WOMAN">Woman</option>
              </select>
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.lookingFor}</span>
              <select
                value={form.lookingFor}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lookingFor: event.target.value,
                  }))
                }
              >
                <option value="MAN">Man</option>
                <option value="WOMAN">Woman</option>
              </select>
            </label>

            <label className="field">
              <span>{resolvedCopy.birthDate}</span>
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.currentCountry}</span>
              <select
                value={form.currentCountryCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentCountryCode: event.target.value,
                  }))
                }
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{resolvedCopy.homeCountry}</span>
              <select
                value={form.homeCountryCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    homeCountryCode: event.target.value,
                  }))
                }
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}
          {success ? <div className="success-banner">{success}</div> : null}

          <div className="inline-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting || isRouting}
            >
              {isSubmitting || isRouting
                ? resolvedCopy.submittingLabel
                : resolvedCopy.submitLabel}
            </button>
            <Link href="/login" className="button button-soft">
              Log in instead
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
