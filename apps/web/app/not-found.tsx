import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="page-shell" style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: "4rem", margin: "0 0 8px", opacity: 0.3 }}>404</p>
        <h1 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>Page not found</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 28px" }}>
          The page you are looking for does not exist or may have been moved. Try searching for
          profiles or go back to the homepage.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="button button-primary">
            Go to homepage
          </Link>
          <Link href="/profiles" className="button button-soft">
            Browse profiles
          </Link>
          <Link href="/contact" className="button button-soft">
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
