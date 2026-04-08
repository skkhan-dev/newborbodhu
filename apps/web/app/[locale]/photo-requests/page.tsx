import { notFound } from "next/navigation";

import { MemberPhotoRequestsPage } from "@/components/member/member-photo-requests-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function PhotoRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedPublicLocale(locale)) notFound();
  return <MemberPhotoRequestsPage locale={locale} />;
}
