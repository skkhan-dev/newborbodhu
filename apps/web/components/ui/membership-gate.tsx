"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { PublicLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

/**
 * Wraps content that requires an active paid membership.
 * Shows an upgrade CTA when the user doesn't have access.
 *
 * Usage:
 *   <MembershipGate hasAccess={membership?.contactViewEnabled}>
 *     <ContactDetails phone={profile.phone} />
 *   </MembershipGate>
 */
export function MembershipGate({
  hasAccess,
  children,
  feature = "this feature",
  locale = null,
}: {
  hasAccess: boolean;
  children: ReactNode;
  feature?: string;
  locale?: PublicLocale | null;
}) {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="membership-gate">
      <div className="membership-gate-content">
        <span className="membership-gate-icon">★</span>
        <div>
          <strong>
            {localeText(
              locale,
              `Upgrade to access ${feature}`,
              `${feature} দেখতে আপগ্রেড করুন`,
            )}
          </strong>
          <p className="hint">
            {localeText(
              locale,
              "This feature requires an active membership plan.",
              "এই ফিচারটি একটি সক্রিয় মেম্বারশিপ প্ল্যান প্রয়োজন।",
            )}
          </p>
        </div>
      </div>
      <Link
        href={localizePath("/dashboard", locale)}
        className="button button-gold"
        style={{ fontSize: 13, padding: "8px 16px" }}
      >
        {localeText(locale, "Upgrade Now", "এখনই আপগ্রেড করুন")}
      </Link>
    </div>
  );
}
