import { PublicSponsorSlot } from "@/components/public-sponsor-slot";
import {
  VendorsPageClient,
  type VendorDirectoryItem,
} from "@/components/vendors-page-client";
import { getApiBaseUrl } from "@/lib/api";
import { getPublicCommercialConfig } from "@/lib/commercial";

async function getInitialVendors() {
  const response = await fetch(`${getApiBaseUrl()}/vendors`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [] as VendorDirectoryItem[];
  }

  return (await response.json()) as VendorDirectoryItem[];
}

export default async function VendorsPage() {
  const initialVendors = await getInitialVendors();
  const publicConfig = await getPublicCommercialConfig();

  return (
    <main className="page-shell">
      <VendorsPageClient initialVendors={initialVendors} />
      <PublicSponsorSlot config={publicConfig} placement="vendors" />
    </main>
  );
}
