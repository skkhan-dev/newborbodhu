import Link from "next/link";
import { notFound } from "next/navigation";

import {
  VendorLeadForm,
  type VendorLeadFormCopy,
} from "@/components/vendor-lead-form";
import { getApiBaseUrl } from "@/lib/api";
import { isSupportedPublicLocale, localizePath, type PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

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

function getLeadCopy(locale: PublicLocale): Partial<VendorLeadFormCopy> {
  if (locale === "bn") {
    return {
      kicker: "লিড ফর্ম",
      title: "এই ভেন্ডরকে বার্তা পাঠান।",
      memberHint:
        "আপনি মেম্বার হিসেবে লগ ইন আছেন, তাই এই অনুরোধটি আপনার বরবধূ অ্যাকাউন্টের সাথে যুক্ত হবে।",
      guestHint:
        "অতিথিরাও এখানে অনুরোধ পাঠাতে পারে। লগ ইন করা মেম্বাররা আরও ভালো ফলো-আপ পায়।",
      memberMessageLabel: "বার্তা",
      memberMessagePlaceholder:
        "বিয়ের তারিখ, শহর, অতিথি সংখ্যা, বা কী ধরনের সহায়তা চান তা লিখুন।",
      memberSubmit: "মেম্বার অনুরোধ পাঠান",
      guestNameLabel: "আপনার নাম",
      guestEmailLabel: "ইমেইল",
      guestPhoneLabel: "ফোন",
      guestMessageLabel: "বার্তা",
      guestMessagePlaceholder: "আপনার কী ধরনের ওয়েডিং সাপোর্ট দরকার তা লিখুন।",
      guestSubmit: "অনুরোধ পাঠান",
      sending: "পাঠানো হচ্ছে...",
      guestSuccessTemplate: "{vendorName}-এ আপনার অনুরোধ পাঠানো হয়েছে।",
      memberSuccessTemplate: "{vendorName}-এ আপনার মেম্বার অনুরোধ পাঠানো হয়েছে।",
    };
  }

  return {};
}

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

export default async function LocalizedVendorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  const vendor = await getVendorDetail(slug);
  const locationLabel =
    vendor.address ??
    [vendor.area, vendor.district, vendor.division].filter(Boolean).join(", ") ??
    localeText(locale, "Location pending", "লোকেশন পরে যোগ হবে");
  const resolvedLocation =
    locationLabel || localeText(locale, "Location pending", "লোকেশন পরে যোগ হবে");

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card hero-card-compact">
          <div className="eyebrow">
            <span>{localeText(locale, "Vendor profile", "ভেন্ডর প্রোফাইল")}</span>
            <span>{vendor.categoryName ?? localeText(locale, "Wedding service", "ওয়েডিং সার্ভিস")}</span>
          </div>
          <h1>{vendor.businessName}</h1>
          <p className="hero-copy">
            {locale === "bn"
              ? vendor.descriptionBn ??
                vendor.descriptionEn ??
                "ভেন্ডরের বর্ণনা পরে যোগ করা হবে।"
              : vendor.descriptionEn ??
                vendor.descriptionBn ??
                "Vendor description coming soon."}
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
            <Link href={localizePath("/vendors", locale)} className="button button-soft">
              {localeText(locale, "Back to directory", "ডিরেক্টরিতে ফিরুন")}
            </Link>
            <Link href={localizePath("/signup", locale)} className="button button-primary">
              {localeText(locale, "Join to shortlist", "শর্টলিস্ট করতে যোগ দিন")}
            </Link>
          </div>
        </div>
      </section>

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">{localeText(locale, "Contact", "যোগাযোগ")}</p>
          <h2>{localeText(locale, "Public business details", "পাবলিক ব্যবসায়িক তথ্য")}</h2>
          <div className="stack-list">
            <div className="summary-card">
              <div className="summary-row">
                <span>{localeText(locale, "Phone", "ফোন")}</span>
                <strong>{vendor.phone ?? localeText(locale, "By request", "অনুরোধে")}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Email", "ইমেইল")}</span>
                <strong>{vendor.email ?? localeText(locale, "By request", "অনুরোধে")}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Website", "ওয়েবসাইট")}</span>
                <strong>{vendor.website ?? localeText(locale, "Not listed", "তালিকাভুক্ত নয়")}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Contact person", "যোগাযোগ ব্যক্তি")}</span>
                <strong>{vendor.contactPerson ?? localeText(locale, "Vendor team", "ভেন্ডর টিম")}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Address", "ঠিকানা")}</span>
                <strong>{resolvedLocation}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Why this matters", "কেন এটি গুরুত্বপূর্ণ")}</p>
          <h2>
            {localeText(
              locale,
              "Vendor pages support wedding planning without exposing member privacy.",
              "ভেন্ডর পেজ মেম্বারের গোপনীয়তা রক্ষা করে ওয়েডিং প্ল্যানিংকে শক্তিশালী করে।",
            )}
          </h2>
          <ul className="feature-list">
            <li>{localeText(locale, "Public visitors can explore services and pricing without account friction.", "পাবলিক ভিজিটররা অ্যাকাউন্ট ছাড়াই সার্ভিস ও মূল্য দেখতে পারে।")}</li>
            <li>{localeText(locale, "Members can move from discovery into wedding planning and shortlist vendors later.", "মেম্বাররা এখান থেকে ওয়েডিং প্ল্যানিংয়ে গিয়ে পরে ভেন্ডর শর্টলিস্ট করতে পারে।")}</li>
            <li>{localeText(locale, "Vendor self-service can grow on top of this foundation without changing the route structure.", "এই ভিত্তির ওপর ভেন্ডর সেলফ-সার্ভিস আরও বড় করা যাবে।")}</li>
          </ul>
        </article>
      </section>

      <section className="split-layout">
        <VendorLeadForm
          vendorName={vendor.businessName}
          vendorSlug={vendor.slug}
          copy={getLeadCopy(locale)}
        />

        <article className="feature-panel tone-alt">
          <p className="section-kicker">{localeText(locale, "Launch 1 revenue", "লঞ্চ ১ আয়")}</p>
          <h2>
            {localeText(
              locale,
              "Vendor self-service is now part of the actual browser flow.",
              "ভেন্ডর সেলফ-সার্ভিস এখন বাস্তব ব্রাউজার অভিজ্ঞতার অংশ।",
            )}
          </h2>
          <ul className="feature-list">
            <li>{localeText(locale, "Vendor accounts can now sign up directly from the browser.", "ভেন্ডর অ্যাকাউন্ট এখন সরাসরি ব্রাউজার থেকে সাইন আপ করতে পারে।")}</li>
            <li>{localeText(locale, "Lead submissions from this page go into the vendor dashboard and notification outbox.", "এই পেজের লিড সরাসরি ভেন্ডর ড্যাশবোর্ড ও নোটিফিকেশন আউটবক্সে যায়।")}</li>
            <li>{localeText(locale, "Packages can be published and paused without admin intervention.", "অ্যাডমিন ছাড়াই প্যাকেজ প্রকাশ বা বন্ধ করা যায়।")}</li>
          </ul>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Packages", "প্যাকেজ")}</p>
            <h2>{localeText(locale, "Published offerings for this vendor.", "এই ভেন্ডরের প্রকাশিত অফারগুলো।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "This is the first public package layer for the new Borbodhu vendor marketplace. It can expand later into lead capture, ads, and premium vendor visibility.",
              "এটি নতুন বরবধূ ভেন্ডর মার্কেটপ্লেসের প্রথম পাবলিক প্যাকেজ স্তর। পরে এটি লিড, বিজ্ঞাপন, এবং প্রিমিয়াম ভিজিবিলিটিতে বাড়বে।",
            )}
          </p>
        </div>

        {vendor.packages.length ? (
          <div className="card-grid vendor-card-grid">
            {vendor.packages.map((pkg) => (
              <article key={pkg.id} className="mini-card">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{locale === "bn" ? pkg.nameBn ?? pkg.nameEn : pkg.nameEn}</strong>
                      <p className="mini-text">
                        {locale === "bn"
                          ? pkg.nameEn
                          : pkg.nameBn ?? localeText(locale, "Bangla name pending", "বাংলা নাম পরে আসবে")}
                      </p>
                    </div>
                    <span className="status-pill status-pill-gold">{pkg.priceBdt} BDT</span>
                  </div>
                  <p className="mini-text">
                    {locale === "bn"
                      ? pkg.descriptionBn ?? pkg.descriptionEn ?? "প্যাকেজের বর্ণনা পরে যোগ হবে।"
                      : pkg.descriptionEn ?? pkg.descriptionBn ?? "Package description coming soon."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">{localeText(locale, "Packages coming soon", "প্যাকেজ পরে আসবে")}</p>
            <h2>{localeText(locale, "This vendor has not published packages yet.", "এই ভেন্ডর এখনো কোনো প্যাকেজ প্রকাশ করেনি।")}</h2>
          </div>
        )}
      </section>
    </main>
  );
}
