import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { matrimonyMarkets } from "@/lib/seo-content";

function getMarket(slug: string) {
  return matrimonyMarkets.find((item) => item.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;
  const content = getMarket(market);

  if (!content) {
    return {
      title: "Bangladeshi Matrimony | borbodhu.com",
    };
  }

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/matrimony/${content.slug}`,
    },
  };
}

export default async function MatrimonyMarketPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
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
            <span>SEO-ready public page</span>
          </div>
          <h1>{content.title}</h1>
          <p className="hero-copy">{content.lead}</p>
          <div className="hero-actions">
            <Link href="/signup" className="button button-primary">
              Join Borbodhu
            </Link>
            <Link href="/profiles" className="button button-soft">
              Browse profiles
            </Link>
            <Link href="/matrimony" className="button button-secondary">
              All guides
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">Audience fit</p>
          <h2>Who this page is speaking to.</h2>
          <ul className="feature-list">
            {content.audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">Platform strengths</p>
          <h2>Why Borbodhu can stand out in this market.</h2>
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
            <h2>Public answers for high-intent search traffic.</h2>
          </div>
          <p>
            These pages are designed to attract search visibility while routing serious users into
            the verified member journey.
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
