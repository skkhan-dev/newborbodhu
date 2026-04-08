export type CommercialSettings = {
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

export const COMMERCIAL_SETTINGS_KEY = "COMMERCIAL_SETTINGS";

export function getDefaultCommercialSettings(): CommercialSettings {
  return {
    payments: {
      amarpayEnabled: true,
      paypalEnabled: true,
      officeEnabled: true,
      manualEnabled: true,
      primaryLocalGateway: "AMARPAY",
    },
    ads: {
      enabled: true,
      mode: "TEST",
      clientId: null,
      homeHeroSlotId: "TEST-HOME-HERO",
      vendorsSlotId: "TEST-VENDORS-RAIL",
      weddingSlotId: "TEST-WEDDING-RAIL",
      profilesSlotId: null,
      showOnHome: true,
      showOnVendors: true,
      showOnWedding: true,
      showOnProfiles: false,
    },
  };
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function normalizeCommercialSettings(
  input?: Partial<CommercialSettings> | null,
): CommercialSettings {
  const defaults = getDefaultCommercialSettings();

  return {
    payments: {
      amarpayEnabled: input?.payments?.amarpayEnabled ?? defaults.payments.amarpayEnabled,
      paypalEnabled: input?.payments?.paypalEnabled ?? defaults.payments.paypalEnabled,
      officeEnabled: input?.payments?.officeEnabled ?? defaults.payments.officeEnabled,
      manualEnabled: input?.payments?.manualEnabled ?? defaults.payments.manualEnabled,
      primaryLocalGateway: "AMARPAY",
    },
    ads: {
      enabled: input?.ads?.enabled ?? defaults.ads.enabled,
      mode: input?.ads?.mode === "ADSENSE" ? "ADSENSE" : defaults.ads.mode,
      clientId: cleanOptionalText(input?.ads?.clientId) ?? defaults.ads.clientId,
      homeHeroSlotId:
        cleanOptionalText(input?.ads?.homeHeroSlotId) ?? defaults.ads.homeHeroSlotId,
      vendorsSlotId:
        cleanOptionalText(input?.ads?.vendorsSlotId) ?? defaults.ads.vendorsSlotId,
      weddingSlotId:
        cleanOptionalText(input?.ads?.weddingSlotId) ?? defaults.ads.weddingSlotId,
      profilesSlotId:
        cleanOptionalText(input?.ads?.profilesSlotId) ?? defaults.ads.profilesSlotId,
      showOnHome: input?.ads?.showOnHome ?? defaults.ads.showOnHome,
      showOnVendors: input?.ads?.showOnVendors ?? defaults.ads.showOnVendors,
      showOnWedding: input?.ads?.showOnWedding ?? defaults.ads.showOnWedding,
      showOnProfiles: input?.ads?.showOnProfiles ?? defaults.ads.showOnProfiles,
    },
  };
}

export function toPublicCommercialConfig(settings: CommercialSettings) {
  return {
    paymentMethods: [
      settings.payments.amarpayEnabled
        ? {
            key: "amarpay",
            label: "AmarPay",
            currency: "BDT",
            activation: "automatic_on_success",
          }
        : null,
      settings.payments.paypalEnabled
        ? {
            key: "paypal",
            label: "PayPal",
            currency: "USD",
            activation: "automatic_on_success",
          }
        : null,
      settings.payments.officeEnabled
        ? {
            key: "office",
            label: "Office Payment",
            currency: "BDT",
            activation: "admin_approval_required",
          }
        : null,
      settings.payments.manualEnabled
        ? {
            key: "manual",
            label: "Manual Review",
            currency: "BDT",
            activation: "admin_approval_required",
          }
        : null,
    ].filter(Boolean),
    ads: {
      enabled: settings.ads.enabled,
      mode: settings.ads.mode,
      clientId: settings.ads.mode === "ADSENSE" ? settings.ads.clientId : null,
      placements: {
        home: settings.ads.showOnHome,
        vendors: settings.ads.showOnVendors,
        wedding: settings.ads.showOnWedding,
        profiles: settings.ads.showOnProfiles,
      },
      slots: {
        homeHeroSlotId: settings.ads.homeHeroSlotId,
        vendorsSlotId: settings.ads.vendorsSlotId,
        weddingSlotId: settings.ads.weddingSlotId,
        profilesSlotId: settings.ads.profilesSlotId,
      },
    },
  };
}
