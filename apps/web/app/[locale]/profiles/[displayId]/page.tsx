import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";
import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import {
  localeText,
  translateGender,
  translateLookingFor,
  translateReligion,
} from "@/lib/public-page-locale";
import { ShareProfileButton } from "@/components/share-profile-button";

type PublicProfileDetail = {
  id: string;
  displayId: string;
  publicName: string;
  age: number | null;
  gender: string;
  lookingFor: string | null;
  religion: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  profession: string | null;
  designation: string | null;
  currentCity: string | null;
  currentCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  homeCountryCode: string | null;
  familyInvolvementLevel: string | null;
  preferredLocale: string;
  profileCompletionPct: number;
  primaryPhotoUrl: string | null;
  publicHeadline: string;
  publicSummary: string;
  seoDescription: string;
  lastLoginAt: string | null;
  gallery: Array<{
    id: string;
    isPrimary: boolean;
    storageUrl: string | null;
  }>;
  seo: {
    title: string;
    description: string;
  };
};

async function getPublicProfile(displayId: string) {
  const response = await fetch(`${getApiBaseUrl()}/public/profiles/${displayId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Public profile could not be loaded.");
  }

  return (await response.json()) as PublicProfileDetail;
}

export default async function LocalizedPublicProfileDetailPage({
  params,
}: {
  params: Promise<{ locale: string; displayId: string }>;
}) {
  const { locale, displayId } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const profile = await getPublicProfile(displayId);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.publicName,
    gender: profile.gender,
    description: profile.seo.description,
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{localeText(locale, "Public profile summary", "পাবলিক প্রোফাইল সারাংশ")}</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ShareProfileButton displayId={profile.displayId} name={profile.publicName} compact />
              <span>{profile.displayId}</span>
            </div>
          </div>
          <h1>{profile.publicName}</h1>
          <p className="hero-copy">{profile.publicSummary}</p>
          <div className="tag-list">
            {profile.publicHeadline ? <span className="tag tag-light">{profile.publicHeadline}</span> : null}
            {profile.motherTongue ? <span className="tag tag-light">{profile.motherTongue}</span> : null}
            {profile.educationLevel ? <span className="tag tag-light">{profile.educationLevel}</span> : null}
            {profile.familyInvolvementLevel ? (
              <span className="tag tag-light">{profile.familyInvolvementLevel}</span>
            ) : null}
          </div>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Join to express interest", "আগ্রহ জানাতে যোগ দিন")}
            </Link>
            <Link href={localizePath("/login", locale)} className="button button-soft">
              {localeText(locale, "Log in", "লগ ইন")}
            </Link>
            <Link href={localizePath("/profiles", locale)} className="button button-secondary">
              {localeText(locale, "Back to public profiles", "পাবলিক প্রোফাইলে ফিরুন")}
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">{localeText(locale, "Privacy-safe snapshot", "গোপনীয়তাসুরক্ষিত সারাংশ")}</p>
          <h2>{localeText(locale, "Only broad details are shown here.", "এখানে শুধু সীমিত তথ্য দেখানো হয়।")}</h2>
          <div className="stack-list">
            <div className="summary-card">
              <div className="summary-row">
                <span>{localeText(locale, "Gender", "লিঙ্গ")}</span>
                <strong>{translateGender(profile.gender, locale)}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Looking for", "খুঁজছেন")}</span>
                <strong>{translateLookingFor(
                  profile.lookingFor
                    ?? (profile.gender === "MAN" ? "WOMAN" : profile.gender === "WOMAN" ? "MAN" : null),
                  locale,
                )}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Religion", "ধর্ম")}</span>
                <strong>{translateReligion(profile.religion, locale)}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Profession", "পেশা")}</span>
                <strong>
                  {profile.profession ??
                    profile.designation ??
                    localeText(locale, "Profession shared after login", "লগ ইন করার পর পেশা দেখা যাবে")}
                </strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Education", "শিক্ষা")}</span>
                <strong>
                  {profile.educationLevel ??
                    localeText(locale, "Shared after login", "লগ ইন করার পর দেখা যাবে")}
                </strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Broad location", "বিস্তৃত লোকেশন")}</span>
                <strong>
                  {[profile.currentCity, profile.currentCountryCode]
                    .filter(Boolean)
                    .join(", ") ||
                    [profile.homeDistrict, profile.homeCountryCode].filter(Boolean).join(", ") ||
                    localeText(locale, "Location shared after login", "লগ ইন করার পর লোকেশন দেখা যাবে")}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Privacy rules", "গোপনীয়তার নিয়ম")}</p>
          <h2>{localeText(locale, "Contact details, hidden photos, and precise addresses stay protected.", "যোগাযোগের তথ্য, লুকানো ছবি, এবং সঠিক ঠিকানা সুরক্ষিত থাকে।")}</h2>
          <ul className="feature-list">
            <li>{localeText(locale, "Phone numbers and email addresses are never shown on indexable pages.", "ইনডেক্সযোগ্য পেজে ফোন নম্বর ও ইমেইল কখনো দেখানো হয় না।")}</li>
            <li>{localeText(locale, "Private photos and photo requests remain inside the logged-in member experience.", "প্রাইভেট ছবি ও ছবি-অনুরোধ লগ-ইন করা মেম্বার অভিজ্ঞতার মধ্যে থাকে।")}</li>
            <li>{localeText(locale, "Exact address, guardian details, and family contact data stay hidden.", "সঠিক ঠিকানা, অভিভাবকের তথ্য, এবং পারিবারিক যোগাযোগের তথ্য গোপন থাকে।")}</li>
            <li>{localeText(locale, "Full interaction, messaging, and contact unlocks require sign-in and plan access.", "পূর্ণ যোগাযোগ, মেসেজিং, এবং কন্টাক্ট আনলক করতে লগ ইন ও প্ল্যান দরকার।")}</li>
          </ul>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Approved public media", "অনুমোদিত পাবলিক মিডিয়া")}</p>
            <h2>{localeText(locale, "Only photos approved for public viewing appear here.", "শুধু পাবলিক ভিউয়ের জন্য অনুমোদিত ছবিগুলো এখানে দেখা যায়।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "If this member keeps photos private or blurred, the gallery stays hidden until the proper access flow happens inside the member portal.",
              "যদি এই মেম্বার ছবি প্রাইভেট রাখেন বা ব্লার করেন, তবে সঠিক অ্যাক্সেস ফ্লো না হওয়া পর্যন্ত গ্যালারি লুকানো থাকবে।",
            )}
          </p>
        </div>

        {profile.gallery.length ? (
          <div className="card-grid vendor-card-grid">
            {profile.gallery.map((item) => (
              <article key={item.id} className="mini-card">
                <div className="mini-card-body">
                  {item.storageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.storageUrl}
                      alt={`${profile.publicName} public profile photo`}
                      className="profile-public-image"
                    />
                  ) : (
                    <div className="profile-public-placeholder">
                      {localeText(locale, "Public photo unavailable", "পাবলিক ছবি পাওয়া যাচ্ছে না")}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">{localeText(locale, "No public gallery", "কোনো পাবলিক গ্যালারি নেই")}</p>
            <h2>{localeText(locale, "This member has not shared public photos.", "এই মেম্বার পাবলিক ছবি শেয়ার করেননি।")}</h2>
          </div>
        )}
      </section>

      <section className="cta-banner">
        <div>
          <p className="section-kicker">{localeText(locale, "Continue safely", "নিরাপদে এগিয়ে যান")}</p>
          <h2>{localeText(locale, "Join Borbodhu to unlock the trusted member experience.", "বিশ্বস্ত মেম্বার অভিজ্ঞতা পেতে বরবধূতে যোগ দিন।")}</h2>
          <p>
            {localeText(
              locale,
              "Registration opens full discovery, private-photo requests, messaging rules, paid upgrade flows, and wedding planning with vendor shortlisting.",
              "রেজিস্ট্রেশনের পর পূর্ণ ডিসকভারি, প্রাইভেট ছবি অনুরোধ, মেসেজিং নিয়ম, পেইড আপগ্রেড, এবং ভেন্ডর শর্টলিস্টসহ ওয়েডিং প্ল্যানিং খোলে।",
            )}
          </p>
        </div>
        <Link href={localizePath("/signup", locale)} className="button button-primary">
          {localeText(locale, "Create member account", "মেম্বার অ্যাকাউন্ট তৈরি করুন")}
        </Link>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </main>
  );
}
