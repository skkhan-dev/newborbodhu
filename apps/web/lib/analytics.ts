"use client";

import { getApiBaseUrl } from "@/lib/api";
import { type PublicLocale } from "@/lib/locale";

const anonymousIdStorageKey = "borbodhu.web.anonymousId";
const sessionIdStorageKey = "borbodhu.web.sessionId";

type TrackProductEventInput = {
  eventName: string;
  token?: string | null;
  locale?: PublicLocale | null;
  pagePath?: string;
  referrerPath?: string;
  screenName?: string;
  entityType?: string;
  entityId?: string;
  metadataJson?: Record<string, unknown>;
};

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `bb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreateStorageId(storage: Storage, key: string) {
  const existing = storage.getItem(key);

  if (existing) {
    return existing;
  }

  const nextValue = createId();
  storage.setItem(key, nextValue);
  return nextValue;
}

function getAnonymousId() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return readOrCreateStorageId(window.localStorage, anonymousIdStorageKey);
  } catch {
    return undefined;
  }
}

function getSessionId() {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return readOrCreateStorageId(window.sessionStorage, sessionIdStorageKey);
  } catch {
    return undefined;
  }
}

export async function trackProductEvent(input: TrackProductEventInput) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    eventName: input.eventName,
    platform: "WEB",
    locale: input.locale === "bn" ? "BN" : "EN",
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    pagePath: input.pagePath,
    referrerPath: input.referrerPath,
    screenName: input.screenName,
    entityType: input.entityType,
    entityId: input.entityId,
    metadataJson: input.metadataJson,
  });
  const url = `${getApiBaseUrl()}/analytics/events`;

  if (!input.token && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], {
      type: "application/json",
    });
    navigator.sendBeacon(url, blob);
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(input.token
        ? {
            authorization: `Bearer ${input.token}`,
          }
        : {}),
    },
    body: payload,
    keepalive: true,
    cache: "no-store",
  }).catch(() => undefined);
}
