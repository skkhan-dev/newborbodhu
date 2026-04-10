import Link from "next/link";

import { PublicProfileCard } from "@/components/public-profile-card";
import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import { PublicSearchForm } from "@/components/public-search-form";
import { getPublicCommercialConfig } from "@/lib/commercial";
import { localizePath, type PublicLocale } from "@/lib/locale";
import {
  buildPublicProfileSearchHref,
  getPublicProfiles,
  normalizePublicProfileSearchParams,
  type PublicProfileSearchParams,
} from "@/lib/public-profile-search";
import {
  localeText,
} from "@/lib/public-page-locale";

type PublicProfilesShellProps = {
  locale: PublicLocale | null;
  searchParams: PublicProfileSearchParams;
};

export async function PublicProfilesShell({
  locale,
  searchParams,
}: PublicProfilesShellProps) {
  const resolvedSearchParams = normalizePublicProfileSearchParams(searchParams);
  const [directory, publicConfig] = await Promise.all([
    getPublicProfiles(resolvedSearchParams),
    getPublicCommercialConfig(),
  ]);
  const totalPages = Math.max(1, Math.ceil(directory.total / directory.pageSize));
  const rangeLabel = directory.results.length
    ? `${(directory.page - 1) * directory.pageSize + 1}-${(directory.page - 1) * directory.pageSize + directory.results.length}`
    : "0";

  return (
    <main className="page-shell">
      <section className="hero-card public-home-hero">
        <div className="public-home-hero-grid">
          <div className="public-home-copy">
            <div className="eyebrow">
              <span>{localeText(locale, "Partner search", "সঙ্গী খোঁজার সার্চ")}</span>
              <span>{localeText(locale, "Verified profiles", "গোপনীয়তাসুরক্ষিত পাবলিক ডিসকভারি")}</span>
            </div>
            <h1>
              {localeText(
                locale,
                "Search verified Bangladeshi matrimony profiles.",
                "বরবধূ যেভাবে বাস্তবে ব্যবহার হয়, সেইভাবে বাংলাদেশি ম্যাট্রিমনি প্রোফাইল সার্চ করুন।",
              )}
            </h1>
            <p className="hero-copy">
              {localeText(
                locale,
                "Browse thousands of admin-verified profiles. Filter by age, religion, location, education, and more. Contact details stay private until both sides agree.",
                "এই পাবলিক সার্চে প্রাইভেট যোগাযোগের তথ্য গোপন থাকে, কিন্তু অতিথি ও পরিবার একটি বাস্তব ডিসকভারি অভিজ্ঞতা পায়: লিঙ্গ, বয়স, ধর্ম, বৈবাহিক অবস্থা, লোকেশন, কীওয়ার্ড সার্চ, ছবি ফিল্টার, এবং recent login, new signup, বা overall activity অনুযায়ী সাজানো।",
              )}
            </p>

            <div className="tag-list">
              <span className="tag tag-light">
                {directory.total.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}{" "}
                {localeText(locale, "verified profiles", "যাচাইকৃত প্রোফাইল")}
              </span>
              <span className="tag tag-light">{localeText(locale, `${rangeLabel} on this page`, `এই পেজে ${rangeLabel}`)}</span>
            </div>

            <div className="inline-actions public-home-actions">
              <Link href={localizePath("/login", locale)} className="button button-primary">
                {localeText(locale, "Log in for full search", "পূর্ণ সার্চের জন্য লগ ইন")}
              </Link>
              <Link href={localizePath("/signup", locale)} className="button button-soft">
                {localeText(locale, "Join Free", "ফ্রি রেজিস্টার করুন")}
              </Link>
            </div>
          </div>

          <aside className="dashboard-panel public-search-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">{localeText(locale, "Search filters", "সার্চ ফিল্টার")}</p>
                <h3>{localeText(locale, "Quick and advanced together", "দ্রুত ও অ্যাডভান্স একসাথে")}</h3>
              </div>
            </div>

            <PublicSearchForm
              defaults={{
                memberGender: resolvedSearchParams.memberGender,
                gender: resolvedSearchParams.gender,
                ageMin: resolvedSearchParams.ageMin,
                ageMax: resolvedSearchParams.ageMax,
                religion: resolvedSearchParams.religion,
                currentCountryCode: resolvedSearchParams.currentCountryCode,
                maritalStatus: resolvedSearchParams.maritalStatus,
                motherTongue: resolvedSearchParams.motherTongue,
                educationLevel: resolvedSearchParams.educationLevel,
                profession: resolvedSearchParams.profession,
                keyword: resolvedSearchParams.keyword,
                sortBy: resolvedSearchParams.sortBy,
                hasPhoto: resolvedSearchParams.hasPhoto,
              }}
              basePath={localizePath("/profiles", locale)}
            />
          </aside>
        </div>
      </section>

      <PublicSponsorSlot config={publicConfig} placement="profiles" locale={locale ?? undefined} />

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Result tabs", "রেজাল্ট ট্যাব")}</p>
            <h2>{localeText(locale, "Switch between new, recent, and most active.", "নতুন, সাম্প্রতিক, এবং সবচেয়ে সক্রিয়ের মধ্যে বদলান।")}</h2>
          </div>
          <p>
            {localeText(
              locale,
              "The public layer stays privacy-safe, while full contact unlocks, messaging, saved searches, and private photo access remain inside the signed-in member experience.",
              "পাবলিক স্তরটি গোপনীয়তাসুরক্ষিত থাকে, আর পূর্ণ contact unlock, messaging, saved search, এবং private photo access সাইন-ইন করা member experience-এর ভেতরে থাকে।",
            )}
          </p>
        </div>

        <div className="tag-list">
          <Link
            href={buildPublicProfileSearchHref(resolvedSearchParams, { sortBy: "recent_login", page: 1 }, locale)}
            className={`tag ${resolvedSearchParams.sortBy === "recent_login" ? "tag-highlight" : ""}`}
          >
            {localeText(locale, "Recent login", "সম্প্রতি লগ ইন")}
          </Link>
          <Link
            href={buildPublicProfileSearchHref(resolvedSearchParams, { sortBy: "most_active", page: 1 }, locale)}
            className={`tag ${resolvedSearchParams.sortBy === "most_active" ? "tag-highlight" : ""}`}
          >
            {localeText(locale, "Most active", "সবচেয়ে সক্রিয়")}
          </Link>
          <Link
            href={buildPublicProfileSearchHref(resolvedSearchParams, { sortBy: "new_signups", page: 1 }, locale)}
            className={`tag ${resolvedSearchParams.sortBy === "new_signups" ? "tag-highlight" : ""}`}
          >
            {localeText(locale, "New signups", "নতুন সাইন আপ")}
          </Link>
          {resolvedSearchParams.hasPhoto ? (
            <Link
              href={buildPublicProfileSearchHref(resolvedSearchParams, { hasPhoto: false, page: 1 }, locale)}
              className="tag tag-highlight"
            >
              {localeText(locale, "Photo only", "শুধু ছবি")}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{localeText(locale, "Search results", "সার্চ ফলাফল")}</p>
            <h2>{localeText(locale, "Real Borbodhu-style discovery, modernized.", "বরবধূ-স্টাইল ডিসকভারি, আধুনিকভাবে।")}</h2>
          </div>
          <p>
            {localeText(locale, "Showing", "দেখানো হচ্ছে")} {rangeLabel}{" "}
            {localeText(locale, "of", "মোট")}{" "}
            {directory.total.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
          </p>
        </div>

        {directory.results.length ? (
          <div className="card-grid vendor-card-grid">
            {directory.results.map((profile) => (
              <PublicProfileCard key={profile.id} profile={profile} locale={locale} compact />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {localeText(
              locale,
              "No public profiles matched this filter. Try widening the age, location, or keyword criteria.",
              "এই ফিল্টারে কোনো পাবলিক প্রোফাইল মেলেনি। বয়স, লোকেশন, বা কীওয়ার্ড কিছুটা বিস্তৃত করুন।",
            )}
          </div>
        )}

        <div className="inline-actions public-pagination">
          <Link
            href={buildPublicProfileSearchHref(
              resolvedSearchParams,
              { page: Math.max(1, directory.page - 1) },
              locale,
            )}
            className={`button button-soft${directory.page <= 1 ? " button-disabled" : ""}`}
            aria-disabled={directory.page <= 1}
          >
            {localeText(locale, "Previous", "আগের")}
          </Link>
          <span className="auth-chip">
            {localeText(locale, "Page", "পৃষ্ঠা")} {directory.page} / {totalPages}
          </span>
          <Link
            href={buildPublicProfileSearchHref(
              resolvedSearchParams,
              { page: Math.min(totalPages, directory.page + 1) },
              locale,
            )}
            className={`button button-soft${directory.page >= totalPages ? " button-disabled" : ""}`}
            aria-disabled={directory.page >= totalPages}
          >
            {localeText(locale, "Next", "পরের")}
          </Link>
        </div>
      </section>
    </main>
  );
}
