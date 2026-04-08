import { Suspense } from "react";
import type { Metadata } from "next";

import { VerifyEmailPage } from "@/components/verify-email-page";

export const metadata: Metadata = {
  title: "Verify Email | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="hero-card"><p>Loading…</p></div></div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
