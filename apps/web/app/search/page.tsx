import type { Metadata } from "next";

import { MemberSearchPage } from "@/components/member/member-search-page";

export const metadata: Metadata = {
  title: "Search Profiles",
  description: "Search verified Bangladeshi matrimony profiles by age, religion, location, education, and more.",
};

export default function SearchPage() {
  return (
    <main className="page-shell">
      <MemberSearchPage />
    </main>
  );
}
