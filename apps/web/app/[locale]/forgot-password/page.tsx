import { notFound } from "next/navigation";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedForgotPasswordPage({
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
            {locale === "bn" ? "পাসওয়ার্ড রিসেট" : "Password Reset"}
          </p>
          <h1>
            {locale === "bn"
              ? "পাসওয়ার্ড ভুলে গেছেন? কোনো সমস্যা নেই।"
              : "Forgot your password? No problem."}
          </h1>
          <p className="hero-copy">
            {locale === "bn"
              ? "আপনার বরবধূ অ্যাকাউন্টের সাথে যুক্ত ইমেইল দিন। আমরা একটি নিরাপদ লিঙ্ক পাঠাব যা ১ ঘণ্টার জন্য বৈধ।"
              : "Enter the email linked to your Borbodhu account. We will send you a secure reset link valid for 1 hour."}
          </p>
        </div>
      </section>

      <ForgotPasswordForm />
    </main>
  );
}
