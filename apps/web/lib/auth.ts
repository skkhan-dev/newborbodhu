export const AUTH_TOKEN_STORAGE_KEY = "borbodhu.test.access-token";

export type RoleKey =
  | "MEMBER"
  | "GHOTOK"
  | "VENDOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type LocaleKey = "EN" | "BN";

export type AuthUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  preferredLocale: LocaleKey;
  status: string;
  roles: RoleKey[];
  memberProfile: {
    id: string;
    displayId: string;
    status: string;
    approvalStatus: string;
  } | null;
  ghotokProfile: {
    id: string;
    displayName: string;
    status: string;
  } | null;
  vendorProfile: {
    id: string;
    slug: string;
    status: string;
  } | null;
  adminProfile: {
    id: string;
    displayName: string;
    isSuperAdmin: boolean;
    status: string;
  } | null;
};

export function readStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function persistAccessToken(accessToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
}

export function clearStoredAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function describePrimaryRole(user: AuthUser | null) {
  if (!user?.roles.length) {
    return "Guest";
  }

  if (user.roles.includes("SUPER_ADMIN")) {
    return "Super Admin";
  }

  if (user.roles.includes("ADMIN")) {
    return "Admin";
  }

  if (user.roles.includes("GHOTOK")) {
    return "Ghotok";
  }

  if (user.roles.includes("VENDOR")) {
    return "Vendor";
  }

  return "Member";
}
