import Link from "next/link";
import { notFound } from "next/navigation";

import { VendorLeadForm } from "@/components/vendor-lead-form";
import { getApiBaseUrl } from "@/lib/api";

type VendorDetail = {
  id: string;
  businessName: string;
  slug: string;
  categoryName: string | null;
  division: string | null;
  district: string | null;
  area: string | null;
  address: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
  status: string;
  billingStatus: string;
  packages: Array<{
    id: string;
    nameEn: string;
    nameBn: string | null;
    descriptionEn: string | null;
    descriptionBn: string | null;
    priceBdt: number;
  }>;
};

async function getVendorDetail(slug: string) {
  const response = await fetch(`${getApiBaseUrl()}/vendors/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Vendor details could not be loaded.");
  }

  return (await response.json()) as VendorDetail;
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await getVendorDetail(slug);
  const locationLabel =
    vendor.address ??
    [vendor.area, vendor.district, vendor.division].filter(Boolean).join(", ") ??
    "Location pending";
  const resolvedLocation = locationLabel || "Location pending";

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card hero-card-compact">
          <div className="eyebrow">
            <span>Vendor profile</span>
            <span>{vendor.categoryName ?? "Wedding service"}</span>
          </div>
          <h1>{vendor.businessName}</h1>
          <p className="hero-copy">
            {vendor.descriptionEn ?? vendor.descriptionBn ?? "Vendor description coming soon."}
          </p>
          <div className="tag-list">
            {vendor.categoryName ? <span className="tag tag-light">{vendor.categoryName}</span> : null}
            {[vendor.area, vendor.district, vendor.division]
              .filter(Boolean)
              .map((label) => (
                <span key={label} className="tag tag-light">
                  {label}
                </span>
              ))}
            <span className="tag tag-light">{vendor.billingStatus}</span>
          </div>
          <div className="hero-actions">
            <Link href="/vendors" className="button button-soft">
              Back to directory
            </Link>
            <Link href="/signup" className="button button-primary">
              Join to shortlist
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">Contact</p>
          <h2>Public business details</h2>
          <div className="stack-list">
            <div className="summary-card">
              <div className="summary-row">
                <span>Phone</span>
                <strong>{vendor.phone ?? "By request"}</strong>
              </div>
              <div className="summary-row">
                <span>Email</span>
                <strong>{vendor.email ?? "By request"}</strong>
              </div>
              <div className="summary-row">
                <span>Website</span>
                <strong>{vendor.website ?? "Not listed"}</strong>
              </div>
              <div className="summary-row">
                <span>Contact person</span>
                <strong>{vendor.contactPerson ?? "Vendor team"}</strong>
              </div>
              <div className="summary-row">
                <span>Address</span>
                <strong>{resolvedLocation}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">Why this matters</p>
          <h2>Vendor pages support wedding planning without exposing member privacy.</h2>
          <ul className="feature-list">
            <li>Public visitors can explore services and pricing without account friction.</li>
            <li>Members can move from discovery into wedding planning and shortlist vendors later.</li>
            <li>Vendor self-service can grow on top of this foundation without changing the route structure.</li>
          </ul>
        </article>
      </section>

      <section className="split-layout">
        <VendorLeadForm vendorName={vendor.businessName} vendorSlug={vendor.slug} />

        <article className="feature-panel tone-alt">
          <p className="section-kicker">Launch 1 revenue</p>
          <h2>Vendor self-service is now part of the actual browser flow.</h2>
          <ul className="feature-list">
            <li>Vendor accounts can now sign up directly from the browser.</li>
            <li>Lead submissions from this page go into the vendor dashboard and notification outbox.</li>
            <li>Packages can be published and paused without admin intervention.</li>
          </ul>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Packages</p>
            <h2>Published offerings for this vendor.</h2>
          </div>
          <p>
            This is the first public package layer for the new Borbodhu vendor marketplace. It can
            expand later into lead capture, ads, and premium vendor visibility.
          </p>
        </div>

        {vendor.packages.length ? (
          <div className="card-grid vendor-card-grid">
            {vendor.packages.map((pkg) => (
              <article key={pkg.id} className="mini-card">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{pkg.nameEn}</strong>
                      <p className="mini-text">{pkg.nameBn ?? "Bangla name pending"}</p>
                    </div>
                    <span className="status-pill status-pill-gold">{pkg.priceBdt} BDT</span>
                  </div>
                  <p className="mini-text">
                    {pkg.descriptionEn ?? pkg.descriptionBn ?? "Package description coming soon."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">Packages coming soon</p>
            <h2>This vendor has not published packages yet.</h2>
          </div>
        )}
      </section>
    </main>
  );
}
