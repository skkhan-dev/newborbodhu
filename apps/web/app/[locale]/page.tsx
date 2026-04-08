import { notFound } from "next/navigation";

import { PublicHomeShell } from "@/components/public-home-shell";
import { SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return <PublicHomeShell locale={locale} />;
}
