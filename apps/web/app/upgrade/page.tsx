import Link from "next/link";
import type { Metadata } from "next";

import { getApiBaseUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: "Membership Plans | borbodhu.com – Bangladeshi Matrimony",
  description:
    "Upgrade your Borbodhu membership to connect, message, and view contact details of verified Bangladeshi matrimony profiles. Online and Assisted Matrimony plans available.",
};

type MembershipPlan = {
  id: string;
  code: string;
  category?: string;
  nameEn: string;
  nameBn: string | null;
  durationDays: number;
  bdtPrice: number;
  usdPrice: number;
  contactLimit: number | null;
  messageEnabled: boolean;
  contactViewEnabled: boolean;
  highlightEnabled: boolean;
  supportTier: string | null;
};

const FALLBACK_PLANS: MembershipPlan[] = [
  {
    id: "bronze", code: "BRONZE", category: "ONLINE",
    nameEn: "Bronze", nameBn: "ব্রোঞ্জ", durationDays: 15,
    bdtPrice: 800, usdPrice: 10, contactLimit: 10,
    messageEnabled: true, contactViewEnabled: true,
    highlightEnabled: false, supportTier: "standard",
  },
  {
    id: "silver", code: "SILVER", category: "ONLINE",
    nameEn: "Silver", nameBn: "সিলভার", durationDays: 30,
    bdtPrice: 1800, usdPrice: 25, contactLimit: 20,
    messageEnabled: true, contactViewEnabled: true,
    highlightEnabled: false, supportTier: "standard",
  },
  {
    id: "gold", code: "GOLD", category: "ONLINE",
    nameEn: "Gold", nameBn: "গোল্ড", durationDays: 60,
    bdtPrice: 3200, usdPrice: 45, contactLimit: 50,
    messageEnabled: true, contactViewEnabled: true,
    highlightEnabled: true, supportTier: "priority",
  },
  {
    id: "platinum", code: "PLATINUM", category: "ONLINE",
    nameEn: "Platinum", nameBn: "প্লাটিনাম", durationDays: 90,
    bdtPrice: 5200, usdPrice: 70, contactLimit: 100,
    messageEnabled: true, contactViewEnabled: true,
    highlightEnabled: true, supportTier: "priority",
  },
  {
    id: "assisted-standard", code: "ASSISTED_STANDARD", category: "ASSISTED",
    nameEn: "Assisted Standard", nameBn: "এসিস্টেড স্ট্যান্ডার্ড", durationDays: 180,
    bdtPrice: 15000, usdPrice: 180, contactLimit: 0,
    messageEnabled: false, contactViewEnabled: false,
    highlightEnabled: true, supportTier: "dedicated",
  },
  {
    id: "assisted-premium", code: "ASSISTED_PREMIUM", category: "ASSISTED",
    nameEn: "Assisted Premium", nameBn: "এসিস্টেড প্রিমিয়াম", durationDays: 365,
    bdtPrice: 25000, usdPrice: 300, contactLimit: 0,
    messageEnabled: false, contactViewEnabled: false,
    highlightEnabled: true, supportTier: "dedicated",
  },
];

async function getPlans(): Promise<MembershipPlan[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/billing/plans`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK_PLANS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

/* ── Helpers ── */

function planColor(code: string) {
  if (code === "BRONZE") return "#cd7f32";
  if (code === "GOLD") return "var(--gold)";
  if (code === "PLATINUM") return "#7a78b0";
  if (code.startsWith("ASSISTED")) return "#2e7d6f";
  return "#888";
}

function PlanBadge({ code }: { code: string }) {
  const bg =
    code === "GOLD"
      ? "linear-gradient(135deg, #b8860b, #f0c040)"
      : code === "PLATINUM"
        ? "linear-gradient(135deg, #4a4a6a, #8888bb)"
        : code === "BRONZE"
          ? "linear-gradient(135deg, #cd7f32, #e8a85c)"
          : code.startsWith("ASSISTED")
            ? "linear-gradient(135deg, #2e7d6f, #4db8a4)"
            : "linear-gradient(135deg, #888, #bbb)";
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {code.replace("ASSISTED_", "")}
    </span>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0" }}>
      <span style={{ color: "var(--leaf)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>&#10003;</span>
      <span style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{children}</span>
    </li>
  );
}

function CrossItem({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0" }}>
      <span style={{ color: "var(--line)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>&#10007;</span>
      <span style={{ color: "var(--line)", fontSize: "0.88rem", lineHeight: 1.5 }}>{children}</span>
    </li>
  );
}

/* ── Page ── */

export default async function UpgradePage() {
  const allPlans = await getPlans();
  const onlinePlans = allPlans.filter((p) => (p.category ?? "ONLINE") === "ONLINE");
  const assistedPlans = allPlans.filter((p) => p.category === "ASSISTED");

  return (
    <main className="page-shell">
      {/* Hero */}
      <section className="hero-card public-home-hero" style={{ marginBottom: 0 }}>
        <div style={{ maxWidth: 680 }}>
          <p className="section-kicker">মেম্বারশিপ · Membership Plans</p>
          <h1>Two ways to find your life partner with Borbodhu.</h1>
          <p className="hero-copy">
            Search on your own with an <strong>Online Membership</strong>, or let our professional
            matchmakers do the work for you with <strong>Assisted Matrimony</strong>. Both options
            are one-time payments with no auto-renewal.
          </p>
          <div className="tag-list" style={{ marginTop: 16 }}>
            <span className="tag tag-light">Free to register</span>
            <span className="tag tag-light">No auto-renewal</span>
            <span className="tag tag-light">BDT &amp; USD accepted</span>
          </div>
        </div>
      </section>

      {/* ── Tab-like navigation ── */}
      <section className="section-block" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="#online"
            className="button button-soft"
            style={{ borderRadius: 24, fontSize: "0.9rem", padding: "8px 22px" }}
          >
            Online Membership
          </a>
          <a
            href="#assisted"
            className="button button-soft"
            style={{ borderRadius: 24, fontSize: "0.9rem", padding: "8px 22px" }}
          >
            Assisted Matrimony
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 1: Online Membership
          ═══════════════════════════════════════════════ */}
      <section id="online" className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Online Membership</p>
            <h2>Browse, connect and message — on your own terms.</h2>
          </div>
          <p style={{ maxWidth: 380 }}>
            Log in, search profiles, view contact details, and message matches directly.
            Your membership stays active for the plan duration.
          </p>
        </div>

        {/* How it works */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { step: "1", title: "Join Free", desc: "Create your profile and browse all public profiles at no cost." },
            { step: "2", title: "Choose a Plan", desc: "Pick Bronze, Silver, Gold, or Platinum based on your needs." },
            { step: "3", title: "Pay Once", desc: "Pay via bKash, PayPal, or at our office. No recurring charges." },
            { step: "4", title: "Start Connecting", desc: "View contacts, send messages, and find your match within the plan period." },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--deep)", color: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.9rem", marginBottom: 10,
                }}
              >
                {step}
              </div>
              <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "0.92rem" }}>{title}</p>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.82rem", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Plan cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {onlinePlans.map((plan) => {
            const isPopular = plan.code === "GOLD";
            return (
              <article
                key={plan.id}
                style={{
                  background: "var(--card)",
                  border: isPopular
                    ? `2px solid ${planColor(plan.code)}`
                    : "1px solid var(--line)",
                  borderRadius: 20,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  position: "relative",
                }}
              >
                {isPopular && (
                  <div
                    style={{
                      position: "absolute", top: -12, left: "50%",
                      transform: "translateX(-50%)",
                      background: planColor(plan.code), color: "#fff",
                      fontSize: "0.72rem", fontWeight: 700,
                      padding: "3px 14px", borderRadius: 20,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{plan.nameEn}</h3>
                  <PlanBadge code={plan.code} />
                </div>

                {/* Price */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: planColor(plan.code) }}>
                      &#2547;{Number(plan.bdtPrice).toLocaleString("en-BD")}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>BDT</span>
                  </div>
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>
                    ~${Number(plan.usdPrice)} USD &middot; {plan.durationDays} days
                  </p>
                </div>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                  <CheckItem>
                    {plan.contactLimit == null || plan.contactLimit === 0
                      ? "Unlimited contact views"
                      : `${plan.contactLimit} contact views`}
                  </CheckItem>
                  <CheckItem>Direct messaging</CheckItem>
                  <CheckItem>{plan.durationDays}-day access period</CheckItem>
                  {plan.highlightEnabled ? (
                    <CheckItem>Highlighted listing — appear first</CheckItem>
                  ) : (
                    <CrossItem>Highlighted listing</CrossItem>
                  )}
                  <CheckItem>
                    {plan.supportTier === "dedicated"
                      ? "Dedicated support line"
                      : plan.supportTier === "priority"
                        ? "Priority support"
                        : "Standard email support"}
                  </CheckItem>
                  <CheckItem>Save searches &amp; shortlists</CheckItem>
                </ul>

                <Link
                  href="/login?redirect=/dashboard"
                  className="button button-primary"
                  style={{
                    justifyContent: "center",
                    background: isPopular ? planColor(plan.code) : undefined,
                    borderColor: isPopular ? planColor(plan.code) : undefined,
                  }}
                >
                  Get {plan.nameEn}
                </Link>
              </article>
            );
          })}
        </div>

        {/* What you get / lose summary */}
        <div
          style={{
            marginTop: 28,
            background: "rgba(138,57,71,0.04)",
            border: "1px solid rgba(138,57,71,0.10)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: "0.92rem" }}>
            What happens when your Online Membership expires?
          </p>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
            Your profile stays active and visible in search results. You can still browse profiles and
            receive interests. However, you lose the ability to view contact details and send messages
            until you renew. Contact views already used do not reset — they are tied to the membership period.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2: Assisted Matrimony
          ═══════════════════════════════════════════════ */}
      <section id="assisted" className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker" style={{ color: "#2e7d6f" }}>Assisted Matrimony</p>
            <h2>Let a professional matchmaker find your match.</h2>
          </div>
          <p style={{ maxWidth: 380 }}>
            Too busy to search yourself? Our dedicated matchmakers (Ghotok) work on your behalf
            to find compatible profiles and coordinate introductions.
          </p>
        </div>

        {/* How Assisted works */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { step: "1", title: "Sign Up", desc: "Create your profile on borbodhu.com or visit our office." },
            { step: "2", title: "Choose Assisted Plan", desc: "Pay online or at our office for Assisted Standard or Premium." },
            { step: "3", title: "Get Assigned", desc: "A dedicated matchmaker (Ghotok) is assigned to your profile." },
            { step: "4", title: "We Search For You", desc: "Your Ghotok searches, shortlists, and contacts matches on your behalf." },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              style={{
                background: "var(--card)",
                border: "1px solid rgba(46,125,111,0.2)",
                borderRadius: 16,
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#2e7d6f", color: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.9rem", marginBottom: 10,
                }}
              >
                {step}
              </div>
              <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "0.92rem" }}>{title}</p>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.82rem", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Assisted plan cards */}
        {assistedPlans.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {assistedPlans.map((plan) => (
              <article
                key={plan.id}
                style={{
                  background: "var(--card)",
                  border: "2px solid rgba(46,125,111,0.3)",
                  borderRadius: 20,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{plan.nameEn}</h3>
                  <PlanBadge code={plan.code} />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: "#2e7d6f" }}>
                      &#2547;{Number(plan.bdtPrice).toLocaleString("en-BD")}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>BDT</span>
                  </div>
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>
                    ~${Number(plan.usdPrice)} USD &middot; {plan.durationDays} days
                  </p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                  <CheckItem>Dedicated matchmaker (Ghotok) assigned</CheckItem>
                  <CheckItem>Matchmaker searches on your behalf</CheckItem>
                  <CheckItem>Matchmaker contacts families for you</CheckItem>
                  <CheckItem>Highlighted profile in search results</CheckItem>
                  <CheckItem>Dedicated support line</CheckItem>
                  <CheckItem>{plan.durationDays}-day service period</CheckItem>
                  <CheckItem>Pay online or at Borbodhu office</CheckItem>
                </ul>

                <Link
                  href="/login?redirect=/dashboard"
                  className="button button-primary"
                  style={{
                    justifyContent: "center",
                    background: "#2e7d6f",
                    borderColor: "#2e7d6f",
                  }}
                >
                  Get {plan.nameEn}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          /* Static assisted section if no plans from API yet */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            <article
              style={{
                background: "var(--card)",
                border: "2px solid rgba(46,125,111,0.3)",
                borderRadius: 20,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Assisted Standard</h3>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 700, color: "#2e7d6f" }}>&#2547;15,000</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>BDT</span>
                </div>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>~$180 USD &middot; 180 days</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                <CheckItem>Dedicated matchmaker assigned</CheckItem>
                <CheckItem>Matchmaker searches on your behalf</CheckItem>
                <CheckItem>Highlighted profile</CheckItem>
                <CheckItem>6-month service period</CheckItem>
              </ul>
              <Link href="/login?redirect=/dashboard" className="button button-primary" style={{ justifyContent: "center", background: "#2e7d6f", borderColor: "#2e7d6f" }}>
                Get Assisted Standard
              </Link>
            </article>
            <article
              style={{
                background: "var(--card)",
                border: "2px solid rgba(46,125,111,0.3)",
                borderRadius: 20,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Assisted Premium</h3>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 700, color: "#2e7d6f" }}>&#2547;25,000</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>BDT</span>
                </div>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>~$300 USD &middot; 365 days</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                <CheckItem>Dedicated matchmaker assigned</CheckItem>
                <CheckItem>Matchmaker searches on your behalf</CheckItem>
                <CheckItem>Highlighted profile</CheckItem>
                <CheckItem>1-year service period</CheckItem>
                <CheckItem>Priority matching</CheckItem>
              </ul>
              <Link href="/login?redirect=/dashboard" className="button button-primary" style={{ justifyContent: "center", background: "#2e7d6f", borderColor: "#2e7d6f" }}>
                Get Assisted Premium
              </Link>
            </article>
          </div>
        )}

        {/* Assisted info box */}
        <div
          style={{
            marginTop: 28,
            background: "rgba(46,125,111,0.06)",
            border: "1px solid rgba(46,125,111,0.15)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: "0.92rem" }}>
            How does Assisted Matrimony differ from Online?
          </p>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.85rem", lineHeight: 1.7 }}>
            With Assisted Matrimony, you do not need to log in regularly or search yourself. A professional
            matchmaker (Ghotok) is assigned to your profile. They browse all profiles, shortlist compatible
            matches, and contact families on your behalf — just like a traditional matchmaker but with the
            reach of 179,000+ profiles on Borbodhu. You can sign up online or visit our office in person.
            The Ghotok will keep you updated via phone or email throughout the process.
          </p>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Comparison</p>
            <h2>Online vs Assisted — which is right for you?</h2>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.88rem",
              minWidth: 520,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--muted)", fontWeight: 600 }}>Feature</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 700 }}>Online Membership</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 700, color: "#2e7d6f" }}>Assisted Matrimony</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["You search profiles yourself", "Yes", "Not needed"],
                ["Dedicated matchmaker assigned", "No", "Yes"],
                ["View contact details", "Yes (limited by plan)", "Matchmaker handles"],
                ["Send messages directly", "Yes", "Matchmaker handles"],
                ["Highlighted profile", "Gold & Platinum only", "All plans"],
                ["Pay online", "Yes", "Yes"],
                ["Pay at office", "Yes", "Yes"],
                ["Starting price (BDT)", "&#2547;800", "&#2547;15,000"],
                ["Best for", "Active users who prefer self-search", "Busy professionals & families"],
              ].map(([feature, online, assisted], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>{feature}</td>
                  <td
                    style={{ padding: "10px 16px", textAlign: "center", color: "var(--muted)" }}
                    dangerouslySetInnerHTML={{ __html: online }}
                  />
                  <td
                    style={{ padding: "10px 16px", textAlign: "center", color: "#2e7d6f", fontWeight: 500 }}
                    dangerouslySetInnerHTML={{ __html: assisted }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Free tier reminder ── */}
      <section className="section-block">
        <div
          style={{
            background: "rgba(138, 57, 71, 0.05)",
            border: "1px solid rgba(138, 57, 71, 0.12)",
            borderRadius: 20,
            padding: "28px 24px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <p className="section-kicker">Free forever</p>
            <h3 style={{ margin: "4px 0 8px" }}>Everything starts free.</h3>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.88rem", lineHeight: 1.6 }}>
              Create a profile, browse all public profiles, send interests, and let families discover
              you — all without paying anything. Upgrade only when you want to send messages or view
              contact details.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <Link href="/signup" className="button button-primary" style={{ justifyContent: "center" }}>
              Join Free
            </Link>
            <Link href="/profiles" className="button button-soft" style={{ justifyContent: "center" }}>
              Browse profiles
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">FAQ</p>
            <h2>Common questions about membership.</h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {[
            {
              q: "Is payment a one-time charge?",
              a: "Yes. Borbodhu does not auto-renew. You pay once for the selected duration and there are no hidden charges.",
            },
            {
              q: "Which payment methods are accepted?",
              a: "bKash and Nagad for BDT payments. PayPal and international cards for USD. You can also pay in person at our office.",
            },
            {
              q: "What happens after my Online plan expires?",
              a: "Your profile stays live and you can still browse. You lose access to contact view and messaging until you renew.",
            },
            {
              q: "How does Assisted Matrimony work?",
              a: "After you sign up, a dedicated matchmaker (Ghotok) is assigned to you. They search profiles, shortlist matches, and contact families on your behalf.",
            },
            {
              q: "Can I switch from Online to Assisted?",
              a: "Yes. You can upgrade to Assisted Matrimony at any time. Contact our support team or visit our office.",
            },
            {
              q: "Do I need a paid plan to be found?",
              a: "No. Free members appear in search results and can receive interests. A paid plan increases visibility with highlighted listing.",
            },
            {
              q: "Can I pay at the Borbodhu office?",
              a: "Yes. Both Online and Assisted memberships can be purchased at our office. Choose 'Office Payment' during checkout.",
            },
            {
              q: "Is my payment information stored?",
              a: "No. We use payment gateways (bKash, PayPal, SSLCommerz) and do not store card numbers or mobile banking PINs.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "20px",
              }}
            >
              <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: "0.92rem" }}>{q}</p>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="section-block">
        <div
          style={{
            background: "var(--deep)",
            borderRadius: 20,
            padding: "40px 32px",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <p className="section-kicker" style={{ color: "var(--gold)" }}>
            Ready to find your match?
          </p>
          <h2 style={{ color: "#fff", margin: "8px 0 16px" }}>
            Join thousands of Bangladeshi families on Borbodhu.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 24px", maxWidth: 520, marginInline: "auto" }}>
            Start for free, or let our matchmakers do the searching for you.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="button button-gold" style={{ justifyContent: "center" }}>
              Join Free
            </Link>
            <Link href="/profiles" className="button button-soft" style={{ justifyContent: "center" }}>
              Browse profiles first
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ structured data for rich search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Is payment a one-time charge?", acceptedAnswer: { "@type": "Answer", text: "Yes. Borbodhu does not auto-renew. You pay once for the selected duration and there are no hidden charges." } },
              { "@type": "Question", name: "Which payment methods are accepted?", acceptedAnswer: { "@type": "Answer", text: "bKash and Nagad for BDT payments. PayPal and international cards for USD. You can also pay in person at our office." } },
              { "@type": "Question", name: "What happens after my Online plan expires?", acceptedAnswer: { "@type": "Answer", text: "Your profile stays live and you can still browse. You lose access to contact view and messaging until you renew." } },
              { "@type": "Question", name: "How does Assisted Matrimony work?", acceptedAnswer: { "@type": "Answer", text: "After you sign up, a dedicated matchmaker (Ghotok) is assigned to you. They search profiles, shortlist matches, and contact families on your behalf." } },
              { "@type": "Question", name: "Do I need a paid plan to be found?", acceptedAnswer: { "@type": "Answer", text: "No. Free members appear in search results and can receive interests. A paid plan increases visibility with highlighted listing." } },
              { "@type": "Question", name: "Is my payment information stored?", acceptedAnswer: { "@type": "Answer", text: "No. We use payment gateways (bKash, PayPal, SSLCommerz) and do not store card numbers or mobile banking PINs." } },
            ],
          }),
        }}
      />
    </main>
  );
}
