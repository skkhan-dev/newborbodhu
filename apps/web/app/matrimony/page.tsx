import type { Metadata } from "next";
import Link from "next/link";

import { matrimonyMarkets } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Bangladeshi Matrimony Guides | বিবাহ গাইড | borbodhu.com",
  description:
    "Explore Borbodhu matrimony landing pages for Bangladesh and the Bangladeshi diaspora.",
};

export default function MatrimonyLandingIndexPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>Matrimony Guides</span>
            <span>Bangladesh and diaspora</span>
          </div>
          <h1>Bangladeshi matrimony guides for home and abroad.</h1>
          <p className="hero-copy">
            Whether you are in Dhaka, London, New York, or Dubai — find the right guide for your
            matrimony journey. Each page is tailored to your location and community.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Explore by location</p>
            <h2>Guides for Bangladesh and diaspora communities.</h2>
          </div>
          <p>
            Each guide is written for a specific audience so you get advice and profiles relevant
            to where you live.
          </p>
        </div>

        <div className="card-grid">
          {matrimonyMarkets.map((market) => (
            <article key={market.slug} className="info-card">
              <span className="screen-pill">{market.heroLabel}</span>
              <h3>{market.title}</h3>
              <p>{market.description}</p>
              <div className="inline-actions">
                <Link href={`/matrimony/${market.slug}`} className="button button-primary">
                  Open page
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
