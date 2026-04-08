import { notFound } from "next/navigation";

import { PublicProfilesShell } from "@/components/public-profiles-shell";
import {
  SUPPORTED_PUBLIC_LOCALES,
  isSupportedPublicLocale,
} from "@/lib/locale";
import { type PublicProfileSearchParams } from "@/lib/public-profile-search";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedPublicProfilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PublicProfileSearchParams>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return (
    <PublicProfilesShell locale={locale} searchParams={await searchParams} />
  );
}
