import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="persona-hero auth-hero">
        <div>
          <p className="section-kicker">
            {locale === "bn" ? "নতুন পাসওয়ার্ড" : "Set New Password"}
          </p>
          <h1>
            {locale === "bn"
              ? "আপনার নতুন পাসওয়ার্ড বেছে নিন।"
              : "Choose your new password."}
          </h1>
          <p className="hero-copy">
            {locale === "bn"
              ? "নিচে আপনার নতুন পাসওয়ার্ড দিন এবং নিশ্চিত করুন। এটি কমপক্ষে ৮ অক্ষরের হতে হবে।"
              : "Enter and confirm your new password below. It must be at least 8 characters."}
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="auth-grid"><div className="auth-card"><p>Loading…</p></div></div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
