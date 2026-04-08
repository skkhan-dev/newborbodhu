"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { persistAccessToken } from "@/lib/auth";

/**
 * Bridge page: after OAuth callback, reads the NextAuth session
 * (which contains the Borbodhu accessToken from the JWT callback),
 * writes it to localStorage, then redirects to the dashboard.
 */
export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    const extended = session as unknown as Record<string, unknown>;
    const accessToken = extended.accessToken as string | undefined;

    if (accessToken) {
      persistAccessToken(accessToken);
      router.push("/dashboard");
    } else {
      setError("No access token received. Please try logging in again.");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [session, status, router]);

  return (
    <main className="page-shell" style={{ textAlign: "center", paddingTop: 120 }}>
      {error ? (
        <div>
          <p className="section-kicker" style={{ color: "var(--rose)" }}>Authentication Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <p className="section-kicker">Completing sign-in...</p>
          <p>Please wait while we set up your session.</p>
        </div>
      )}
    </main>
  );
}
