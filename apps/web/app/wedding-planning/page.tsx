import type { Metadata } from "next";
import Link from "next/link";

import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import { getPublicCommercialConfig } from "@/lib/commercial";
import { weddingPlanningContent } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: weddingPlanningContent.title,
  description: weddingPlanningContent.description,
};

export default async function WeddingPlanningLandingPage() {
  const publicConfig = await getPublicCommercialConfig();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>Wedding Planning</span>
            <span>From match to marriage — all in one place</span>
          </div>
          <h1>{weddingPlanningContent.title}</h1>
          <p className="hero-copy">{weddingPlanningContent.lead}</p>
          <div className="hero-actions">
            <Link href="/signup" className="button button-primary">
              Start planning
            </Link>
            <Link href="/vendors" className="button button-soft">
              Browse vendors
            </Link>
            <Link href="/profiles" className="button button-secondary">
              Browse profiles
            </Link>
          </div>
        </div>
      </section>

      <PublicSponsorSlot config={publicConfig} placement="wedding" />

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">Why this matters</p>
          <h2>Your wedding journey starts here.</h2>
          <ul className="feature-list">
            {weddingPlanningContent.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">Everything in one place</p>
          <h2>Find your match, plan your wedding, and book trusted vendors — without leaving Borbodhu.</h2>
          <p>
            Most couples juggle separate apps for matchmaking and wedding planning. Borbodhu
            keeps the entire journey together — from first interest to your wedding day.
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">FAQs</p>
            <h2>Common questions about wedding planning on Borbodhu.</h2>
          </div>
          <p>
            Everything you need to know about planning your Bangladeshi wedding through Borbodhu.
          </p>
        </div>

        <div className="card-grid">
          {weddingPlanningContent.faqs.map((faq) => (
            <article key={faq.question} className="info-card">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
