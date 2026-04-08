import type { Metadata } from "next";

import { PublicProfilesShell } from "@/components/public-profiles-shell";
import { type PublicProfileSearchParams } from "@/lib/public-profile-search";

export const metadata: Metadata = {
  title: "Search Bangladeshi Matrimony Profiles | borbodhu.com",
  description:
    "Search privacy-safe Bangladeshi matrimony profiles by gender, age, religion, marital status, location, keyword, and recent activity.",
};

export default async function PublicProfilesPage({
  searchParams,
}: {
  searchParams: Promise<PublicProfileSearchParams>;
}) {
  return <PublicProfilesShell locale={null} searchParams={await searchParams} />;
}
