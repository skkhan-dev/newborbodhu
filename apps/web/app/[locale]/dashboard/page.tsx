import { notFound } from "next/navigation";

import { DashboardPageClient } from "@/components/dashboard-page-client";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function LocalizedDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return <DashboardPageClient locale={locale} />;
}
