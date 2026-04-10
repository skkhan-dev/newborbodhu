import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";
import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type PublicGhotokItem = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  bioEn: string | null;
  bioBn: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  photoPath: string | null;
  managedCount: number;
  publicHeadline: string;
};

async function getPublicGhotoks() {
  const response = await fetch(`${getApiBaseUrl()}/public/ghotoks`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Public ghotoks could not be loaded.");
  }

  return (await response.json()) as PublicGhotokItem[];
}

export default async function LocalizedPublicGhotoksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const ghotoks = await getPublicGhotoks();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{localeText(locale, "Trusted Ghotok Network", "বিশ্বস্ত ঘটক নেটওয়ার্ক")}</span>
            <span>
              {ghotoks.length}{" "}
              {localeText(locale, "active public ghotok profiles", "সক্রিয় পাবলিক ঘটক প্রোফাইল")}
            </span>
          </div>
          <h1>
            {localeText(
              locale,
              "Family-guided introductions still matter, and Borbodhu now treats ghotoks as a real product pillar.",
              "পারিবারিক পরিচয়ের ধারা এখনো গুরুত্বপূর্ণ, আর বরবধূ ঘটককে এখন বাস্তব প্রোডাক্ট পিলার হিসেবে গড়ে তুলছে।",
            )}
          </h1>
          <p className="hero-copy">
            {localeText(
              locale,
              "These public pages help members and families discover trusted matchmakers without exposing private member data. The deeper working tools stay in the logged-in ghotok portal and app.",
              "এই পাবলিক পেজগুলো পরিবারের জন্য বিশ্বস্ত ঘটক খুঁজে পাওয়া সহজ করে, কিন্তু প্রাইভেট মেম্বার ডেটা প্রকাশ করে না। গভীর কাজের টুলগুলো লগ-ইন করা ঘটক পোর্টাল ও অ্যাপে থাকে।",
            )}
          </p>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Join as a member", "মেম্বার হিসেবে যোগ দিন")}
            </Link>
            <Link href={localizePath("/login", locale)} className="button button-soft">
              {localeText(locale, "Ghotok login", "ঘটক লগ ইন")}
            </Link>
            <Link href={localizePath("/matrimony", locale)} className="button button-secondary">
              {localeText(locale, "Explore matrimony guides", "ম্যাট্রিমনি গাইড দেখুন")}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Public directory", "পাবলিক ডিরেক্টরি")}</p>
            <h2>{localeText(locale, "Matchmakers, family coordinators, and local trust-builders.", "ঘটক, পারিবারিক সমন্বয়কারী, এবং স্থানীয় বিশ্বাসের মানুষজন।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "Public ghotok pages are designed for search and trust-building. Sensitive profile work, credits, impersonation, and managed-member actions remain private.",
              "পাবলিক ঘটক পেজ সার্চ এবং বিশ্বাস তৈরির জন্য। সংবেদনশীল প্রোফাইল কাজ, ক্রেডিট, ইমপারসনেশন, এবং ম্যানেজড মেম্বার অ্যাকশন প্রাইভেট থাকে।",
            )}
          </p>
        </div>

        <div className="card-grid vendor-card-grid">
          {ghotoks.map((ghotok) => (
            <article key={ghotok.id} className="mini-card">
              <div className="mini-card-body">
                <span className="screen-pill">
                  {localeText(locale, "Managed profiles", "ম্যানেজড প্রোফাইল")}: {ghotok.managedCount}
                </span>
                <h3>{ghotok.displayName}</h3>
                <p>{ghotok.publicHeadline}</p>
                {locale === "bn" ? (
                  <p className="mini-text">{ghotok.bioBn ?? ghotok.bioEn}</p>
                ) : ghotok.bioEn ? (
                  <p className="mini-text">{ghotok.bioEn}</p>
                ) : null}
                <div className="tag-list">
                  {ghotok.address ? <span className="tag tag-light">{ghotok.address}</span> : null}
                  <span className="tag tag-light">
                    {localeText(locale, "Family-guided intros", "পারিবারিক পরিচয়")}
                  </span>
                  <span className="tag tag-light">
                    {localeText(locale, "Admin-reviewed platform", "অ্যাডমিন রিভিউ করা প্ল্যাটফর্ম")}
                  </span>
                </div>
                <div className="inline-actions">
                  <Link
                    href={localizePath(`/ghotok/${ghotok.slug}`, locale)}
                    className="button button-primary"
                  >
                    {localeText(locale, "View public page", "পাবলিক পেজ দেখুন")}
                  </Link>
                  <Link href={localizePath("/signup", locale)} className="button button-soft">
                    {localeText(locale, "Join Free", "বরবধূতে যোগ দিন")}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
