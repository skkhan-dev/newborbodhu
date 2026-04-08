import type { Metadata } from "next";

import { AdminDashboardPage } from "@/components/admin/admin-dashboard-page";

export const metadata: Metadata = {
  title: "Admin Dashboard | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function AdminDashboardRoute() {
  return <AdminDashboardPage />;
}
