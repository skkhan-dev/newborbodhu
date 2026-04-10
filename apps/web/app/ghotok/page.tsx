import type { Metadata } from "next";
import Link from "next/link";

import { getApiBaseUrl } from "@/lib/api";

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

export const metadata: Metadata = {
  title: "Trusted Ghotok Services | borbodhu.com",
  description:
    "Explore active Borbodhu ghotoks and matchmakers helping Bangladeshi families with trusted introductions.",
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

export default async function PublicGhotoksPage() {
  const ghotoks = await getPublicGhotoks();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>Trusted Ghotok Network</span>
            <span>{ghotoks.length} active public ghotok profiles</span>
          </div>
          <h1>Find trusted matchmakers who understand Bangladeshi family values.</h1>
          <p className="hero-copy">
            Browse verified Ghotok profiles and find a matchmaker who can guide your family
            through the process. Every Ghotok on Borbodhu works within the platform — managing
            profiles, facilitating introductions, and tracking matches digitally.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="button button-primary">
              Join as a member
            </Link>
            <Link href="/login" className="button button-soft">
              Ghotok login
            </Link>
            <Link href="/matrimony" className="button button-secondary">
              Explore matrimony guides
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Public directory</p>
            <h2>Matchmakers, family coordinators, and local trust-builders.</h2>
          </div>
          <p>
            Public ghotok pages are designed for search and trust-building. Sensitive profile work,
            credits, impersonation, and managed-member actions remain private.
          </p>
        </div>

        <div className="card-grid vendor-card-grid">
          {ghotoks.map((ghotok) => (
            <article key={ghotok.id} className="mini-card">
              <div className="mini-card-body">
                <span className="screen-pill">Managed profiles: {ghotok.managedCount}</span>
                <h3>{ghotok.displayName}</h3>
                <p>{ghotok.publicHeadline}</p>
                {ghotok.bioEn ? <p className="mini-text">{ghotok.bioEn}</p> : null}
                <div className="tag-list">
                  {ghotok.address ? <span className="tag tag-light">{ghotok.address}</span> : null}
                  <span className="tag tag-light">Family-guided intros</span>
                  <span className="tag tag-light">Admin-reviewed platform</span>
                </div>
                <div className="inline-actions">
                  <Link href={`/ghotok/${ghotok.slug}`} className="button button-primary">
                    View public page
                  </Link>
                  <Link href="/signup" className="button button-soft">
                    Join Free
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
