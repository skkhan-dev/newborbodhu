import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Set New Password | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="page-shell">
      <Suspense fallback={<div className="auth-grid"><div className="auth-card"><p>Loading…</p></div></div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
