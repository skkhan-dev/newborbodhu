import Link from "next/link";

import { localizePath, type PublicLocale } from "@/lib/locale";
import { type PublicProfileDirectoryItem } from "@/lib/public-profile-search";
import {
  localeText,
  translateGender,
  translateLookingFor,
  translateReligion,
} from "@/lib/public-page-locale";
import { ProfileCardPhoto } from "./profile-card-photo";

function translateMaritalStatus(value: string | null, locale: PublicLocale | null) {
  if (!value) return null;
  const n = value.toLowerCase();
  if (n === "never married") return localeText(locale, "Never married", "কখনও বিয়ে হয়নি");
  if (n === "divorced") return localeText(locale, "Divorced", "ডিভোর্সড");
  if (n === "widowed") return localeText(locale, "Widowed", "বিধবা/বিপত্নীক");
  return value;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function cleanPublicName(name: string, displayId: string): string {
  if (!name || /^(NULL\s*)+$/i.test(name.trim()) || name.trim() === "—") return displayId;
  // Don't show raw cuid/uuid-like IDs as names
  if (/^[a-z0-9]{20,}$/i.test(name.trim()) || /^cmn[a-z0-9]/i.test(name.trim())) return displayId;
  // Don't show generic fallback name
  if (/^borbodhu\s+member$/i.test(name.trim())) return displayId;
  return name;
}

// Deterministic background from displayId for avatar
function getAvatarGradient(displayId: string) {
  const gradients = [
    "linear-gradient(135deg, #8a3947, #c79b59)",
    "linear-gradient(135deg, #2f6f72, #5b9fa3)",
    "linear-gradient(135deg, #356757, #6bb08a)",
    "linear-gradient(135deg, #40567f, #7892c0)",
    "linear-gradient(135deg, #7a3550, #c96d90)",
    "linear-gradient(135deg, #5a4520, #c79b59)",
  ];
  const idx = displayId.charCodeAt(displayId.length - 1) % gradients.length;
  return gradients[idx];
}

type PublicProfileCardProps = {
  profile: PublicProfileDirectoryItem;
  locale: PublicLocale | null;
  compact?: boolean;
};

export function PublicProfileCard({ profile, locale, compact = false }: PublicProfileCardProps) {
  const detailHref = localizePath(`/profiles/${profile.displayId}`, locale);
  const maritalLabel = translateMaritalStatus(profile.maritalStatus ?? null, locale);
  const genderLabel = translateGender(profile.gender, locale ?? "en");
  const ageStr = profile.age ? localeText(locale, `${profile.age} yrs`, `${profile.age} বছর`) : null;

  return (
    <article className={`mini-card${compact ? "" : " mini-card-horizontal"}`}>
      {/* Photo / avatar */}
      <div className="mini-card-media-wrap">
        <ProfileCardPhoto
          photoUrl={profile.primaryPhotoUrl}
          name={profile.publicName}
          displayId={profile.displayId}
        />
        {/* Verified badge */}
        <span className="mini-card-verified-badge">✓ {localeText(locale, "Verified", "যাচাইকৃত")}</span>
      </div>

      <div className="mini-card-body">
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: "1rem", lineHeight: 1.3 }}>{titleCase(cleanPublicName(profile.publicName, profile.displayId))}</strong>
            {/^m-\d+$/.test(profile.displayId) && (
              <p className="mini-text" style={{ margin: "2px 0 0", fontSize: "0.78rem", opacity: 0.7 }}>{profile.displayId}</p>
            )}
          </div>
          {ageStr && (
            <span className="status-pill status-pill-gold" style={{ flexShrink: 0, fontSize: "0.78rem" }}>
              {ageStr}
            </span>
          )}
        </div>

        {/* Summary */}
        {profile.publicHeadline && (
          <p className="mini-text" style={{ margin: 0, lineHeight: 1.55, fontSize: "0.85rem" }}>
            {profile.publicHeadline}
          </p>
        )}

        {/* Tags */}
        <div className="tag-list" style={{ gap: 6 }}>
          <span className="tag" style={{ fontSize: "0.75rem" }}>{genderLabel}</span>
          {profile.lookingFor && (
            <span className="tag" style={{ fontSize: "0.75rem" }}>{translateLookingFor(profile.lookingFor, locale ?? "en")}</span>
          )}
          {profile.religion && (
            <span className="tag" style={{ fontSize: "0.75rem" }}>{translateReligion(profile.religion, locale ?? "en")}</span>
          )}
          {maritalLabel && (
            <span className="tag" style={{ fontSize: "0.75rem" }}>{maritalLabel}</span>
          )}
          {profile.currentCountryCode && (
            <span className="tag" style={{ fontSize: "0.75rem" }}>
              {profile.currentCity ? `${titleCase(profile.currentCity)}, ` : ""}{profile.currentCountryCode}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Link href={detailHref} className="button button-primary" style={{ flex: 1, justifyContent: "center", fontSize: "0.82rem", padding: "10px 14px" }}>
            {localeText(locale, "View profile", "প্রোফাইল দেখুন")}
          </Link>
          <Link href={localizePath("/signup", locale)} className="button button-soft" style={{ fontSize: "0.82rem", padding: "10px 14px" }}>
            {localeText(locale, "Connect", "যোগাযোগ")}
          </Link>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Check this profile on Borbodhu: https://borbodhu.com/profiles/${profile.displayId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", fontSize: "0.75rem", color: "var(--muted)", marginTop: 4, textDecoration: "none" }}
        >
          {localeText(locale, "Share with family", "পরিবারের সাথে শেয়ার করুন")}
        </a>
      </div>
    </article>
  );
}
