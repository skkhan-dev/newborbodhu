import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Borbodhu | যোগাযোগ | Get in Touch",
  description:
    "Contact the Borbodhu team for support, partnership enquiries, or general questions about our Bangladeshi matrimony platform.",
};

export default function ContactPage() {
  return (
    <main className="page-shell">
      <section className="hero-card public-home-hero" style={{ marginBottom: 0 }}>
        <div style={{ maxWidth: 600 }}>
          <p className="section-kicker">যোগাযোগ · Get in Touch</p>
          <h1>We&apos;re here to help.</h1>
          <p className="hero-copy">
            Whether you have a question about your account, a partnership enquiry, or feedback
            about the platform — our team responds within 24 hours.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Member support */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "28px 24px",
            }}
          >
            <p className="section-kicker">Member support</p>
            <h3 style={{ margin: "6px 0 12px" }}>Account, profile, and billing help.</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 16px" }}>
              For help with your profile, login issues, photo approvals, membership, or any
              account-related questions.
            </p>
            <a
              href="mailto:support@borbodhu.com"
              className="button button-primary"
              style={{ display: "inline-flex" }}
            >
              support@borbodhu.com
            </a>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "10px 0 0" }}>
              Response time: within 24 hours
            </p>
          </div>

          {/* Vendor & partnerships */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "28px 24px",
            }}
          >
            <p className="section-kicker" style={{ color: "var(--leaf)" }}>
              Vendor &amp; partnerships
            </p>
            <h3 style={{ margin: "6px 0 12px" }}>List your business or partner with us.</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 16px" }}>
              For wedding businesses interested in listing on Borbodhu, advertising enquiries,
              or media and press partnerships.
            </p>
            <a
              href="mailto:partners@borbodhu.com"
              className="button button-soft"
              style={{ display: "inline-flex" }}
            >
              partners@borbodhu.com
            </a>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "10px 0 0" }}>
              Response time: within 48 hours
            </p>
          </div>

          {/* Ghotok enquiries */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "28px 24px",
            }}
          >
            <p className="section-kicker" style={{ color: "var(--gold)" }}>
              Ghotok &amp; matchmakers
            </p>
            <h3 style={{ margin: "6px 0 12px" }}>Join as a professional matchmaker.</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 16px" }}>
              Are you a Ghotok or professional matchmaker? Apply to join Borbodhu and help
              families find their perfect match.
            </p>
            <a
              href="mailto:ghotok@borbodhu.com"
              className="button button-soft"
              style={{ display: "inline-flex" }}
            >
              ghotok@borbodhu.com
            </a>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "10px 0 0" }}>
              Response time: within 48 hours
            </p>
          </div>
        </div>
      </section>

      {/* FAQ quick links */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Quick answers</p>
            <h2>Common questions.</h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
            marginTop: 24,
          }}
        >
          {[
            {
              q: "How do I reset my password?",
              a: "Go to the login page and click 'Reset password'. We'll email you a secure link valid for 1 hour.",
            },
            {
              q: "How long does profile approval take?",
              a: "Profiles are reviewed by our admin team within 24 hours of registration.",
            },
            {
              q: "How do I report an inappropriate profile?",
              a: "Use the 'Report' button on any profile page, or email support@borbodhu.com with the profile ID.",
            },
            {
              q: "Is my personal information safe?",
              a: "Yes. Contact details are never shown publicly. Read our Privacy Policy for full details.",
            },
            {
              q: "How do I cancel my membership?",
              a: "Memberships are one-time payments with no auto-renewal. Your plan simply expires at the end of the term.",
            },
            {
              q: "Can I delete my account?",
              a: "Yes. Email support@borbodhu.com with your registered email and we will delete your account within 7 days.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: "18px",
              }}
            >
              <p style={{ fontWeight: 700, margin: "0 0 6px", fontSize: "0.9rem" }}>{q}</p>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.83rem", lineHeight: 1.6 }}>
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Office info */}
      <section className="section-block">
        <div
          style={{
            background: "rgba(47, 111, 114, 0.05)",
            border: "1px solid rgba(47, 111, 114, 0.15)",
            borderRadius: 20,
            padding: "28px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          <div>
            <p className="section-kicker">Registered in</p>
            <p style={{ fontWeight: 600, margin: "4px 0 0" }}>Bangladesh</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "2px 0 0" }}>
              Serving the global Bangladeshi community
            </p>
          </div>
          <div>
            <p className="section-kicker">Primary email</p>
            <p style={{ fontWeight: 600, margin: "4px 0 0" }}>
              <a href="mailto:support@borbodhu.com" style={{ color: "var(--rose)" }}>
                support@borbodhu.com
              </a>
            </p>
          </div>
          <div>
            <p className="section-kicker">Phone</p>
            <p style={{ fontWeight: 600, margin: "4px 0 0" }}>
              <a href="tel:+8801912131377" style={{ color: "var(--rose)" }}>01912-131377</a>
            </p>
            <p style={{ fontWeight: 600, margin: "2px 0 0" }}>
              <a href="tel:+8801716208791" style={{ color: "var(--rose)" }}>01716-208791</a>
            </p>
          </div>
          <div>
            <p className="section-kicker">Support hours</p>
            <p style={{ fontWeight: 600, margin: "4px 0 0" }}>Sun – Thu, 10 AM – 7 PM BST</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "2px 0 0" }}>
              Responses within 24 hours at all times
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
