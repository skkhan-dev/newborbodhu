import Link from "next/link";
import { notFound } from "next/navigation";

import { isSupportedPublicLocale, localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";
import { matrimonyMarkets } from "@/lib/seo-content";

function getMarket(slug: string) {
  return matrimonyMarkets.find((item) => item.slug === slug);
}

export default async function LocalizedMatrimonyMarketPage({
  params,
}: {
  params: Promise<{ locale: string; market: string }>;
}) {
  const { locale, market } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const content = getMarket(market);

  if (!content) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>{content.heroLabel}</span>
            <span>{localeText(locale, "SEO-ready public page", "SEO-এর জন্য প্রস্তুত পাবলিক পেজ")}</span>
          </div>
          <h1>{content.title}</h1>
          <p className="hero-copy">{content.lead}</p>
          <div className="hero-actions">
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Join Free", "বরবধূতে যোগ দিন")}
            </Link>
            <Link href={localizePath("/profiles", locale)} className="button button-soft">
              {localeText(locale, "Browse profiles", "প্রোফাইল দেখুন")}
            </Link>
            <Link href={localizePath("/matrimony", locale)} className="button button-secondary">
              {localeText(locale, "All guides", "সব গাইড")}
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">{localeText(locale, "Audience fit", "কার জন্য")}</p>
          <h2>{localeText(locale, "Who this page is speaking to.", "এই পেজ কার জন্য লেখা হয়েছে।")}</h2>
          <ul className="feature-list">
            {content.audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Platform strengths", "প্ল্যাটফর্মের শক্তি")}</p>
          <h2>{localeText(locale, "Why Borbodhu can stand out in this market.", "এই মার্কেটে বরবধূ কেন আলাদা হতে পারে।")}</h2>
          <ul className="feature-list">
            {content.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">FAQs</p>
            <h2>{localeText(locale, "Public answers for high-intent search traffic.", "উচ্চ-ইনটেন্ট সার্চ ট্রাফিকের জন্য পাবলিক উত্তর।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "These pages are designed to attract search visibility while routing serious users into the verified member journey.",
              "এই পেজগুলো সার্চ ট্রাফিক আনে এবং সিরিয়াস ব্যবহারকারীকে ভেরিফায়েড মেম্বার যাত্রায় নিয়ে যায়।",
            )}
          </p>
        </div>

        <div className="card-grid">
          {content.faqs.map((faq) => (
            <article key={faq.question} className="info-card">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
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
