import { LocaleKey, RoleKey, UserStatus } from "@prisma/client";

export type AuthActor = {
  userId: string;
  email: string;
  preferredLocale: LocaleKey;
  status: UserStatus;
  roles: RoleKey[];
  memberProfileId?: string | null;
  ghotokProfileId?: string | null;
  vendorProfileId?: string | null;
  adminUserId?: string | null;
  isSuperAdmin: boolean;
};
