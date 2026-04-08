import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const ghotok = await getPublicGhotok(slug);

    return {
      title: ghotok.seo.title,
      description: ghotok.seo.description,
      alternates: {
        canonical: `/ghotok/${ghotok.slug}`,
      },
    };
  } catch {
    return {
      title: "Trusted Ghotok | borbodhu.com",
    };
  }
}

export default async function PublicGhotokDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ghotok = await getPublicGhotok(slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ghotok.displayName,
    description: ghotok.seo.description,
    knowsAbout: ["Bangladeshi matrimony", "Family-guided introductions", "Wedding planning"],
    address: ghotok.address
      ? {
          "@type": "PostalAddress",
          streetAddress: ghotok.address,
        }
      : undefined,
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <div className="eyebrow">
            <span>Public Ghotok Profile</span>
            <span>{ghotok.managedCount} active managed profiles sampled</span>
          </div>
          <h1>{ghotok.displayName}</h1>
          <p className="hero-copy">
            {ghotok.bioEn ??
              ghotok.bioBn ??
              "Trusted Borbodhu ghotok helping members and families with serious introductions."}
          </p>
          <div className="tag-list">
            {ghotok.publicHeadline ? <span className="tag tag-light">{ghotok.publicHeadline}</span> : null}
            {ghotok.address ? <span className="tag tag-light">{ghotok.address}</span> : null}
            <span className="tag tag-light">Family-guided introductions</span>
          </div>
          <div className="hero-actions">
            <Link href="/signup" className="button button-primary">
              Join to work with Borbodhu
            </Link>
            <Link href="/ghotok" className="button button-soft">
              Back to ghotok directory
            </Link>
            <Link href="/wedding-planning" className="button button-secondary">
              Wedding planning
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">How this works</p>
          <h2>Public trust first, private workflow after sign-in.</h2>
          <ul className="feature-list">
            <li>Families can discover the ghotok publicly before committing to a guided flow.</li>
            <li>Managed-member workflows, credits, and impersonation remain protected inside the portal.</li>
            <li>Sample profile coverage below stays broad and privacy-safe.</li>
          </ul>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">Public signals</p>
          <h2>High-level reputation cues without exposing private contacts.</h2>
          <div className="summary-card">
            <div className="summary-row">
              <span>Display name</span>
              <strong>{ghotok.displayName}</strong>
            </div>
            <div className="summary-row">
              <span>Broad location</span>
              <strong>{ghotok.address ?? "Shared on request"}</strong>
            </div>
            <div className="summary-row">
              <span>Managed profile sample size</span>
              <strong>{ghotok.managedCount}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Sample managed profile mix</p>
            <h2>Only broad, privacy-safe profile metadata appears here.</h2>
          </div>
          <p>
            This is meant to help families understand the type of profiles a ghotok works with,
            not to reveal private member identity.
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
