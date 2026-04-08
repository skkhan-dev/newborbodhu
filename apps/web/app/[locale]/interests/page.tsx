import { notFound } from "next/navigation";

import { MemberInterestsPage } from "@/components/member/member-interests-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function InterestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedPublicLocale(locale)) notFound();
  return <MemberInterestsPage locale={locale} />;
}
