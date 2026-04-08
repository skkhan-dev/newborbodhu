import { notFound } from "next/navigation";

import { MultiStepSignup } from "@/components/multi-step-signup";
import { localizePath, SUPPORTED_PUBLIC_LOCALES, isSupportedPublicLocale } from "@/lib/locale";

export function generateStaticParams() {
  return SUPPORTED_PUBLIC_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalizedSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return <MultiStepSignup redirectTo={localizePath("/dashboard", locale)} />;
}
