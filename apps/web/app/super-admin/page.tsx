import { redirect } from "next/navigation";

// Super Admin workspace is embedded in the main dashboard.
// SUPER_ADMIN role users see it automatically after login.
export default function SuperAdminPage() {
  redirect("/dashboard");
}
