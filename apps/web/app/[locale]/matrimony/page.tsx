import Link from "next/link";
import { notFound } from "next/navigation";

import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import { matrimonyMarkets } from "@/lib/seo-content";

export default async function LocalizedMatrimonyLandingIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{localeText(locale, "Matrimony Guides", "ম্যাট্রিমনি গাইড")}</span>
            <span>
              {matrimonyMarkets.length}{" "}
              {localeText(locale, "search-intent landing pages", "সার্চ-ইনটেন্ট ল্যান্ডিং পেজ")}
            </span>
          </div>
          <h1>
            {localeText(
              locale,
              "Location-aware Borbodhu landing pages help members in Bangladesh and abroad understand the platform fast.",
              "লোকেশনভিত্তিক বরবধূ ল্যান্ডিং পেজ বাংলাদেশ ও প্রবাসের মেম্বারদের দ্রুত প্ল্যাটফর্ম বুঝতে সাহায্য করে।",
            )}
          </h1>
          <p className="hero-copy">
            {localeText(
              locale,
              "These pages are designed for SEO and trust-building: Bangladesh, diaspora markets, wedding planning, and ghotok-led journeys all get their own clear public surface.",
              "এই পেজগুলো SEO ও আস্থা গড়ার জন্য তৈরি: বাংলাদেশ, প্রবাস, ওয়েডিং প্ল্যানিং, এবং ঘটক-নির্ভর যাত্রা সবকিছুর জন্য আলাদা পাবলিক উপস্থিতি থাকে।",
            )}
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Market pages", "মার্কেট পেজ")}</p>
            <h2>{localeText(locale, "Search-intent pages for Bangladesh and diaspora audiences.", "বাংলাদেশ ও প্রবাসী দর্শকের জন্য সার্চ-ইনটেন্ট পেজ।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "Each page keeps the messaging aligned to a real audience instead of forcing one generic homepage to do everything.",
              "প্রতিটি পেজ বাস্তব দর্শকের সাথে ভাষা ও বার্তা মিলিয়ে তৈরি, যাতে একটিমাত্র সাধারণ হোমপেজকে সব কাজ করতে না হয়।",
            )}
          </p>
        </div>

        <div className="card-grid">
          {matrimonyMarkets.map((market) => (
            <article key={market.slug} className="info-card">
              <span className="screen-pill">{market.heroLabel}</span>
              <h3>{market.title}</h3>
              <p>{market.description}</p>
              <div className="inline-actions">
                <Link
                  href={localizePath(`/matrimony/${market.slug}`, locale)}
                  className="button button-primary"
                >
                  {localeText(locale, "Open page", "পেজ খুলুন")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
