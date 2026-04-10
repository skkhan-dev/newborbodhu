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

export type VendorSignupCopy = {
  kicker: string;
  title: string;
  body: string;
  businessName: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  locale: string;
  password: string;
  confirmPassword: string;
  division: string;
  district: string;
  area: string;
  website: string;
  address: string;
  descriptionEn: string;
  descriptionBn: string;
  submitLabel: string;
  submittingLabel: string;
  memberButton: string;
  sideKicker: string;
  sideTitle: string;
  sidePoints: string[];
};

type VendorSignupFormProps = {
  copy?: Partial<VendorSignupCopy>;
  memberSignupHref?: string;
  redirectTo?: string;
};

const defaultCopy: VendorSignupCopy = {
  kicker: "Vendor Signup",
  title: "Create a real vendor account in the Borbodhu test system.",
  body: "This signs up a wedding business, opens the vendor dashboard, and lets you publish packages and receive real leads from the public vendor pages.",
  businessName: "Business name",
  category: "Category",
  contactPerson: "Contact person",
  phone: "Phone",
  email: "Email",
  locale: "Language version",
  password: "Password",
  confirmPassword: "Confirm password",
  division: "Division",
  district: "District",
  area: "Area",
  website: "Website",
  address: "Address",
  descriptionEn: "Description (English)",
  descriptionBn: "Description (Bangla)",
  submitLabel: "Create vendor account",
  submittingLabel: "Creating vendor...",
  memberButton: "Join Free",
  sideKicker: "Why vendors matter",
  sideTitle: "Wedding planning becomes a stronger business when vendors can self-serve.",
  sidePoints: [
    "Publish packages in English and Bangla.",
    "Receive direct leads from public vendor pages.",
    "Stay visible for members in Bangladesh and abroad.",
  ],
};

export function VendorSignupForm({
  copy,
  memberSignupHref = "/signup",
  redirectTo = "/dashboard",
}: VendorSignupFormProps) {
  const router = useRouter();
  const { user, isReady, signIn } = useAuth();
  const resolvedCopy = { ...defaultCopy, ...copy };
  const [isRouting, startTransition] = useTransition();
  const [form, setForm] = useState({
    businessName: "",
    categoryName: "Wedding Planner",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredLocale: "EN",
    division: "Dhaka",
    district: "Dhaka",
    area: "",
    address: "",
    website: "",
    descriptionEn: "",
    descriptionBn: "",
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
      const response = await apiRequest<RegisterResponse>("/auth/register/vendor", {
        method: "POST",
        body: {
          businessName: form.businessName,
          categoryName: form.categoryName,
          contactPerson: form.contactPerson || undefined,
          phone: form.phone || undefined,
          email: form.email,
          password: form.password,
          preferredLocale: form.preferredLocale,
          division: form.division || undefined,
          district: form.district || undefined,
          area: form.area || undefined,
          address: form.address || undefined,
          website: form.website || undefined,
          descriptionEn: form.descriptionEn || undefined,
          descriptionBn: form.descriptionBn || undefined,
        },
      });

      setSuccess("Vendor account created. You are being taken to your dashboard.");
      await signIn(response.accessToken, response.user);
      void trackProductEvent({
        eventName: "VENDOR_SIGNUP_COMPLETED",
        token: response.accessToken,
        locale: form.preferredLocale === "BN" ? "bn" : "en",
        pagePath: "/signup/vendor",
        metadataJson: {
          categoryName: form.categoryName,
          division: form.division,
          district: form.district,
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
              <span>{resolvedCopy.businessName}</span>
              <input
                type="text"
                value={form.businessName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    businessName: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.category}</span>
              <input
                type="text"
                value={form.categoryName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryName: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.contactPerson}</span>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contactPerson: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.phone}</span>
              <input
                type="text"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
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
                required
              />
            </label>

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
          </div>

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
                required
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.division}</span>
              <input
                type="text"
                value={form.division}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    division: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.district}</span>
              <input
                type="text"
                value={form.district}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    district: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{resolvedCopy.area}</span>
              <input
                type="text"
                value={form.area}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    area: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{resolvedCopy.website}</span>
              <input
                type="text"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span>{resolvedCopy.address}</span>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{resolvedCopy.descriptionEn}</span>
            <textarea
              rows={3}
              value={form.descriptionEn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  descriptionEn: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{resolvedCopy.descriptionBn}</span>
            <textarea
              rows={3}
              value={form.descriptionBn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  descriptionBn: event.target.value,
                }))
              }
            />
          </label>

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
            <Link href={memberSignupHref} className="button button-soft">
              {resolvedCopy.memberButton}
            </Link>
          </div>
        </form>
      </article>

      <aside className="auth-card auth-card-muted">
        <p className="section-kicker">{resolvedCopy.sideKicker}</p>
        <h2>{resolvedCopy.sideTitle}</h2>
        <ul className="feature-list">
          {resolvedCopy.sidePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
