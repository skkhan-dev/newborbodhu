import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

export function formatDate(value: string | null, locale: PublicLocale | null = null) {
  if (!value) {
    return localeText(locale, "Not available", "উপলব্ধ নয়");
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null, locale: PublicLocale | null = null) {
  if (!value) {
    return localeText(locale, "Not available", "উপলব্ধ নয়");
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toCommaString(values: string[] | null | undefined) {
  return values?.join(", ") ?? "";
}

export function toStringValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
