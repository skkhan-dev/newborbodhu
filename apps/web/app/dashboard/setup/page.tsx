import type { Metadata } from "next";

import { DashboardSetupWizard } from "@/components/dashboard-setup-wizard";

export const metadata: Metadata = {
  title: "Complete Your Profile | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function DashboardSetupPage() {
  return <DashboardSetupWizard />;
}
