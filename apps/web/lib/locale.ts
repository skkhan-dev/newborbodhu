export const SUPPORTED_PUBLIC_LOCALES = ["en", "bn"] as const;

export type PublicLocale = (typeof SUPPORTED_PUBLIC_LOCALES)[number];

const LOCALIZABLE_PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/signup/vendor",
  "/checkout/simulate",
  "/dashboard",
  "/profiles",
  "/vendors",
  "/ghotok",
  "/wedding-planning",
  "/matrimony",
] as const;

export function isSupportedPublicLocale(value: string): value is PublicLocale {
  return SUPPORTED_PUBLIC_LOCALES.includes(value as PublicLocale);
}

export function getLocaleFromPathname(pathname: string | null): PublicLocale | null {
  if (!pathname) {
    return null;
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }

  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    return "bn";
  }

  return null;
}

export function localizePath(path: string, locale: PublicLocale | null) {
  if (!locale) {
    return path;
  }

  if (path === "/") {
    return `/${locale}`;
  }

  if (
    LOCALIZABLE_PUBLIC_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    )
  ) {
    return `/${locale}${path}`;
  }

  return path;
}

export function toggleLocalePath(pathname: string, nextLocale: PublicLocale) {
  if (pathname === "/en" || pathname === "/bn") {
    return `/${nextLocale}`;
  }

  if (pathname.startsWith("/en/") || pathname.startsWith("/bn/")) {
    return `/${nextLocale}${pathname.slice(3)}`;
  }

  if (
    LOCALIZABLE_PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return `/${nextLocale}${pathname}`;
  }

  return `/${nextLocale}`;
}
