import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Borbodhu | বরবধূ সম্পর্কে | Trusted Bangladeshi Matrimony",
  description:
    "Borbodhu is Bangladesh's trusted matrimony platform connecting Bangladeshi families at home and in the diaspora. Learn about our mission, values, and how we work.",
};

export default function AboutPage() {
  return (
    <main className="page-shell">
      {/* Hero */}
      <section className="hero-card public-home-hero" style={{ marginBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <p className="section-kicker">আমাদের সম্পর্কে · About Us</p>
          <h1>Building trust between Bangladeshi families, one verified match at a time.</h1>
          <p className="hero-copy">
            Borbodhu was founded to bring the trusted values of Bangladeshi family matchmaking into
            a modern, safe, and privacy-first platform — for families in Bangladesh and across the
            global diaspora.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-block">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          <div>
            <p className="section-kicker">Our mission</p>
            <h2>A safe, family-friendly path to finding a life partner.</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, marginTop: 12 }}>
              We believe matrimony is more than a transaction — it&apos;s a family decision. Borbodhu
              is designed around that belief. Every profile is admin-reviewed before going live.
              Contact details are private until both parties agree. Photos can be set to private
              and shared only on request.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, marginTop: 12 }}>
              We serve Bangladeshi Muslims, Hindus, and Christians — in Dhaka, Chittagong, Sylhet,
              London, New York, Toronto, Dubai, and everywhere the Bangladeshi community has made
              its home.
            </p>
          </div>

          <div>
            <p className="section-kicker">Why we&apos;re different</p>
            <h2 style={{ fontSize: "1.4rem" }}>Built for families, not algorithms.</h2>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "16px 0 0",
                display: "grid",
                gap: 14,
              }}
            >
              {[
                {
                  title: "Admin-reviewed profiles",
                  body: "Every new profile is reviewed by our team before it goes live. No bots, no fakes.",
                },
                {
                  title: "Ghotok matchmakers",
                  body: "Traditional matchmaking, now digital. Ghotoks can manage profiles and facilitate introductions.",
                },
                {
                  title: "Private by default",
                  body: "Contact details and private photos are hidden until you choose to share them.",
                },
                {
                  title: "BD + diaspora",
                  body: "Profiles from all over Bangladesh and the global community — United Kingdom, United States, Canada, Middle East, Australia, and beyond.",
                },
                {
                  title: "Wedding planning built in",
                  body: "Once you find your match, plan your wedding with our vendor directory and planning tools.",
                },
              ].map(({ title, body }) => (
                <li key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    style={{
                      color: "var(--rose)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <strong style={{ fontSize: "0.92rem" }}>{title}</strong>
                    <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-block">
        <div
          style={{
            background: "var(--deep)",
            borderRadius: 20,
            padding: "40px 32px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 24,
            textAlign: "center",
          }}
        >
          {[
            { stat: "7,350+", label: "Active profiles" },
            { stat: "100%", label: "Admin verified" },
            { stat: "24h", label: "Profile review time" },
            { stat: "40+", label: "Countries represented" },
          ].map(({ stat, label }) => (
            <div key={label}>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>
                {stat}
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">How it works</p>
            <h2>From registration to proposal — a simple path.</h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginTop: 28,
          }}
        >
          {[
            { step: "1", title: "Create your profile", body: "Register free. Tell us about yourself, your background, and what you're looking for in a partner." },
            { step: "2", title: "Admin review", body: "Our team reviews every profile within 24 hours to ensure authenticity and community standards." },
            { step: "3", title: "Get discovered", body: "Your profile goes live. Families and individuals can find you through search, and Ghotoks can recommend you." },
            { step: "4", title: "Connect privately", body: "Send interests, exchange messages, and share contact details — always with your consent." },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "22px 20px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--rose)",
                  color: "#fff",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                {step}
              </div>
              <strong style={{ fontSize: "0.95rem" }}>{title}</strong>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Actor types */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Who uses Borbodhu</p>
            <h2>Four ways to be part of our community.</h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {[
            {
              icon: "👤",
              title: "Members",
              body: "Individuals and families looking for a life partner. Create a free profile, browse, and connect.",
              cta: "Register free",
              href: "/signup",
            },
            {
              icon: "🤝",
              title: "Ghotoks",
              body: "Professional matchmakers who manage profiles, facilitate introductions, and earn credits per connection.",
              cta: "Learn more",
              href: "/ghotok",
            },
            {
              icon: "🏪",
              title: "Vendors",
              body: "Wedding businesses — photographers, venues, caterers — who want to reach Bangladeshi families planning their weddings.",
              cta: "List your business",
              href: "/signup/vendor",
            },
            {
              icon: "💍",
              title: "Families",
              body: "Parents and guardians searching on behalf of their children. Borbodhu is family-safe by design.",
              cta: "Start searching",
              href: "/profiles",
            },
          ].map(({ icon, title, body, cta, href }) => (
            <div
              key={title}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ fontSize: "2rem" }}>{icon}</span>
              <strong style={{ fontSize: "1rem" }}>{title}</strong>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6, flex: 1 }}>
                {body}
              </p>
              <Link href={href} className="button button-soft" style={{ fontSize: "0.82rem", alignSelf: "flex-start" }}>
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-block">
        <div
          style={{
            background: "rgba(138, 57, 71, 0.06)",
            border: "1px solid rgba(138, 57, 71, 0.15)",
            borderRadius: 20,
            padding: "36px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="section-kicker">Ready to start?</p>
            <h3 style={{ margin: "4px 0 8px" }}>
              Join the Borbodhu community today — it&apos;s free.
            </h3>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.88rem" }}>
              Questions? Email us at{" "}
              <a href="mailto:support@borbodhu.com" style={{ color: "var(--rose)", fontWeight: 600 }}>
                support@borbodhu.com
              </a>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/signup" className="button button-primary">
              Create free account
            </Link>
            <Link href="/contact" className="button button-soft">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
