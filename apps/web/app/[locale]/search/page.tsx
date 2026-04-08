import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MemberSearchPage } from "@/components/member/member-search-page";
import { isSupportedPublicLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Search Profiles",
  description: "Search verified Bangladeshi matrimony profiles by age, religion, location, education, and more.",
};

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedPublicLocale(locale)) {
    notFound();
  }

  return (
    <main className="page-shell">
      <MemberSearchPage locale={locale} />
    </main>
  );
}
