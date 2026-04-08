import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Member Login | borbodhu.com",
  description: "Log in to your Borbodhu account to search profiles, message matches, and manage your matrimony journey.",
};

export default function LoginPage() {
  return (
    <main className="page-shell">
      <LoginForm
        copy={{
          kicker: "Member Login",
          title: "Welcome back to Borbodhu.",
          body: "Enter your email and password to access your member dashboard.",
          emailLabel: "Email address",
          emailPlaceholder: "your@email.com",
          passwordLabel: "Password",
          submitLabel: "Log In",
          submittingLabel: "Signing in...",
          memberSignupLabel: "Create member account",
          vendorSignupLabel: "",
          quickAccountsKicker: "New to Borbodhu?",
          quickAccountsTitle: "Join thousands of families finding their match.",
          quickAccountsBody: "Registration is free. Start your profile today and let our team verify and activate it within 24 hours.",
          note: "Forgot your password?",
          vendorNote: "",
        }}
      />
    </main>
  );
}
