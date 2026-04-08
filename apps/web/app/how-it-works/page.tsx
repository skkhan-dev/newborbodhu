import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | কিভাবে কাজ করে | Borbodhu",
  description:
    "Learn how Borbodhu connects Bangladeshi families for marriage. Create a profile, search matches, express interest, and plan your wedding — all in one platform.",
};

const steps = [
  {
    number: "01",
    icon: "📝",
    title: "Create Your Profile",
    titleBn: "প্রোফাইল তৈরি করুন",
    description:
      "Sign up free and complete your profile with details about yourself, your family, education, and what you're looking for in a life partner. Add photos and set your privacy preferences.",
  },
  {
    number: "02",
    icon: "🔍",
    title: "Search & Discover",
    titleBn: "সার্চ ও আবিষ্কার",
    description:
      "Browse thousands of verified profiles using our smart filters — religion, location, education, profession, age, and more. Our smart suggestions help you find compatible matches faster.",
  },
  {
    number: "03",
    icon: "💕",
    title: "Express Interest",
    titleBn: "আগ্রহ প্রকাশ করুন",
    description:
      "Found someone interesting? Send an interest request. When both sides accept, you can start a private conversation. Family members and Ghotok matchmakers can also help facilitate introductions.",
  },
  {
    number: "04",
    icon: "💬",
    title: "Connect & Communicate",
    titleBn: "যোগাযোগ করুন",
    description:
      "Chat securely through our platform. Share more photos, discuss compatibility, and get to know each other better. Your personal contact details stay private until you decide to share them.",
  },
  {
    number: "05",
    icon: "🎊",
    title: "Plan Your Wedding",
    titleBn: "বিয়ের পরিকল্পনা করুন",
    description:
      "Once you've found your match, use our built-in wedding planning tools. Browse verified wedding vendors, manage guest lists, and coordinate everything from venue to catering — all in one place.",
  },
];

const features = [
  {
    icon: "🔒",
    title: "Privacy First",
    description: "Control who sees your profile and photos. Share contact details only when you're ready.",
  },
  {
    icon: "✅",
    title: "Verified Profiles",
    description: "Admin-reviewed profiles ensure authenticity. Report suspicious accounts instantly.",
  },
  {
    icon: "🤝",
    title: "Ghotok Network",
    description: "Traditional matchmakers (Ghotoks) can assist families in finding suitable matches.",
  },
  {
    icon: "✨",
    title: "Smart Suggestions",
    description: "Our matching engine analyzes your preferences and activity to surface compatible profiles faster.",
  },
  {
    icon: "🌍",
    title: "Bangladesh & Diaspora",
    description: "Connecting families in Bangladesh with Bangladeshis in the US, UK, Canada, Middle East, and beyond.",
  },
  {
    icon: "🗣️",
    title: "Bilingual Platform",
    description: "Full support for both English and Bengali (বাংলা) throughout the entire platform.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="page-shell" style={{ paddingTop: 48, paddingBottom: 64 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
        <p style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 8 }}>
          How It Works
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
          Your journey to finding a life partner, simplified
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.7 }}>
          Borbodhu is designed for Bangladeshi families — whether you're in Dhaka, London, or New York.
          A trusted, modern platform that respects your values and privacy.
        </p>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 720, margin: "0 auto 64px" }}>
        {steps.map((step, i) => (
          <div
            key={step.number}
            style={{
              display: "flex",
              gap: 24,
              marginBottom: i < steps.length - 1 ? 40 : 0,
              position: "relative",
            }}
          >
            {/* Timeline line */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 28,
                  top: 60,
                  bottom: -20,
                  width: 2,
                  background: "var(--line)",
                }}
              />
            )}
            {/* Number circle */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--rose-soft)",
                color: "var(--rose)",
                fontSize: 24,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              {step.icon}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>
                  STEP {step.number}
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 6 }}>
                {step.title}
              </h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "0.92rem", margin: 0 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Features grid */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>
          Why families trust Borbodhu
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto" }}>
          Built specifically for Bangladeshi culture and values
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 56,
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              padding: 24,
              borderRadius: 16,
              border: "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #8b1a30, #5c1020)",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12 }}>
          Ready to start your journey?
        </h2>
        <p style={{ opacity: 0.85, maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
          Join thousands of Bangladeshi families who found their perfect match on Borbodhu. Registration is completely free.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 999,
              background: "white",
              color: "#8b1a30",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Join Free
          </Link>
          <Link
            href="/profiles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.95rem",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Browse Profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
