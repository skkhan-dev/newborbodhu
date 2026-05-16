import { getApiBaseUrl } from "@/lib/api";
import { localizePath, type PublicLocale } from "@/lib/locale";

export type PublicProfileSearchSortKey =
  | "recent_login"
  | "new_signups"
  | "most_active";

export type PublicProfileDirectoryItem = {
  id: string;
  displayId: string;
  publicName: string;
  age: number | null;
  gender: string;
  lookingFor: string | null;
  maritalStatus: string | null;
  religion: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  profession: string | null;
  designation: string | null;
  currentCity: string | null;
  currentCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  homeCountryCode: string | null;
  familyInvolvementLevel: string | null;
  preferredLocale: string;
  profileCompletionPct: number;
  primaryPhotoUrl: string | null;
  publicHeadline: string;
  publicSummary: string;
  seoDescription: string;
  lastLoginAt: string | null;
};

export type PublicProfileDirectoryResponse = {
  total: number;
  page: number;
  pageSize: number;
  results: PublicProfileDirectoryItem[];
};

export type PublicProfileSearchParams = {
  memberGender?: string;
  gender?: string;
  religion?: string;
  currentCountryCode?: string;
  ageMin?: string;
  ageMax?: string;
  motherTongue?: string;
  maritalStatus?: string;
  keyword?: string;
  educationLevel?: string;
  profession?: string;
  hasPhoto?: string;
  sortBy?: string;
  page?: string;
};

export type NormalizedPublicProfileSearchParams = {
  memberGender: "MAN" | "WOMAN";
  gender: "MAN" | "WOMAN";
  religion: string;
  currentCountryCode: string;
  ageMin: string;
  ageMax: string;
  motherTongue: string;
  maritalStatus: string;
  keyword: string;
  educationLevel: string;
  profession: string;
  hasPhoto: boolean;
  sortBy: PublicProfileSearchSortKey;
  page: number;
};

export function normalizePublicProfileSearchParams(
  searchParams: PublicProfileSearchParams,
): NormalizedPublicProfileSearchParams {
  const memberGender =
    searchParams.memberGender === "WOMAN" ? "WOMAN" : "MAN";
  const gender =
    searchParams.gender === "MAN" || searchParams.gender === "WOMAN"
      ? searchParams.gender
      : memberGender === "MAN"
        ? "WOMAN"
        : "MAN";
  const sortBy: PublicProfileSearchSortKey =
    searchParams.sortBy === "new_signups" ||
    searchParams.sortBy === "most_active" ||
    searchParams.sortBy === "recent_login"
      ? searchParams.sortBy
      : "recent_login";
  const pageValue = Number(searchParams.page ?? "1");

  return {
    memberGender,
    gender,
    religion: searchParams.religion?.trim() ?? "",
    currentCountryCode: searchParams.currentCountryCode?.trim().toUpperCase() ?? "",
    ageMin: searchParams.ageMin?.trim() ?? "",
    ageMax: searchParams.ageMax?.trim() ?? "",
    motherTongue: searchParams.motherTongue?.trim() ?? "",
    maritalStatus: searchParams.maritalStatus?.trim() ?? "",
    keyword: searchParams.keyword?.trim() ?? "",
    educationLevel: searchParams.educationLevel?.trim() ?? "",
    profession: searchParams.profession?.trim() ?? "",
    hasPhoto:
      searchParams.hasPhoto === "1" || searchParams.hasPhoto === "true",
    sortBy,
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function buildPublicProfileSearchHref(
  current: NormalizedPublicProfileSearchParams,
  updates: Partial<PublicProfileSearchParams | NormalizedPublicProfileSearchParams>,
  locale: PublicLocale | null,
) {
  const next = {
    ...current,
    ...updates,
  };
  const params = new URLSearchParams();

  params.set("memberGender", next.memberGender);
  params.set("gender", next.gender);

  if (next.religion) {
    params.set("religion", next.religion);
  }

  if (next.currentCountryCode) {
    params.set("currentCountryCode", next.currentCountryCode);
  }

  if (next.ageMin) {
    params.set("ageMin", String(next.ageMin));
  }

  if (next.ageMax) {
    params.set("ageMax", String(next.ageMax));
  }

  if (next.motherTongue) {
    params.set("motherTongue", next.motherTongue);
  }

  if (next.maritalStatus) {
    params.set("maritalStatus", next.maritalStatus);
  }

  if (next.keyword) {
    params.set("keyword", next.keyword);
  }

  if (next.hasPhoto) {
    params.set("hasPhoto", "1");
  }

  if (next.sortBy !== "recent_login") {
    params.set("sortBy", next.sortBy);
  }

  if (Number(next.page) > 1) {
    params.set("page", String(next.page));
  }

  const basePath = localizePath("/profiles", locale);
  return `${basePath}?${params.toString()}`;
}

export async function getPublicProfiles(
  searchParams: NormalizedPublicProfileSearchParams,
  pageSize = 12,
  options?: {
    includeTotal?: boolean;
    revalidateSeconds?: number;
  },
) {
  const params = new URLSearchParams();

  if (searchParams.gender) {
    params.set("gender", searchParams.gender);
  }

  if (searchParams.religion) {
    params.set("religion", searchParams.religion);
  }

  if (searchParams.currentCountryCode) {
    params.set("currentCountryCode", searchParams.currentCountryCode);
  }

  if (searchParams.ageMin) {
    params.set("ageMin", searchParams.ageMin);
  }

  if (searchParams.ageMax) {
    params.set("ageMax", searchParams.ageMax);
  }

  if (searchParams.motherTongue) {
    params.set("motherTongue", searchParams.motherTongue);
  }

  if (searchParams.maritalStatus) {
    params.set("maritalStatus", searchParams.maritalStatus);
  }

  if (searchParams.keyword) {
    params.set("keyword", searchParams.keyword);
  }

  if (searchParams.educationLevel) {
    params.set("educationLevel", searchParams.educationLevel);
  }

  if (searchParams.profession) {
    params.set("profession", searchParams.profession);
  }

  if (searchParams.hasPhoto) {
    params.set("hasPhoto", "true");
  }

  if (searchParams.sortBy) {
    params.set("sortBy", searchParams.sortBy);
  }
  if (searchParams.page) {
    params.set("page", String(searchParams.page));
  }
  params.set("pageSize", String(pageSize));
  if (options?.includeTotal === false) {
    params.set("includeTotal", "false");
  }

  const response = await fetch(`${getApiBaseUrl()}/public/profiles?${params.toString()}`, {
    next: {
      revalidate: options?.revalidateSeconds ?? 60,
    },
  });

  if (!response.ok) {
    throw new Error("Public profiles could not be loaded.");
  }

  return (await response.json()) as PublicProfileDirectoryResponse;
}
