import { getApiBaseUrl } from "@/lib/api";

export type PublicCommercialConfig = {
  paymentMethods: Array<{
    key: string;
    label: string;
    currency: string;
    activation: string;
  }>;
  ads: {
    enabled: boolean;
    mode: "TEST" | "ADSENSE";
    clientId: string | null;
    placements: {
      home: boolean;
      vendors: boolean;
      wedding: boolean;
      profiles: boolean;
    };
    slots: {
      homeHeroSlotId: string | null;
      vendorsSlotId: string | null;
      weddingSlotId: string | null;
      profilesSlotId: string | null;
    };
  };
};

export type SuperAdminCommercialSettings = {
  payments: {
    amarpayEnabled: boolean;
    paypalEnabled: boolean;
    officeEnabled: boolean;
    manualEnabled: boolean;
    primaryLocalGateway: "AMARPAY";
  };
  ads: {
    enabled: boolean;
    mode: "TEST" | "ADSENSE";
    clientId: string | null;
    homeHeroSlotId: string | null;
    vendorsSlotId: string | null;
    weddingSlotId: string | null;
    profilesSlotId: string | null;
    showOnHome: boolean;
    showOnVendors: boolean;
    showOnWedding: boolean;
    showOnProfiles: boolean;
  };
};

export function getDefaultPublicCommercialConfig(): PublicCommercialConfig {
  return {
    paymentMethods: [
      {
        key: "amarpay",
        label: "AmarPay",
        currency: "BDT",
        activation: "automatic_on_success",
      },
      {
        key: "paypal",
        label: "PayPal",
        currency: "USD",
        activation: "automatic_on_success",
      },
      {
        key: "office",
        label: "Office Payment",
        currency: "BDT",
        activation: "admin_approval_required",
      },
      {
        key: "manual",
        label: "Manual Review",
        currency: "BDT",
        activation: "admin_approval_required",
      },
    ],
    ads: {
      enabled: true,
      mode: "TEST",
      clientId: null,
      placements: {
        home: true,
        vendors: true,
        wedding: true,
        profiles: false,
      },
      slots: {
        homeHeroSlotId: "TEST-HOME-HERO",
        vendorsSlotId: "TEST-VENDORS-RAIL",
        weddingSlotId: "TEST-WEDDING-RAIL",
        profilesSlotId: null,
      },
    },
  };
}

export async function getPublicCommercialConfig() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/meta/public-config`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return getDefaultPublicCommercialConfig();
    }

    return (await response.json()) as PublicCommercialConfig;
  } catch {
    return getDefaultPublicCommercialConfig();
  }
}
