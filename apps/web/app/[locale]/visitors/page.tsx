import { notFound } from "next/navigation";

import { MemberVisitorsPage } from "@/components/member/member-visitors-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function VisitorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedPublicLocale(locale)) notFound();
  return <MemberVisitorsPage locale={locale} />;
}
