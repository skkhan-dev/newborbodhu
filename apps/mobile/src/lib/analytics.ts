import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiRequest } from "./api";
import type { MobileLocale } from "./types";

const anonymousIdStorageKey = "borbodhu.mobile.analytics.anonymousId";
const sessionIdStorageKey = "borbodhu.mobile.analytics.sessionId";

type TrackMobileEventInput = {
  eventName: string;
  accessToken?: string;
  locale: MobileLocale;
  pagePath?: string;
  screenName?: string;
  entityType?: string;
  entityId?: string;
  metadataJson?: Record<string, unknown>;
};

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `bbm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readOrCreateStorageId(key: string) {
  const existing = await AsyncStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const nextValue = createId();
  await AsyncStorage.setItem(key, nextValue);
  return nextValue;
}

export async function trackMobileEvent(input: TrackMobileEventInput) {
  const [anonymousId, sessionId] = await Promise.all([
    readOrCreateStorageId(anonymousIdStorageKey),
    readOrCreateStorageId(sessionIdStorageKey),
  ]);

  await apiRequest<{ success: boolean }>("/analytics/events", {
    method: "POST",
    token: input.accessToken,
    body: {
      eventName: input.eventName,
      platform: "MOBILE",
      locale: input.locale === "bn" ? "BN" : "EN",
      anonymousId,
      sessionId,
      pagePath: input.pagePath,
      screenName: input.screenName,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: input.metadataJson,
    },
  }).catch(() => undefined);
}
