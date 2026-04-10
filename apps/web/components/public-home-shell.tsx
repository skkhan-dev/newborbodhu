import Link from "next/link";

import { PublicProfileCard } from "@/components/public-profile-card";
import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import { PublicSearchForm } from "@/components/public-search-form";
import { getPublicCommercialConfig } from "@/lib/commercial";
import { localizePath, type PublicLocale } from "@/lib/locale";
import {
  getPublicProfiles,
  normalizePublicProfileSearchParams,
} from "@/lib/public-profile-search";
import {
  localeText,
} from "@/lib/public-page-locale";

type PublicHomeShellProps = {
  locale: PublicLocale | null;
};

const emptyProfiles = { total: 0, page: 1, pageSize: 6, results: [] };

export async function PublicHomeShell({ locale }: PublicHomeShellProps) {
  const defaultSearch = normalizePublicProfileSearchParams({});

  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch(() => fallback);

  const [publicConfig, totalCount, recentWomen, recentMen, newProfiles, activeProfiles] = await Promise.all([
    safe(getPublicCommercialConfig(), null),
    safe(getPublicProfiles({} as any, 1), emptyProfiles),
    safe(getPublicProfiles({ ...defaultSearch, gender: "WOMAN" as any, hasPhoto: true } as any, 4), emptyProfiles),
    safe(getPublicProfiles({ ...defaultSearch, gender: "MAN" as any, hasPhoto: true } as any, 2), emptyProfiles),
    safe(getPublicProfiles({ ...defaultSearch, sortBy: "new_signups", hasPhoto: true } as any, 6), emptyProfiles),
    safe(getPublicProfiles({ ...defaultSearch, sortBy: "most_active", hasPhoto: true } as any, 6), emptyProfiles),
  ]);
  // Interleave genders for diversity (women first, then men)
  const recentProfiles = {
    ...recentWomen,
    total: totalCount.total,
    results: [...recentWomen.results.slice(0, 4), ...recentMen.results.slice(0, 2)],
  };

  const journeySteps = [
    {
      step: "01",
      title: localeText(locale, "Create your free profile", "ফ্রি প্রোফাইল তৈরি করুন"),
      body: localeText(locale, "Register in minutes. Our team reviews and activates within 24 hours.", "কয়েক মিনিটে রেজিস্ট্রেশন। আমাদের টিম ২৪ ঘণ্টার মধ্যে রিভিউ করে একটিভ করে।"),
    },
    {
      step: "02",
      title: localeText(locale, "Search and discover matches", "সার্চ করুন ও ম্যাচ খুঁজুন"),
      body: localeText(locale, "Filter by age, religion, location, education and more.", "বয়স, ধর্ম, লোকেশন, শিক্ষা ও আরও অনেক ফিল্টার দিয়ে সার্চ করুন।"),
    },
    {
      step: "03",
      title: localeText(locale, "Express interest and connect", "আগ্রহ প্রকাশ করুন ও যোগাযোগ করুন"),
      body: localeText(locale, "Send interest for free. Upgrade to message and view contact details.", "ফ্রিতে আগ্রহ পাঠান। আপগ্রেড করে মেসেজ ও কনট্যাক্ট দেখুন।"),
    },
    {
      step: "04",
      title: localeText(locale, "Plan your wedding", "বিয়ের পরিকল্পনা করুন"),
      body: localeText(locale, "Wedding planner, guest list, and curated vendor directory built in.", "বিল্ট-ইন ওয়েডিং প্ল্যানার, গেস্ট লিস্ট ও ভেন্ডর ডিরেক্টরি।"),
    },
  ];

  return (
    <main className="page-shell">
      <section className="hero-card public-home-hero">
        <div className="public-home-hero-grid">
          <div className="public-home-copy">
            <div className="eyebrow">
              <span>{localeText(locale, "Trusted since 2009", "২০০৯ থেকে বিশ্বস্ত")}</span>
              <span>{localeText(locale, "Family-first Bangladeshi matrimony", "মেম্বার, ঘটক, ওয়েডিং, ভেন্ডর")}</span>
            </div>
            <h1>
              {localeText(
                locale,
                "The matrimony platform Bangladeshi families actually trust.",
                "আরও আধুনিক ও পরিবার-উপযোগী অভিজ্ঞতায় যাচাইকৃত বাংলাদেশি বিয়ের প্রোফাইল খুঁজুন।",
              )}
            </h1>
            <p className="hero-copy">
              {localeText(
                locale,
                "Borbodhu connects Bangladeshi families across Bangladesh and the world. Every profile is admin-verified, photos stay private until you choose to share, and professional Ghotok matchmakers are built right in.",
                "নতুন বরবধূর ফ্রন্ট ডোরটি সেই জিনিসগুলোকেই সামনে আনে যেগুলোর ওপর পুরোনো সাইট দাঁড়িয়ে ছিল: দ্রুত সার্চ, বিশ্বস্ত প্রোফাইল, গোপনীয়তা, পরিবার-ভিত্তিক অংশগ্রহণ, এবং ম্যাচ খোঁজা থেকে বিয়ের পরিকল্পনা পর্যন্ত পরিষ্কার পথ।",
              )}
            </p>

            <div className="tag-list">
              <span className="tag tag-light">
                {totalCount.total.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}{" "}
                {localeText(locale, "verified profiles", "যাচাইকৃত প্রোফাইল")}
              </span>
              <span className="tag tag-light">{localeText(locale, "100% admin-reviewed", "১০০% অ্যাডমিন-রিভিউড")}</span>
              <span className="tag tag-light">{localeText(locale, "Bangladesh + 40 countries", "বাংলাদেশ ও প্রবাস")}</span>
            </div>

            <div className="inline-actions public-home-actions">
              <Link href={localizePath("/login", locale)} className="button button-primary">
                {localeText(locale, "Member login", "মেম্বার লগ ইন")}
              </Link>
              <Link href={localizePath("/signup", locale)} className="button button-soft">
                {localeText(locale, "Join Free", "ফ্রি রেজিস্টার করুন")}
              </Link>
            </div>
          </div>

          <aside className="dashboard-panel public-search-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">{localeText(locale, "Quick Search", "কুইক সার্চ")}</p>
              </div>
            </div>

            <PublicSearchForm
              defaults={{ memberGender: "MAN", gender: "WOMAN", ageMin: "18", ageMax: "28", religion: "Muslim", currentCountryCode: "BD", sortBy: "most_active" }}
              basePath={localizePath("/profiles", locale)}
            />
          </aside>
        </div>
      </section>

      {publicConfig && <PublicSponsorSlot config={publicConfig} placement="home" locale={locale ?? undefined} />}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "How it works", "কিভাবে কাজ করে")}</p>
            <h2>{localeText(locale, "From profile to proposal — a simple, family-safe path.", "সার্চ দিয়ে শুরু করুন, তারপর নিরাপদে যোগাযোগ ও পরিকল্পনার দিকে যান।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "Every step is designed for Bangladeshi families — culturally appropriate, private, and clear from start to wedding.",
              "এই অভিজ্ঞতাটি এমনভাবে পুনর্গঠন করা হচ্ছে যাতে বরবধূর সাংস্কৃতিক কাঠামো অক্ষুণ্ণ থাকে, কিন্তু পুরোনো সাইটের জটিলতা, অকার্যকর অংশ, এবং লেগাসি বাধা দূর হয়।",
            )}
          </p>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
          {journeySteps.map((step) => (
            <div key={step.step} className="journey-step">
              <div className="journey-step-number">{step.step}</div>
              <div>
                <strong style={{ display: "block", marginBottom: 4 }}>{step.title}</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Why families choose Borbodhu */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Why Borbodhu", "কেন বরবধূ")}</p>
            <h2>{localeText(locale, "What makes Borbodhu different.", "বরবধূ কেন আলাদা।")}</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 20 }}>
          <div className="info-card" style={{ borderLeft: "3px solid var(--rose)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{localeText(locale, "Every profile is admin-reviewed", "প্রতিটি প্রোফাইল অ্যাডমিন-রিভিউড")}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{localeText(locale, "No bots, no fakes. Our team manually reviews every profile before it goes live.", "কোনো বট নেই, কোনো ভুয়া নেই। লাইভ হওয়ার আগে আমাদের টিম প্রতিটি প্রোফাইল যাচাই করে।")}</p>
          </div>
          <div className="info-card" style={{ borderLeft: "3px solid var(--gold)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{localeText(locale, "Ghotok matchmakers built in", "প্ল্যাটফর্মে ঘটক ম্যাচমেকার")}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{localeText(locale, "Traditional matchmakers are part of the platform. Families can work with trusted Ghotoks digitally.", "ঐতিহ্যবাহী ঘটকরা প্ল্যাটফর্মের অংশ। পরিবারগুলো বিশ্বস্ত ঘটকদের সাথে ডিজিটালে কাজ করতে পারে।")}</p>
          </div>
          <div className="info-card" style={{ borderLeft: "3px solid var(--teal)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{localeText(locale, "Private by default", "গোপনীয়তা ডিফল্ট")}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{localeText(locale, "Photos and contact details stay hidden until both sides agree. You control who sees what.", "ছবি ও যোগাযোগের তথ্য উভয়পক্ষের সম্মতি ছাড়া দেখা যায় না।")}</p>
          </div>
          <div className="info-card" style={{ borderLeft: "3px solid var(--leaf)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{localeText(locale, "Bangladesh + global diaspora", "বাংলাদেশ + বৈশ্বিক প্রবাসী")}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{localeText(locale, "Members from 40+ countries. Whether your family is in Dhaka, London, or New York.", "৪০+ দেশের সদস্য। আপনার পরিবার যেখানেই থাকুক।")}</p>
          </div>
          <div className="info-card" style={{ borderLeft: "3px solid var(--indigo)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{localeText(locale, "Wedding planning built in", "বিল্ট-ইন বিয়ের পরিকল্পনা")}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{localeText(locale, "Find your match and plan your wedding on the same platform. Guest lists, vendors, and tools included.", "একই প্ল্যাটফর্মে ম্যাচ খুঁজুন ও বিয়ের পরিকল্পনা করুন।")}</p>
          </div>
        </div>
      </section>


      {/* Success Stories */}
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Happy couples", "সুখী দম্পতি")}</p>
            <h2>{localeText(locale, "Real families who found their match on Borbodhu.", "বরবধূতে ম্যাচ খুঁজে পেয়েছেন এমন পরিবার।")}</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 20 }}>
          <article className="info-card" style={{ borderTop: "3px solid var(--rose)" }}>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--ink)", margin: "0 0 12px" }}>
              {localeText(locale,
                "We were looking for someone from a similar background and Borbodhu made it easy. The admin verification gave our family confidence that profiles are genuine.",
                "আমরা একই ব্যাকগ্রাউন্ডের কাউকে খুঁজছিলাম এবং বরবধূ সেটা সহজ করে দিয়েছে। অ্যাডমিন ভেরিফিকেশন আমাদের পরিবারকে আস্থা দিয়েছে।"
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--rose-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>R</div>
              <div>
                <strong style={{ fontSize: "0.85rem" }}>Rahim &amp; Fatima</strong>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{localeText(locale, "Dhaka, Bangladesh", "ঢাকা, বাংলাদেশ")}</p>
              </div>
            </div>
          </article>
          <article className="info-card" style={{ borderTop: "3px solid var(--gold)" }}>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--ink)", margin: "0 0 12px" }}>
              {localeText(locale,
                "Living in London, finding a Bangladeshi match was difficult until we found Borbodhu. The diaspora focus and private photo controls made all the difference for our family.",
                "লন্ডনে থেকে বাংলাদেশি ম্যাচ খোঁজা কঠিন ছিল। বরবধূর প্রবাসী ফোকাস এবং প্রাইভেট ফটো কন্ট্রোল আমাদের পরিবারের জন্য সব পার্থক্য করেছে।"
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>K</div>
              <div>
                <strong style={{ fontSize: "0.85rem" }}>Karim &amp; Nusrat</strong>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{localeText(locale, "London, UK", "লন্ডন, যুক্তরাজ্য")}</p>
              </div>
            </div>
          </article>
          <article className="info-card" style={{ borderTop: "3px solid var(--teal)" }}>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--ink)", margin: "0 0 12px" }}>
              {localeText(locale,
                "Our Ghotok on Borbodhu helped connect two families who would never have met otherwise. The platform combines tradition with modern tools perfectly.",
                "বরবধূর ঘটক দুই পরিবারকে যুক্ত করতে সাহায্য করেছেন যারা অন্যথায় কখনো দেখা করতেন না। প্ল্যাটফর্মটি ঐতিহ্য ও আধুনিক টুলসকে নিখুঁতভাবে একত্র করেছে।"
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--teal-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--teal)" }}>A</div>
              <div>
                <strong style={{ fontSize: "0.85rem" }}>Arif &amp; Sabrina</strong>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{localeText(locale, "New York, USA", "নিউ ইয়র্ক, যুক্তরাষ্ট্র")}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Recently active", "সম্প্রতি সক্রিয়")}</p>
            <h2>{localeText(locale, "Browse recently active verified members.", "সম্প্রতি সক্রিয় যাচাইকৃত সদস্যদের ব্রাউজ করুন।")}</h2>
          </div>
          <Link href={localizePath("/profiles", locale)} className="button button-soft">
            {localeText(locale, "Open search", "সার্চ খুলুন")}
          </Link>
        </div>
        <div className="card-grid vendor-card-grid">
          {recentProfiles.results.map((profile) => (
            <PublicProfileCard
              key={profile.id}
              profile={profile}
              locale={locale}
              compact
            />
          ))}
        </div>
      </section>

      <section className="split-layout public-preview-split">
        <article className="feature-panel public-preview-panel">
          <p className="section-kicker">{localeText(locale, "New signups", "নতুন সাইন আপ")}</p>
          <h2>{localeText(locale, "New members who just joined. Be among the first to connect.", "সদ্য যোগ দেওয়া নতুন সদস্য। প্রথমে যোগাযোগ করুন।")}</h2>
          <div className="stack-list">
            {newProfiles.results.slice(0, 3).map((profile) => (
              <PublicProfileCard key={profile.id} profile={profile} locale={locale} compact />
            ))}
          </div>
        </article>

        <article className="feature-panel tone-alt public-preview-panel">
          <p className="section-kicker">{localeText(locale, "Most active", "সবচেয়ে সক্রিয়")}</p>
          <h2>{localeText(locale, "Active members are more likely to respond — connect with confidence.", "যেসব প্রোফাইল প্ল্যাটফর্মে বেশি সক্রিয় তাদের বেশি গুরুত্ব দিন।")}</h2>
          <div className="stack-list">
            {activeProfiles.results.slice(0, 3).map((profile) => (
              <PublicProfileCard key={profile.id} profile={profile} locale={locale} compact />
            ))}
          </div>
        </article>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Who uses Borbodhu", "কারা বরবধূ ব্যবহার করেন")}</p>
            <h2>{localeText(locale, "One platform. Four journeys.", "একটি প্ল্যাটফর্ম। চারটি যাত্রা।")}</h2>
          </div>
        </div>
        <div className="actor-grid">
          <article className="actor-card">
            <span className="actor-badge">{localeText(locale, "Member", "মেম্বার")}</span>
            <h3>{localeText(locale, "Bride or Groom", "বর বা কনে")}</h3>
            <p>{localeText(locale, "Create a verified profile, search for your match, express interest, and plan your wedding.", "যাচাইকৃত প্রোফাইল তৈরি করুন, ম্যাচ খুঁজুন, আগ্রহ প্রকাশ করুন এবং বিয়ের পরিকল্পনা করুন।")}</p>
            <a href={localizePath("/signup", locale)} className="actor-link">{localeText(locale, "Join Free →", "ফ্রি রেজিস্ট্রেশন →")}</a>
          </article>
          <article className="actor-card">
            <span className="actor-badge" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>{localeText(locale, "Ghotok", "ঘটক")}</span>
            <h3>{localeText(locale, "Matchmaker", "ঘটক / মিলনকারী")}</h3>
            <p>{localeText(locale, "Add and manage client profiles, impersonate members to facilitate matches, and track credits.", "ক্লায়েন্ট প্রোফাইল যোগ ও পরিচালনা করুন, ম্যাচ সহজ করতে মেম্বার হিসেবে কাজ করুন।")}</p>
            <a href={localizePath("/ghotok", locale)} className="actor-link">{localeText(locale, "Learn more →", "আরও জানুন →")}</a>
          </article>
          <article className="actor-card">
            <span className="actor-badge" style={{ background: "var(--leaf-soft)", color: "var(--leaf)" }}>{localeText(locale, "Vendor", "ভেন্ডর")}</span>
            <h3>{localeText(locale, "Wedding Business", "বিয়ের ব্যবসা")}</h3>
            <p>{localeText(locale, "List your wedding services, reach engaged couples, and grow your business through the vendor directory.", "আপনার ওয়েডিং সার্ভিস তালিকাভুক্ত করুন এবং নতুন কাপলদের কাছে পৌঁছান।")}</p>
            <a href={localizePath("/vendors", locale)} className="actor-link">{localeText(locale, "List your business →", "আপনার ব্যবসা যোগ করুন →")}</a>
          </article>
          <article className="actor-card">
            <span className="actor-badge" style={{ background: "var(--indigo-soft)", color: "var(--indigo)" }}>{localeText(locale, "Family", "পরিবার")}</span>
            <h3>{localeText(locale, "Guardian or Parent", "অভিভাবক বা মা-বাবা")}</h3>
            <p>{localeText(locale, "Browse profiles, involve family in decision-making, and use the Ghotok network for trusted introductions.", "প্রোফাইল দেখুন, পরিবারকে সিদ্ধান্তে যুক্ত করুন এবং ঘটকদের মাধ্যমে পরিচয় করিয়ে দিন।")}</p>
            <a href={localizePath("/profiles", locale)} className="actor-link">{localeText(locale, "Browse profiles →", "প্রোফাইল দেখুন →")}</a>
          </article>
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <p className="section-kicker" style={{ color: "rgba(242, 251, 244, 0.8)" }}>{localeText(locale, "Ready to begin?", "শুরু করতে প্রস্তুত?")}</p>
          <h2>{localeText(locale, "Your perfect match is waiting on Borbodhu.", "আপনার আদর্শ সঙ্গী বরবধূতে অপেক্ষা করছে।")}</h2>
          <p>{localeText(locale, "Join for free. Get verified. Find your life partner.", "ফ্রিতে যোগ দিন। যাচাই করুন। আপনার জীবনসঙ্গী খুঁজুন।")}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={localizePath("/signup", locale)} className="button button-primary">{localeText(locale, "Join Free", "ফ্রি রেজিস্ট্রেশন")}</a>
          <a href={localizePath("/profiles", locale)} className="button button-secondary">{localeText(locale, "Browse profiles", "প্রোফাইল দেখুন")}</a>
        </div>
      </section>

    </main>
  );
}
