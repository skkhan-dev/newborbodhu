import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | borbodhu.com",
  description: "Terms and conditions for using the Borbodhu matrimony platform.",
};

const EFFECTIVE_DATE = "1 January 2025";

export default function TermsPage() {
  return (
    <main className="page-shell">
      <section className="hero-card public-home-hero" style={{ marginBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <p className="section-kicker">সেবার শর্তাবলী · Terms of Service</p>
          <h1>Terms of using borbodhu.com.</h1>
          <p className="hero-copy">
            Effective date: {EFFECTIVE_DATE}. By creating an account on borbodhu.com, you agree
            to the following terms. Please read them carefully.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div style={{ maxWidth: 760, display: "grid", gap: 32 }}>
          {[
            {
              title: "1. Eligibility",
              body: [
                "You must be at least 18 years old to register on Borbodhu.",
                "You must be unmarried, divorced, or widowed. Borbodhu is a matrimony platform.",
                "Borbodhu is open to Bangladeshi nationals and members of the global Bangladeshi diaspora.",
                "You must provide accurate information. Providing false information is grounds for immediate account termination.",
              ],
            },
            {
              title: "2. Account responsibilities",
              body: [
                "You are responsible for maintaining the security of your password.",
                "You may not share your account with another person.",
                "You may only create one member account. Duplicate accounts will be removed.",
                "You must notify us immediately if you suspect unauthorized access to your account.",
              ],
            },
            {
              title: "3. Profile guidelines",
              body: [
                "All profile information must be truthful and accurate.",
                "Profile photos must be genuine photos of yourself. No group photos, cartoons, or impersonation.",
                "Do not include contact information (phone, email, WhatsApp) in public-facing profile fields.",
                "Profiles promoting commercial services (other than through the Vendor programme) are not permitted.",
                "Profiles will be reviewed by our admin team and may be rejected if they do not meet our standards.",
              ],
            },
            {
              title: "4. Prohibited conduct",
              body: [
                "Harassment, threatening, or abusive behaviour toward other members.",
                "Scamming, phishing, or attempting to defraud other members.",
                "Impersonating another person or creating a false identity.",
                "Collecting or harvesting member data for any commercial purpose.",
                "Posting obscene, offensive, or illegal content.",
                "Using automated bots or scrapers on the platform.",
              ],
            },
            {
              title: "5. Membership payments",
              body: [
                "Membership fees are one-time payments for the selected duration. There is no automatic renewal.",
                "Payments are processed through third-party gateways (bKash, PayPal, SSLCommerz). Borbodhu does not store payment credentials.",
                "Refunds are not provided once a membership is activated, except in cases of duplicate payment or platform error.",
                "Contact support@borbodhu.com for payment disputes.",
              ],
            },
            {
              title: "6. Content and intellectual property",
              body: [
                "You retain ownership of the content you upload (photos, profile text).",
                "By uploading content, you grant Borbodhu a non-exclusive licence to display it on the platform.",
                "Borbodhu's brand, design, and code are proprietary and may not be copied or reproduced.",
              ],
            },
            {
              title: "7. Account suspension and termination",
              body: [
                "We reserve the right to suspend or terminate accounts that violate these terms.",
                "We will notify you by email before suspension where reasonably possible.",
                "You may delete your account at any time by emailing support@borbodhu.com.",
                "Upon termination, your profile and personal data are deleted within 7 working days.",
              ],
            },
            {
              title: "8. Limitation of liability",
              body: [
                "Borbodhu facilitates connections between members but does not guarantee any specific outcome.",
                "We are not responsible for the accuracy of information provided by members.",
                "We are not liable for any personal, financial, or emotional harm arising from connections made through the platform.",
                "Our total liability to you is limited to the amount you paid for your current membership.",
              ],
            },
            {
              title: "9. Changes to these terms",
              body: [
                "We may update these terms from time to time. We will notify active members by email of material changes.",
                "Continued use of the platform after notification constitutes acceptance of the updated terms.",
              ],
            },
            {
              title: "10. Contact",
              body: [
                "For questions about these terms, email: support@borbodhu.com",
                "Response time: within 48 hours.",
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
