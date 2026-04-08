import Link from "next/link";

import type { PublicCommercialConfig } from "@/lib/commercial";
import { localizePath, type PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type SponsorPlacement = "home" | "vendors" | "wedding" | "profiles";

function getPlacementCopy(placement: SponsorPlacement, locale: PublicLocale | null) {
  switch (placement) {
    case "home":
      return {
        eyebrow: localeText(locale, "Sponsored visibility", "স্পন্সরড দৃশ্যমানতা"),
        title: localeText(
          locale,
          "A configurable growth slot for trusted wedding brands.",
          "বিশ্বস্ত ওয়েডিং ব্র্যান্ডের জন্য কনফিগারযোগ্য গ্রোথ স্লট।",
        ),
        body: localeText(
          locale,
          "Use the homepage carefully for diaspora-facing planners, venues, photographers, or high-trust wedding services without crowding the member journey.",
          "প্রবাসকেন্দ্রিক প্ল্যানার, ভেন্যু, ফটোগ্রাফার, বা উচ্চ-আস্থার ওয়েডিং সেবার জন্য হোমপেজটি সাবধানে ব্যবহার করুন, যাতে মেম্বারের যাত্রা ব্যাহত না হয়।",
        ),
        primaryHref: "/signup/vendor",
        primaryLabel: localeText(locale, "Become a featured vendor", "ফিচারড ভেন্ডর হোন"),
      };
    case "vendors":
      return {
        eyebrow: localeText(locale, "Marketplace promotion", "মার্কেটপ্লেস প্রোমোশন"),
        title: localeText(
          locale,
          "Promote premium vendor visibility where buying intent is strongest.",
          "যেখানে ক্রয়ের আগ্রহ সবচেয়ে বেশি, সেখানে প্রিমিয়াম ভেন্ডর দৃশ্যমানতা প্রচার করুন।",
        ),
        body: localeText(
          locale,
          "Vendor search pages are a safer place for sponsored discovery because members and families are already evaluating services by category and location.",
          "ভেন্ডর সার্চ পেজ স্পন্সরড ডিসকভারি জন্য বেশি নিরাপদ, কারণ মেম্বার ও পরিবার ইতিমধ্যেই ক্যাটাগরি ও লোকেশন অনুযায়ী সেবা মূল্যায়ন করছে।",
        ),
        primaryHref: "/vendors",
        primaryLabel: localeText(locale, "Explore vendor offers", "ভেন্ডর অফার দেখুন"),
      };
    case "wedding":
      return {
        eyebrow: localeText(locale, "Planning partnership", "প্ল্যানিং পার্টনারশিপ"),
        title: localeText(
          locale,
          "Highlight vendors and services that fit the wedding-planning journey.",
          "ওয়েডিং প্ল্যানিং যাত্রার সাথে মানানসই ভেন্ডর ও সেবাগুলোকে গুরুত্ব দিন।",
        ),
        body: localeText(
          locale,
          "Planning pages are ideal for contextual promotion: decor, venue, photography, invitation, transport, and event management can appear without disturbing trust-sensitive matchmaking screens.",
          "প্ল্যানিং পেজ কনটেক্সচুয়াল প্রোমোশনের জন্য আদর্শ: ডেকর, ভেন্যু, ফটোগ্রাফি, ইনভাইটেশন, ট্রান্সপোর্ট, এবং ইভেন্ট ম্যানেজমেন্ট এখানে দেখানো যায়, কিন্তু আস্থা-সংবেদনশীল ম্যাচমেকিং স্ক্রিনে বিঘ্ন না ঘটিয়ে।",
        ),
        primaryHref: "/wedding-planning",
        primaryLabel: localeText(locale, "See planning flow", "প্ল্যানিং ফ্লো দেখুন"),
      };
    case "profiles":
      return {
        eyebrow: localeText(locale, "Light-touch sponsor zone", "হালকা স্পন্সর জোন"),
        title: localeText(
          locale,
          "Keep public profile discovery trustworthy while allowing limited sponsor inventory.",
          "সীমিত স্পন্সর ইনভেন্টরি রেখে পাবলিক প্রোফাইল ডিসকভারি বিশ্বস্ত রাখুন।",
        ),
        body: localeText(
          locale,
          "If profile pages ever use sponsored inventory, keep it subtle, clearly labeled, and away from any contact or privacy-sensitive actions.",
          "প্রোফাইল পেজে যদি কখনো স্পন্সর ইনভেন্টরি ব্যবহার করা হয়, তবে সেটি হালকা, পরিষ্কারভাবে লেবেলযুক্ত, এবং যোগাযোগ বা গোপনীয়তা-সংবেদনশীল অ্যাকশনের বাইরে রাখুন।",
        ),
        primaryHref: "/signup/vendor",
        primaryLabel: localeText(locale, "Advertise carefully", "সতর্কভাবে বিজ্ঞাপন দিন"),
      };
  }
}

function getPlacementSlotId(
  config: PublicCommercialConfig,
  placement: SponsorPlacement,
) {
  switch (placement) {
    case "home":
      return config.ads.slots.homeHeroSlotId;
    case "vendors":
      return config.ads.slots.vendorsSlotId;
    case "wedding":
      return config.ads.slots.weddingSlotId;
    case "profiles":
      return config.ads.slots.profilesSlotId;
  }
}

function isPlacementEnabled(
  config: PublicCommercialConfig,
  placement: SponsorPlacement,
) {
  if (!config.ads.enabled) {
    return false;
  }

  switch (placement) {
    case "home":
      return config.ads.placements.home;
    case "vendors":
      return config.ads.placements.vendors;
    case "wedding":
      return config.ads.placements.wedding;
    case "profiles":
      return config.ads.placements.profiles;
  }
}

export function PublicSponsorSlot({
  config,
  placement,
  locale = null,
}: {
  config: PublicCommercialConfig;
  placement: SponsorPlacement;
  locale?: PublicLocale | null;
}) {
  if (!isPlacementEnabled(config, placement)) {
    return null;
  }

  // Hide placeholder when no real AdSense client is configured
  if (config.ads.mode !== "ADSENSE" || !config.ads.clientId) {
    return null;
  }

  const copy = getPlacementCopy(placement, locale);
  const slotId = getPlacementSlotId(config, placement);

  return (
    <section className={`sponsor-slot sponsor-slot-${placement}`}>
      <div className="sponsor-slot-header">
        <div>
          <p className="section-kicker">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
        </div>
        <div className="tag-list">
          <span className="tag">
            {config.ads.mode === "ADSENSE"
              ? localeText(locale, "AdSense mode", "AdSense মোড")
              : localeText(locale, "Partner slot", "পার্টনার স্লট")}
          </span>
          <span className="tag tag-light">
            {slotId ??
              localeText(locale, "Flexible slot", "ফ্লেক্সিবল স্লট")}
          </span>
        </div>
      </div>

      <p className="sponsor-copy">{copy.body}</p>

      <div className="tag-list">
        {config.paymentMethods.map((method) => (
          <span key={method.key} className="tag tag-light">
            {method.label} • {method.currency}
          </span>
        ))}
      </div>

      <div className="inline-actions">
        <Link
          href={localizePath(copy.primaryHref, locale)}
          className="button button-primary"
        >
          {copy.primaryLabel}
        </Link>
        <Link
          href={localizePath("/signup/vendor", locale)}
          className="button button-soft"
        >
          {localeText(locale, "Vendor signup", "ভেন্ডর সাইনআপ")}
        </Link>
      </div>

      <p className="hint sponsor-hint">
        {config.ads.mode === "ADSENSE" && config.ads.clientId
          ? localeText(
              locale,
              `Configured for live AdSense delivery with client ${config.ads.clientId}. Keep this inventory away from inbox, checkout, and privacy-sensitive views.`,
              `লাইভ AdSense ডেলিভারির জন্য ${config.ads.clientId} ক্লায়েন্ট দিয়ে কনফিগার করা হয়েছে। ইনবক্স, চেকআউট, এবং গোপনীয়তা-সংবেদনশীল ভিউ থেকে এই ইনভেন্টরি দূরে রাখুন।`,
            )
          : localeText(
              locale,
              "This is a review-safe sponsored placement for testing UI, business rules, and page positioning before live ad delivery.",
              "লাইভ বিজ্ঞাপন চালুর আগে UI, ব্যবসায়িক নিয়ম, এবং পেজ পজিশনিং যাচাই করার জন্য এটি একটি রিভিউ-সেইফ স্পন্সরড প্লেসমেন্ট।",
            )}
      </p>
    </section>
  );
}
