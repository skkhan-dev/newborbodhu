import type { Metadata } from "next";

import { AdminLoginGate } from "@/components/admin-login-gate";

export const metadata: Metadata = {
  title: "Admin | borbodhu.com",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminLoginGate />;
}
