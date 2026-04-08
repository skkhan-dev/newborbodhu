import { notFound } from "next/navigation";

import { SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";
import HowItWorksPage from "@/app/how-it-works/page";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedHowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return <HowItWorksPage />;
}
