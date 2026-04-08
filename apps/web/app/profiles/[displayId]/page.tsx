import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api";
import ProfileActionButtons from "@/components/profile-action-buttons";
import { ProfileHeroPhoto, PhotoGallery } from "@/components/photo-gallery";
import { ProfileDetailClient } from "@/components/profile-detail-client";
import { ShareProfileButton } from "@/components/share-profile-button";

const COUNTRY_MAP: Record<string, string> = {
  BD: "Bangladesh", US: "United States", GB: "United Kingdom", CA: "Canada",
  AU: "Australia", IN: "India", AE: "UAE", SA: "Saudi Arabia", MY: "Malaysia",
  SG: "Singapore", QA: "Qatar", KW: "Kuwait", OM: "Oman", BH: "Bahrain",
  IT: "Italy", DE: "Germany", FR: "France", SE: "Sweden", NO: "Norway",
  JP: "Japan", KR: "South Korea", NZ: "New Zealand", IE: "Ireland",
};
function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_MAP[code.toUpperCase()] ?? code;
}
function safeList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v): v is string => typeof v === "string" && v.trim() !== "" && v.toUpperCase() !== "NULL");
}
function safeVal(v: string | null | undefined): string | null {
  if (!v || v.trim() === "" || v.toUpperCase() === "NULL") return null;
  return v;
}

type PublicProfileDetail = {
  id: string;
  displayId: string;
  publicName: string;
  age: number | null;
  gender: string;
  lookingFor: string | null;
  maritalStatus: string | null;
  religion: string | null;
  religionSubgroup: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  profession: string | null;
  designation: string | null;
  currentCity: string | null;
  currentCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  homeCountryCode: string | null;
  familyInvolvementLevel: string | null;
  preferredLocale: string;
  profileCompletionPct: number;
  primaryPhotoUrl: string | null;
  publicHeadline: string;
  publicSummary: string;
  seoDescription: string;
  lastLoginAt: string | null;
  // Extended detail fields
  heightCm: number | null;
  heightFtIn: string | null;
  bodyType: string | null;
  complexion: string | null;
  bloodGroup: string | null;
  aboutMe: string | null;
  familyDetails: string | null;
  fatherStatus: string | null;
  motherStatus: string | null;
  brothersCount: number | null;
  sistersCount: number | null;
  profileOwnerType: string | null;
  partnerPreferences: {
    ageMin: number | null;
    ageMax: number | null;
    heightMinFtIn: string | null;
    heightMaxFtIn: string | null;
    maritalStatuses: string[] | null;
    religions: string[] | null;
    motherTongues: string[] | null;
    educationLevels: string[] | null;
    homeCountryCodes: string[] | null;
    livingCountryCodes: string[] | null;
  } | null;
  gallery: Array<{
    id: string;
    isPrimary: boolean;
    storageUrl: string | null;
  }>;
  seo: {
    title: string;
    description: string;
  };
};

async function getPublicProfile(displayId: string) {
  const response = await fetch(`${getApiBaseUrl()}/public/profiles/${displayId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Public profile could not be loaded.");
  }

  return (await response.json()) as PublicProfileDetail;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ displayId: string }>;
}): Promise<Metadata> {
  const { displayId } = await params;

  try {
    const profile = await getPublicProfile(displayId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://borbodhu.com";
    const profileUrl = `${siteUrl}/profiles/${profile.displayId}`;

    return {
      title: profile.seo.title.replace(/ \| borbodhu\.com$/i, ""),
      description: profile.seo.description,
      alternates: {
        canonical: `/profiles/${profile.displayId}`,
        languages: {
          en: `/en/profiles/${profile.displayId}`,
          bn: `/bn/profiles/${profile.displayId}`,
        },
      },
      openGraph: {
        title: profile.seo.title,
        description: profile.seo.description,
        url: profileUrl,
        type: "profile",
        ...(profile.primaryPhotoUrl ? { images: [{ url: profile.primaryPhotoUrl }] } : {}),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Public Matrimony Profile | borbodhu.com",
    };
  }
}

export default async function PublicProfileDetailPage({
  params,
}: {
  params: Promise<{ displayId: string }>;
}) {
  const { displayId } = await params;
  const profile = await getPublicProfile(displayId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://borbodhu.com";
  const profileUrl = `${siteUrl}/profiles/${profile.displayId}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: profile.seo.title,
      description: profile.seo.description,
      url: profileUrl,
      mainEntity: {
        "@type": "Person",
        name: profile.publicName,
        gender: profile.gender === "MAN" ? "Male" : "Female",
        description: profile.seo.description,
        url: profileUrl,
        image: profile.primaryPhotoUrl ?? undefined,
        ...(profile.age ? { birthDate: `${new Date().getFullYear() - profile.age}` } : {}),
        ...(profile.profession ? { jobTitle: profile.profession } : {}),
        ...(profile.heightFtIn ? { height: profile.heightFtIn } : {}),
        ...(profile.educationLevel ? { alumniOf: profile.educationLevel } : {}),
        homeLocation: {
          "@type": "Place",
          name:
            [profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ") ||
            [profile.homeDistrict, profile.homeCountryCode].filter(Boolean).join(", ") ||
            "Bangladesh",
        },
        knowsLanguage: profile.motherTongue ?? undefined,
        nationality: { "@type": "Country", name: "Bangladesh" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Profiles", item: `${siteUrl}/profiles` },
        { "@type": "ListItem", position: 3, name: profile.publicName, item: profileUrl },
      ],
    },
  ];

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card hero-card-compact">
          <div className="eyebrow">
            <span>Public profile summary</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ShareProfileButton displayId={profile.displayId} name={profile.publicName} compact />
              <span>{profile.displayId}</span>
            </div>
          </div>
          <div className="profile-hero-layout">
            <ProfileHeroPhoto
              photoUrl={profile.primaryPhotoUrl}
              name={profile.publicName}
              displayId={profile.displayId}
              galleryCount={profile.gallery.filter(g => g.storageUrl).length}
            />
            <div>
              <h1>{profile.publicName}</h1>
              <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 8px", fontSize: "0.95rem" }}>
                {[
                  profile.age ? `${profile.age} years` : null,
                  profile.heightFtIn,
                  profile.maritalStatus,
                  profile.religion,
                ].filter(Boolean).join(" • ")}
              </p>
              {profile.aboutMe && <p className="hero-copy">{profile.aboutMe}</p>}
              {!profile.aboutMe && profile.publicSummary && <p className="hero-copy">{profile.publicSummary}</p>}
              <div className="tag-list">
                {profile.profession && <span className="tag tag-light">{profile.profession}</span>}
                {profile.educationLevel && <span className="tag tag-light">{profile.educationLevel}</span>}
                {profile.currentCity && <span className="tag tag-light">{[profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ")}</span>}
              </div>
              {profile.lastLoginAt && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", margin: "8px 0 0" }}>
                  Last active: {new Date(profile.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <ProfileActionButtons displayId={profile.displayId} />
            </div>
          </div>
        </div>
      </section>

      <ProfileDetailClient
        displayId={profile.displayId}
        publicProfile={{
          id: profile.id,
          publicName: profile.publicName,
          displayId: profile.displayId,
          primaryPhotoUrl: profile.primaryPhotoUrl,
        }}
      />

      <section className="split-layout">
        <article className="feature-panel">
          <p className="section-kicker">Profile Details</p>
          <h2>Verified member information.</h2>
          <div className="stack-list">
            {/* Personal */}
            <div className="summary-card">
              <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Personal Information</p>
              <div className="detail-columns">
                <div>
                  <div className="summary-row"><span>Gender</span><strong>{profile.gender === "MAN" ? "Man" : "Woman"}</strong></div>
                  {profile.age != null && <div className="summary-row"><span>Age</span><strong>{profile.age} years</strong></div>}
                  {profile.maritalStatus && <div className="summary-row"><span>Marital status</span><strong>{profile.maritalStatus}</strong></div>}
                </div>
                <div>
                  <div className="summary-row"><span>Looking for</span><strong>{
                    profile.lookingFor === "MAN" || profile.lookingFor === "Man" ? "Man"
                    : profile.lookingFor === "WOMAN" || profile.lookingFor === "Woman" ? "Woman"
                    : profile.lookingFor
                      ? profile.lookingFor
                      : profile.gender === "MAN" || profile.gender === "Man" ? "Woman"
                      : profile.gender === "WOMAN" || profile.gender === "Woman" ? "Man"
                      : "—"
                  }</strong></div>
                  {profile.profileOwnerType && <div className="summary-row"><span>Profile created by</span><strong>{profile.profileOwnerType === "SELF" ? "Self" : profile.profileOwnerType}</strong></div>}
                </div>
              </div>
            </div>

            {/* Physical Attributes */}
            {(profile.heightFtIn || profile.bodyType || profile.complexion || profile.bloodGroup) && (
              <div className="summary-card">
                <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Physical Attributes</p>
                <div className="detail-columns">
                  <div>
                    {profile.heightFtIn && <div className="summary-row"><span>Height</span><strong>{profile.heightFtIn}{profile.heightCm ? ` (${profile.heightCm} cm)` : ""}</strong></div>}
                    {profile.bodyType && <div className="summary-row"><span>Body type</span><strong>{profile.bodyType}</strong></div>}
                  </div>
                  <div>
                    {profile.complexion && <div className="summary-row"><span>Complexion</span><strong>{profile.complexion}</strong></div>}
                    {profile.bloodGroup && <div className="summary-row"><span>Blood group</span><strong>{profile.bloodGroup}</strong></div>}
                  </div>
                </div>
              </div>
            )}

            {/* Religion & Community */}
            <div className="summary-card">
              <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Religion &amp; Community</p>
              <div className="detail-columns">
                <div>
                  <div className="summary-row"><span>Religion</span><strong>{profile.religion ?? "—"}</strong></div>
                  {profile.religionSubgroup && <div className="summary-row"><span>Sect</span><strong>{profile.religionSubgroup}</strong></div>}
                </div>
                <div>
                  {profile.motherTongue && <div className="summary-row"><span>Mother tongue</span><strong>{profile.motherTongue}</strong></div>}
                  {profile.familyInvolvementLevel && <div className="summary-row"><span>Family values</span><strong>{profile.familyInvolvementLevel}</strong></div>}
                </div>
              </div>
            </div>

            {/* Education & Career */}
            <div className="summary-card">
              <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Education &amp; Career</p>
              <div className="detail-columns">
                <div>
                  <div className="summary-row"><span>Education</span><strong>{profile.educationLevel ?? "—"}</strong></div>
                  {profile.designation && <div className="summary-row"><span>Designation</span><strong>{profile.designation}</strong></div>}
                </div>
                <div>
                  <div className="summary-row"><span>Profession</span><strong>{profile.profession ?? "—"}</strong></div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="summary-card">
              <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Location</p>
              <div className="detail-columns">
                <div>
                  <div className="summary-row"><span>Living in</span><strong>{[profile.currentCity, countryName(profile.currentCountryCode)].filter(Boolean).join(", ") || "—"}</strong></div>
                  {profile.homeDistrict && <div className="summary-row"><span>Home district</span><strong>{profile.homeDistrict}</strong></div>}
                </div>
                <div>
                  {profile.homeCountryCode && <div className="summary-row"><span>Home country</span><strong>{countryName(profile.homeCountryCode)}</strong></div>}
                </div>
              </div>
            </div>

            {/* Family */}
            {(profile.fatherStatus || profile.motherStatus || profile.brothersCount != null || profile.sistersCount != null || profile.familyDetails) && (
              <div className="summary-card">
                <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>Family</p>
                <div className="detail-columns">
                  <div>
                    {profile.fatherStatus && <div className="summary-row"><span>Father</span><strong>{profile.fatherStatus}</strong></div>}
                    {profile.brothersCount != null && <div className="summary-row"><span>Brother(s)</span><strong>{profile.brothersCount}</strong></div>}
                  </div>
                  <div>
                    {profile.motherStatus && <div className="summary-row"><span>Mother</span><strong>{profile.motherStatus}</strong></div>}
                    {profile.sistersCount != null && <div className="summary-row"><span>Sister(s)</span><strong>{profile.sistersCount}</strong></div>}
                  </div>
                </div>
                {profile.familyDetails && (
                  <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, marginTop: 8 }}>{profile.familyDetails}</p>
                )}
              </div>
            )}

            {/* About Me */}
            {profile.aboutMe && (
              <div className="summary-card">
                <p className="section-kicker" style={{ marginBottom: 8, fontSize: 11 }}>About Me</p>
                <p style={{ fontSize: "0.92rem", color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>{profile.aboutMe}</p>
              </div>
            )}
          </div>
        </article>

        <article className="feature-panel tone-alt">
          {/* Partner Preferences */}
          {profile.partnerPreferences && (
            <>
              <p className="section-kicker">Partner Preferences</p>
              <h2>What this member is looking for.</h2>
              <div className="stack-list" style={{ marginBottom: 24 }}>
                <div className="summary-card">
                  {(profile.partnerPreferences.ageMin || profile.partnerPreferences.ageMax) && (
                    <div className="summary-row"><span>Age</span><strong>{profile.partnerPreferences.ageMin ?? 18} to {profile.partnerPreferences.ageMax ?? 60} years</strong></div>
                  )}
                  {profile.partnerPreferences.heightMinFtIn && (
                    <div className="summary-row"><span>Height</span><strong>{profile.partnerPreferences.heightMinFtIn} to {profile.partnerPreferences.heightMaxFtIn ?? "any"}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.religions).length > 0 && (
                    <div className="summary-row"><span>Religion</span><strong>{safeList(profile.partnerPreferences.religions).join(", ")}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.maritalStatuses).length > 0 && (
                    <div className="summary-row"><span>Marital status</span><strong>{safeList(profile.partnerPreferences.maritalStatuses).join(", ")}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.motherTongues).length > 0 && (
                    <div className="summary-row"><span>Mother tongue</span><strong>{safeList(profile.partnerPreferences.motherTongues).join(", ")}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.educationLevels).length > 0 && (
                    <div className="summary-row"><span>Education</span><strong>{safeList(profile.partnerPreferences.educationLevels).join(", ")}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.homeCountryCodes).length > 0 && (
                    <div className="summary-row"><span>Home country</span><strong>{safeList(profile.partnerPreferences.homeCountryCodes).map(c => countryName(c) ?? c).join(", ")}</strong></div>
                  )}
                  {safeList(profile.partnerPreferences.livingCountryCodes).length > 0 && (
                    <div className="summary-row"><span>Living country</span><strong>{safeList(profile.partnerPreferences.livingCountryCodes).map(c => countryName(c) ?? c).join(", ")}</strong></div>
                  )}
                </div>
              </div>
            </>
          )}

          <p className="section-kicker">Privacy</p>
          <h2>Your data stays protected.</h2>
          <ul className="feature-list">
            <li>Phone, email, and address are never shown publicly.</li>
            <li>Private photos require approval via member portal.</li>
            <li>Messaging and contact unlocks require sign-in.</li>
          </ul>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Approved public media</p>
            <p style={{ fontSize: "0.92rem", color: "var(--muted)", margin: 0 }}>Only approved public photos are shown here.</p>
          </div>
          <p>
            If this member keeps photos private or blurred, the gallery stays hidden until the
            proper access flow happens inside the member portal.
          </p>
        </div>

        <PhotoGallery items={profile.gallery} memberName={profile.publicName} />
      </section>

      <section className="cta-banner">
        <div>
          <p className="section-kicker">Continue safely</p>
          <h2>Join Borbodhu to unlock the trusted member experience.</h2>
          <p>
            Registration opens full discovery, private-photo requests, messaging rules, paid
            upgrade flows, and wedding planning with vendor shortlisting.
          </p>
        </div>
        <Link href="/signup" className="button button-primary">
          Create member account
        </Link>
      </section>

      {structuredData.map((sd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }}
        />
      ))}
    </main>
  );
}
