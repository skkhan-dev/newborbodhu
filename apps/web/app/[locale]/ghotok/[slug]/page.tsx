import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";
import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type PublicGhotokDetail = {
  id: string;
  slug: string;
  displayName: string;
  bioEn: string | null;
  bioBn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  photoPath: string | null;
  managedCount: number;
  publicHeadline: string;
  seo: {
    title: string;
    description: string;
  };
  sampleProfiles: Array<{
    displayId: string;
    gender: string;
    religion: string | null;
    location: string;
  }>;
  walletBalance: number;
};

async function getPublicGhotok(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/public/ghotoks/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Public ghotok profile could not be loaded.");
  }

  return (await response.json()) as PublicGhotokDetail;
}

export default async function LocalizedPublicGhotokDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const ghotok = await getPublicGhotok(slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ghotok.displayName,
    description: ghotok.seo.description,
    knowsAbout: ["Bangladeshi matrimony", "Family-guided introductions", "Wedding planning"],
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{localeText(locale, "Public Ghotok Profile", "পাবলিক ঘটক প্রোফাইল")}</span>
            <span>
              {ghotok.managedCount}{" "}
              {localeText(locale, "active managed profiles sampled", "ম্যানেজড প্রোফাইলের নমুনা")}
            </span>
          </div>
          <h1>{ghotok.displayName}</h1>
          <p className="hero-copy">
            {locale === "bn"
              ? ghotok.bioBn ??
                ghotok.bioEn ??
                "পরিবার ও মেম্বারদের জন্য বিশ্বস্ত পরিচয় তৈরিতে সহায়তাকারী বরবধূ ঘটক।"
              : ghotok.bioEn ??
                ghotok.bioBn ??
                "Trusted Borbodhu ghotok helping members and families with serious introductions."}
          </p>
          <div className="tag-list">
            {ghotok.publicHeadline ? <span className="tag tag-light">{ghotok.publicHeadline}</span> : null}
            {ghotok.address ? <span className="tag tag-light">{ghotok.address}</span> : null}
            <span className="tag tag-light">
              {localeText(locale, "Family-guided introductions", "পারিবারিক পরিচয়")}
            </span>
          </div>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Join to work with Borbodhu", "বরবধূর সাথে কাজ করতে যোগ দিন")}
            </Link>
            <Link href={localizePath("/ghotok", locale)} className="button button-soft">
              {localeText(locale, "Back to ghotok directory", "ঘটক ডিরেক্টরিতে ফিরুন")}
            </Link>
            <Link
              href={localizePath("/wedding-planning", locale)}
              className="button button-secondary"
            >
              {localeText(locale, "Wedding planning", "ওয়েডিং প্ল্যানিং")}
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">{localeText(locale, "How this works", "কিভাবে কাজ করে")}</p>
          <h2>
            {localeText(
              locale,
              "Public trust first, private workflow after sign-in.",
              "আগে পাবলিক আস্থা, পরে লগ ইন করা প্রাইভেট ওয়ার্কফ্লো।",
            )}
          </h2>
          <ul className="feature-list">
            <li>{localeText(locale, "Families can discover the ghotok publicly before committing to a guided flow.", "পরিবারগুলো গাইডেড ফ্লো শুরু করার আগে পাবলিকভাবে ঘটককে জানতে পারে।")}</li>
            <li>{localeText(locale, "Managed-member workflows, credits, and impersonation remain protected inside the portal.", "ম্যানেজড-মেম্বার ওয়ার্কফ্লো, ক্রেডিট, এবং ইমপারসনেশন পোর্টালের ভেতরে সুরক্ষিত থাকে।")}</li>
            <li>{localeText(locale, "Sample profile coverage below stays broad and privacy-safe.", "নিচের নমুনা প্রোফাইল তথ্য সীমিত এবং গোপনীয়তাসুরক্ষিত থাকে।")}</li>
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Public signals", "পাবলিক সিগন্যাল")}</p>
          <h2>
            {localeText(
              locale,
              "High-level reputation cues without exposing private contacts.",
              "প্রাইভেট যোগাযোগ না দেখিয়ে উচ্চস্তরের বিশ্বাসযোগ্যতার ইঙ্গিত।",
            )}
          </h2>
          <div className="summary-card">
            <div className="summary-row">
              <span>{localeText(locale, "Display name", "নাম")}</span>
              <strong>{ghotok.displayName}</strong>
            </div>
            <div className="summary-row">
              <span>{localeText(locale, "Broad location", "বিস্তৃত লোকেশন")}</span>
              <strong>{ghotok.address ?? localeText(locale, "Shared on request", "অনুরোধে")}</strong>
            </div>
            <div className="summary-row">
              <span>{localeText(locale, "Managed profile sample size", "ম্যানেজড প্রোফাইল সংখ্যা")}</span>
              <strong>{ghotok.managedCount}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Sample managed profile mix", "ম্যানেজড প্রোফাইলের নমুনা")}</p>
            <h2>{localeText(locale, "Only broad, privacy-safe profile metadata appears here.", "এখানে শুধু সীমিত ও গোপনীয়তাসুরক্ষিত প্রোফাইল তথ্য থাকে।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "This is meant to help families understand the type of profiles a ghotok works with, not to reveal private member identity.",
              "এটি পরিবারকে বুঝতে সাহায্য করে কোন ধরনের প্রোফাইল নিয়ে ঘটক কাজ করেন, ব্যক্তিগত পরিচয় প্রকাশ করতে নয়।",
            )}
          </p>
        </div>

        <div className="card-grid">
          {ghotok.sampleProfiles.map((profile) => (
            <article key={profile.displayId} className="info-card">
              <h3>{profile.displayId}</h3>
              <p>{[profile.gender, profile.religion, profile.location].filter(Boolean).join(" • ")}</p>
            </article>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </main>
  );
}
