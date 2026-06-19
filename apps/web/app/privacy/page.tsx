import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | borbodhu.com",
  description: "How Borbodhu collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "1 January 2025";

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="hero-card public-home-hero" style={{ marginBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <p className="section-kicker">গোপনীয়তা নীতি · Privacy Policy</p>
          <h1>Your privacy is a core Borbodhu value.</h1>
          <p className="hero-copy">
            Effective date: {EFFECTIVE_DATE}. This policy explains how we collect, use, and
            protect your personal information when you use borbodhu.com, operated by PropNivo, Inc.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div style={{ maxWidth: 760, display: "grid", gap: 32 }}>
          {[
            {
              title: "1. Information we collect",
              body: [
                "Registration information: name, email address, date of birth, gender, country of residence, and password.",
                "Profile information: religion, education, career, family background, height, marital status, and partner preferences.",
                "Photos: uploaded profile photos (primary and additional). You control whether photos are public or private.",
                "Contact details: phone numbers are stored but never shown publicly without your explicit consent.",
                "Usage data: pages visited, searches performed, profiles viewed — used only to improve the service.",
                "Payment data: order amounts and gateway transaction references. We do not store card numbers or mobile banking PINs.",
              ],
            },
            {
              title: "2. How we use your information",
              body: [
                "To create and maintain your member profile.",
                "To match your profile with relevant search results for other members.",
                "To send transactional emails (account verification, password reset, membership confirmation).",
                "To send match digest emails and platform notifications (you can unsubscribe at any time).",
                "To enforce our community guidelines and review profiles for authenticity.",
                "To process membership payments via third-party payment gateways.",
              ],
            },
            {
              title: "3. Information we never share",
              body: [
                "We never sell your personal information to third parties.",
                "Your contact details (phone, email) are never displayed publicly.",
                "Private photos are never shown to members who have not been granted access.",
                "Your National ID number (if provided for verification) is never visible to other members.",
              ],
            },
            {
              title: "4. Data retention",
              body: [
                "Active member data is retained for as long as your account remains open.",
                "If you request account deletion, your profile and personal data are permanently deleted within 7 working days.",
                "Anonymised analytics data (no personally identifiable information) may be retained for service improvement.",
                "Payment transaction records are retained for 7 years as required by applicable financial regulations.",
              ],
            },
            {
              title: "5. Cookies and tracking",
              body: [
                "We use essential cookies for authentication (keeping you logged in).",
                "We use analytics cookies to understand how users navigate the site. These are anonymised.",
                "We do not use third-party advertising cookies.",
                "You can clear cookies at any time via your browser settings.",
              ],
            },
            {
              title: "6. Security",
              body: [
                "Passwords are hashed using bcrypt and are never stored in plain text.",
                "All data is transmitted over HTTPS/TLS.",
                "Profile photos are stored in Google Cloud Storage with access controls.",
                "We regularly review our security practices and notify users of any data breaches as required by law.",
              ],
            },
            {
              title: "7. Your rights",
              body: [
                "Access: you can request a copy of the personal data we hold about you.",
                "Correction: you can update your profile information at any time from your dashboard.",
                "Deletion: you can request account deletion by emailing support@borbodhu.com.",
                "Opt-out: you can unsubscribe from all non-essential emails via your account settings.",
              ],
            },
            {
              title: "8. Contact",
              body: [
                "For privacy-related requests, email: support@borbodhu.com",
                "Please include your registered email and the nature of your request.",
                "We aim to respond to all privacy requests within 72 hours.",
                "Borbodhu is operated by PropNivo, Inc.",
              ],
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>{title}</h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 8,
                }}
              >
                {body.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      gap: 10,
                      color: "var(--muted)",
                      fontSize: "0.9rem",
                      lineHeight: 1.65,
                    }}
                  >
                    <span style={{ color: "var(--rose)", flexShrink: 0, marginTop: 2 }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
