"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";

const publicFooterLinks = [
  {
    heading: "Find a match",
    links: [
      { href: "/profiles", label: "Search profiles" },
      { href: "/profiles?sortBy=new_signups", label: "New members" },
      { href: "/ghotok", label: "Ghotok matchmakers" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/upgrade", label: "Membership plans" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: "/vendors", label: "Wedding vendors" },
      { href: "/wedding-planning", label: "Wedding planning" },
      { href: "/signup/vendor", label: "List your business" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Borbodhu" },
      { href: "/contact", label: "Contact us" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/signup", label: "Join Free" },
      { href: "/login", label: "Member login" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
];

export function SiteFooter() {
  const { isReady, user } = useAuth();
  const year = new Date().getFullYear();
  const isLoggedIn = isReady && !!user;
  const loggedInAccountLinks = {
    heading: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/search", label: "Search profiles" },
      { href: "/upgrade", label: "Membership plans" },
    ],
  };
  const footerLinks = isLoggedIn
    ? [...publicFooterLinks.filter((col) => col.heading !== "Account"), loggedInAccountLinks]
    : publicFooterLinks;

  return (
    <footer
      style={{
        background: "var(--deep)",
        color: "rgba(255,255,255,0.75)",
        marginTop: "auto",
        padding: "48px 0 0",
      }}
    >
      <div className="page-shell">
        {/* Brand + columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `1fr repeat(${footerLinks.length}, auto)`,
            gap: 32,
            paddingBottom: 40,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexWrap: "wrap",
          }}
        >
          {/* Brand */}
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: `1fr repeat(${footerLinks.length}, auto)`, gap: 32, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--rose)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ব
                </span>
                <strong style={{ color: "#fff", fontSize: "1.05rem" }}>borbodhu.com</strong>
              </div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 220, margin: 0 }}>
                Trusted Bangladeshi matrimony for home and diaspora. Verified profiles, Ghotok
                matchmakers, and a complete wedding planning suite.
              </p>
              <p style={{ fontSize: "0.8rem", marginTop: 12, color: "rgba(255,255,255,0.5)" }}>
                Available in English &amp; বাংলা
              </p>
            </div>

            {footerLinks.map((col) => (
              <div key={col.heading}>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 12,
                  }}
                >
                  {col.heading}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {col.links.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            gap: 16,
            flexWrap: "wrap",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <p style={{ margin: 0 }}>
            © {year} borbodhu.com — All rights reserved
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              Privacy
            </Link>
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              Terms
            </Link>
            <Link href="/contact" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
