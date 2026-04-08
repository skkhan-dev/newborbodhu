import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password | borbodhu.com",
  description: "Reset your Borbodhu account password. Enter your email address and we will send you a secure reset link.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell">
      <section className="persona-hero auth-hero">
        <div>
          <p className="section-kicker">পাসওয়ার্ড রিসেট · Password Reset</p>
          <h1>Forgot your password? No problem.</h1>
          <p className="hero-copy">
            Enter the email address linked to your Borbodhu account and we will send you a secure
            link to create a new password. The link is valid for 1 hour.
          </p>
        </div>
      </section>

      <ForgotPasswordForm />
    </main>
  );
}
