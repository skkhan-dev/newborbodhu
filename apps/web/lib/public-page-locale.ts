import type { PublicLocale } from "@/lib/locale";

export function localeText(
  locale: PublicLocale | null,
  english: string,
  bangla: string,
) {
  return locale === "bn" ? bangla : english;
}

export function translateGender(value: string | null | undefined, locale: PublicLocale) {
  if (!value) {
    return localeText(locale, "Not shared", "শেয়ার করা হয়নি");
  }

  if (value === "MAN") {
    return localeText(locale, "Man", "পুরুষ");
  }

  if (value === "WOMAN") {
    return localeText(locale, "Woman", "নারী");
  }

  return value;
}

export function translateLookingFor(value: string | null | undefined, locale: PublicLocale) {
  if (!value) {
    return localeText(locale, "Shared after login", "লগ ইন করার পর দেখা যাবে");
  }

  return localeText(
    locale,
    `Looking for ${translateGender(value, locale)}`,
    `খুঁজছেন ${translateGender(value, locale)}`,
  );
}

export function translateReligion(value: string | null | undefined, locale: PublicLocale) {
  if (!value) {
    return localeText(locale, "Not shared", "শেয়ার করা হয়নি");
  }

  const translations: Record<string, string> = {
    Muslim: "মুসলিম",
    Hindu: "হিন্দু",
    Christian: "খ্রিস্টান",
    Buddhist: "বৌদ্ধ",
    Other: "অন্যান্য",
    Islam: "ইসলাম",
    Hinduism: "হিন্দুধর্ম",
    Christianity: "খ্রিস্টান",
    Buddhism: "বৌদ্ধধর্ম",
  };

  return locale === "bn" ? (translations[value] ?? value) : value;
}

export function getLocalizedCuratedCountries(locale: PublicLocale) {
  return [
    { code: "", label: localeText(locale, "All locations", "সব লোকেশন") },
    { code: "BD", label: localeText(locale, "Bangladesh", "বাংলাদেশ") },
    { code: "US", label: localeText(locale, "United States", "যুক্তরাষ্ট্র") },
    { code: "GB", label: localeText(locale, "United Kingdom", "যুক্তরাজ্য") },
    { code: "CA", label: localeText(locale, "Canada", "কানাডা") },
    { code: "AE", label: localeText(locale, "UAE", "সংযুক্ত আরব আমিরাত") },
    { code: "AU", label: localeText(locale, "Australia", "অস্ট্রেলিয়া") },
    { code: "SA", label: localeText(locale, "Saudi Arabia", "সৌদি আরব") },
    { code: "IN", label: localeText(locale, "India", "ভারত") },
    { code: "IT", label: localeText(locale, "Italy", "ইতালি") },
  ];
}

export function getLocalizedCuratedReligions(locale: PublicLocale) {
  return [
    { value: "Muslim", label: localeText(locale, "Muslim", "মুসলিম") },
    { value: "Hindu", label: localeText(locale, "Hindu", "হিন্দু") },
    { value: "Christian", label: localeText(locale, "Christian", "খ্রিস্টান") },
    { value: "Buddhist", label: localeText(locale, "Buddhist", "বৌদ্ধ") },
    { value: "Other", label: localeText(locale, "Other", "অন্যান্য") },
  ];
}
