import { notFound } from "next/navigation";

import { MemberFavoritesPage } from "@/components/member/member-favorites-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedPublicLocale(locale)) notFound();
  return <MemberFavoritesPage locale={locale} />;
}
