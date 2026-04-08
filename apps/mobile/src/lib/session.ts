import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AuthSession } from "./types";

const sessionStorageKey = "borbodhu.mobile.session";

export async function loadSession() {
  const raw = await AsyncStorage.getItem(sessionStorageKey);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as AuthSession;
}

export async function saveSession(session: AuthSession) {
  await AsyncStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(sessionStorageKey);
}
