import type { Metadata } from "next";

import { GhotokDashboardPage } from "@/components/ghotok/ghotok-dashboard-page";

export const metadata: Metadata = {
  title: "Ghotok Portal | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function GhotokDashboardRoute() {
  return <GhotokDashboardPage />;
}
