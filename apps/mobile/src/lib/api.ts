import Constants from "expo-constants";

import type {
  AdminProfileReviewListResponse,
  AdminOverviewResponse,
  AuthSession,
  AuthUser,
  ConversationMessagesResponse,
  DashboardBundle,
  DiscoveryResponse,
  GhotokContactViewResponse,
  GhotokImpersonationSession,
  GhotokManagedMember,
  GhotokDashboardResponse,
  MediaUploadRequest,
  MailboxConversation,
  ManualReviewPayment,
  MemberMediaItem,
  MemberProfilePayload,
  MembershipOrder,
  MembershipPlan,
  MemberDashboardResponse,
  PhotoRequestsResponse,
  PublicProfileDirectoryResponse,
  SuperAdminOverviewResponse,
  VendorDirectoryItem,
  VendorDashboardResponse,
  WeddingProject,
} from "./types";

const defaultApiBaseUrl =
  "https://borbodhu-api-test-508740568768.asia-south1.run.app/v1";

type ExpoExtra = {
  apiBaseUrl?: string;
};

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

function resolveApiBaseUrl() {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? defaultApiBaseUrl;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (typeof payload === "object" && payload && "message" in payload) {
      throw new Error(String(payload.message));
    }

    throw new Error(typeof payload === "string" ? payload : "Request failed.");
  }

  return payload as T;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function registerMember(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "MAN" | "WOMAN";
  lookingFor: "MAN" | "WOMAN";
  preferredLocale: "EN" | "BN";
}): Promise<AuthSession> {
  return apiRequest<AuthSession>("/auth/register/member", {
    method: "POST",
    body: input,
  });
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", {
    token: accessToken,
  });
}

export async function loadDashboardBundle(
  accessToken: string,
  user: AuthUser,
): Promise<DashboardBundle> {
  const bundle: DashboardBundle = {
    member: null,
    admin: null,
    superAdmin: null,
    ghotok: null,
    vendor: null,
  };

  if (user.roles.includes("MEMBER")) {
    const [
      dashboard,
      profile,
      discovery,
      conversations,
      weddingProjects,
      vendors,
      media,
      photoRequests,
      plans,
      orders,
    ] = await Promise.all([
      apiRequest<MemberDashboardResponse>("/member-profiles/me/dashboard", {
        token: accessToken,
      }),
      apiRequest<MemberProfilePayload>("/member-profiles/me", {
        token: accessToken,
      }),
      apiRequest<DiscoveryResponse>("/member-profiles/discovery?sort=recent_login", {
        token: accessToken,
      }),
      apiRequest<MailboxConversation[]>("/mailbox/conversations", {
        token: accessToken,
      }),
      apiRequest<WeddingProject[]>("/wedding/projects/me", {
        token: accessToken,
      }),
      apiRequest<VendorDirectoryItem[]>("/vendors"),
      apiRequest<MemberMediaItem[]>("/media/member/me", {
        token: accessToken,
      }),
      apiRequest<PhotoRequestsResponse>("/member-profiles/me/photo-requests", {
        token: accessToken,
      }),
      apiRequest<MembershipPlan[]>("/billing/plans"),
      apiRequest<MembershipOrder[]>("/billing/me/orders", {
        token: accessToken,
      }),
    ]);

    bundle.member = {
      dashboard,
      profile,
      discovery,
      conversations,
      weddingProjects,
      vendors,
      media,
      photoRequests,
      plans,
      orders,
    };
  }

  if (user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN")) {
    const [overview, profileReviews, manualPayments] = await Promise.all([
      apiRequest<AdminOverviewResponse>("/admin/overview", {
        token: accessToken,
      }),
      apiRequest<AdminProfileReviewListResponse>(
        "/admin/profile-reviews?status=PENDING&page=1&pageSize=10",
        {
          token: accessToken,
        },
      ),
      apiRequest<ManualReviewPayment[]>("/admin/manual-payments", {
        token: accessToken,
      }),
    ]);

    bundle.admin = {
      overview,
      profileReviews,
      manualPayments,
    };
  }

  if (user.roles.includes("SUPER_ADMIN")) {
    bundle.superAdmin = await apiRequest<SuperAdminOverviewResponse>(
      "/super-admin/overview",
      {
        token: accessToken,
      },
    );
  }

  if (user.roles.includes("GHOTOK")) {
    const [dashboard, managedMembers, activeImpersonation, publicProfiles] = await Promise.all([
      apiRequest<GhotokDashboardResponse>("/ghotok/me/dashboard", {
        token: accessToken,
      }),
      apiRequest<GhotokManagedMember[]>("/ghotok/me/members", {
        token: accessToken,
      }),
      apiRequest<GhotokImpersonationSession | null>("/ghotok/me/impersonation", {
        token: accessToken,
      }),
      apiRequest<PublicProfileDirectoryResponse>(
        "/public/profiles?sortBy=recent_login&page=1&pageSize=12",
      ),
    ]);

    bundle.ghotok = {
      dashboard,
      managedMembers,
      activeImpersonation,
      publicProfiles,
    };
  }

  if (user.roles.includes("VENDOR")) {
    bundle.vendor = await apiRequest<VendorDashboardResponse>("/vendors/me/dashboard", {
      token: accessToken,
    });
  }

  return bundle;
}

export async function loadConversationMessages(
  accessToken: string,
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  return apiRequest<ConversationMessagesResponse>(
    `/mailbox/conversations/${conversationId}/messages`,
    {
      token: accessToken,
    },
  );
}

export async function createDirectConversation(
  accessToken: string,
  targetMemberProfileId: string,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/mailbox/conversations/direct", {
    method: "POST",
    token: accessToken,
    body: {
      targetMemberProfileId,
    },
  });
}

export async function sendConversationMessage(
  accessToken: string,
  conversationId: string,
  body: string,
) {
  return apiRequest<{ success: true }>("/mailbox/conversations/" + conversationId + "/messages", {
    method: "POST",
    token: accessToken,
    body: {
      body,
    },
  });
}

export async function markConversationRead(accessToken: string, conversationId: string) {
  return apiRequest<{ success: true }>("/mailbox/conversations/" + conversationId + "/read", {
    method: "POST",
    token: accessToken,
    body: {},
  });
}

export async function createWeddingProject(
  accessToken: string,
  input: {
    title: string;
    weddingDate?: string;
    city?: string;
    budgetBand?: string;
    guestTarget?: number;
  },
) {
  return apiRequest<WeddingProject>("/wedding/projects", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function addWeddingGuest(
  accessToken: string,
  weddingProjectId: string,
  input: {
    guestName: string;
    guestCount?: number;
    invited?: boolean;
    confirmed?: boolean;
  },
) {
  return apiRequest<{ id: string }>(`/wedding/projects/${weddingProjectId}/guests`, {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function shortlistVendor(
  accessToken: string,
  weddingProjectId: string,
  input: {
    vendorProfileId: string;
    notes?: string;
  },
) {
  return apiRequest<{ id: string }>(`/wedding/projects/${weddingProjectId}/shortlists`, {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function approveProfileReview(accessToken: string, memberProfileId: string) {
  return apiRequest<{ success: true }>(
    `/admin/profile-reviews/${memberProfileId}/approve`,
    {
      method: "POST",
      token: accessToken,
      body: {},
    },
  );
}

export async function rejectProfileReview(accessToken: string, memberProfileId: string) {
  return apiRequest<{ success: true }>(
    `/admin/profile-reviews/${memberProfileId}/reject`,
    {
      method: "POST",
      token: accessToken,
      body: {},
    },
  );
}

export async function approveManualPayment(accessToken: string, paymentId: string) {
  return apiRequest<{ success: true }>(`/admin/manual-payments/${paymentId}/approve`, {
    method: "POST",
    token: accessToken,
    body: {},
  });
}

export async function rejectManualPayment(accessToken: string, paymentId: string) {
  return apiRequest<{ success: true }>(`/admin/manual-payments/${paymentId}/reject`, {
    method: "POST",
    token: accessToken,
    body: {},
  });
}

export async function updateVendorLeadStatus(
  accessToken: string,
  leadId: string,
  status: "OPEN" | "RESPONDED" | "BOOKED" | "CLOSED_REJECTED",
) {
  return apiRequest<VendorDashboardResponse>(`/vendors/me/leads/${leadId}`, {
    method: "PATCH",
    token: accessToken,
    body: {
      status,
    },
  });
}

export async function updateVendorProfile(
  accessToken: string,
  input: {
    businessName?: string;
    categoryName?: string;
    division?: string;
    district?: string;
    area?: string;
    address?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    website?: string;
    descriptionEn?: string;
    descriptionBn?: string;
  },
) {
  return apiRequest<VendorDashboardResponse>("/vendors/me/profile", {
    method: "PATCH",
    token: accessToken,
    body: input,
  });
}

export async function createVendorPackage(
  accessToken: string,
  input: {
    nameEn: string;
    nameBn?: string;
    descriptionEn?: string;
    descriptionBn?: string;
    priceBdt: number;
    isActive?: boolean;
  },
) {
  return apiRequest<VendorDashboardResponse>("/vendors/me/packages", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function updateVendorPackage(
  accessToken: string,
  packageId: string,
  input: {
    nameEn: string;
    nameBn?: string;
    descriptionEn?: string;
    descriptionBn?: string;
    priceBdt: number;
    isActive?: boolean;
  },
) {
  return apiRequest<VendorDashboardResponse>(`/vendors/me/packages/${packageId}`, {
    method: "PATCH",
    token: accessToken,
    body: input,
  });
}

export async function updateMemberProfile(
  accessToken: string,
  input: {
    displayName?: string;
    currentCity?: string;
    currentCountryCode?: string;
    profession?: string;
    religion?: string;
    guardianPhone?: string;
    aboutMe?: string;
    familyDetails?: string;
    isProfilePublic?: boolean;
  },
) {
  return apiRequest<MemberProfilePayload>("/member-profiles/me", {
    method: "PATCH",
    token: accessToken,
    body: input,
  });
}

export async function updatePartnerPreferences(
  accessToken: string,
  input: {
    gender?: "MAN" | "WOMAN";
    ageMin?: number;
    ageMax?: number;
    aboutPartner?: string;
  },
) {
  return apiRequest<{ success: true }>("/member-profiles/me/preferences", {
    method: "PATCH",
    token: accessToken,
    body: input,
  });
}

export async function submitProfileReview(accessToken: string) {
  return apiRequest<{ success: true }>("/member-profiles/me/submit-review", {
    method: "POST",
    token: accessToken,
    body: {},
  });
}

export async function decidePhotoRequest(
  accessToken: string,
  photoRequestId: string,
  decision: "approve" | "deny",
) {
  return apiRequest<{ success: true }>(
    `/member-profiles/me/photo-requests/${photoRequestId}/decision`,
    {
      method: "POST",
      token: accessToken,
      body: {
        decision,
      },
    },
  );
}

export async function updateMemberMedia(
  accessToken: string,
  mediaId: string,
  input: {
    privacyMode?: "PUBLIC" | "PRIVATE";
    isPrimary?: boolean;
  },
) {
  return apiRequest<MemberMediaItem>(`/media/member/me/${mediaId}`, {
    method: "PATCH",
    token: accessToken,
    body: input,
  });
}

export async function createMemberMediaUploadRequest(
  accessToken: string,
  input: {
    mediaType: "PROFILE_PHOTO" | "BIODATA" | "VERIFICATION" | "OTHER";
    fileName: string;
    mimeType: string;
    privacyMode?: "PUBLIC" | "PRIVATE";
  },
) {
  return apiRequest<MediaUploadRequest>("/media/member/me/upload-request", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function registerMemberMedia(
  accessToken: string,
  input: {
    mediaType: "PROFILE_PHOTO" | "BIODATA" | "VERIFICATION" | "OTHER";
    storagePath: string;
    mimeType?: string;
    privacyMode?: "PUBLIC" | "PRIVATE";
    isPrimary?: boolean;
  },
) {
  return apiRequest<MemberMediaItem>("/media/member/me", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function createMembershipOrder(
  accessToken: string,
  input: {
    membershipPlanId: string;
    gateway: "AMARPAY" | "PAYPAL" | "OFFICE" | "MANUAL";
    couponCode?: string;
  },
) {
  return apiRequest<{
    payment: MembershipOrder;
    membership: {
      id: string;
      status: string;
      membershipPlan: {
        id: string;
        code: string;
        nameEn: string;
        durationDays: number;
      };
    };
    nextAction: string;
    checkout: {
      mode: "SIMULATED";
      provider: string;
      gateway: string;
      checkoutUrl: string;
      expiresAt: string;
    } | null;
  }>("/billing/membership-orders", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function createGhotokManagedMember(
  accessToken: string,
  input: {
    firstName: string;
    lastName?: string;
    gender: "MAN" | "WOMAN";
    lookingFor: "MAN" | "WOMAN";
    memberEmail?: string;
    memberPhone?: string;
    currentCountryCode?: string;
  },
) {
  return apiRequest<GhotokManagedMember>("/ghotok/me/members", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function startGhotokImpersonation(
  accessToken: string,
  memberProfileId: string,
  reason?: string,
) {
  return apiRequest<GhotokImpersonationSession>(
    `/ghotok/me/impersonation/${memberProfileId}/start`,
    {
      method: "POST",
      token: accessToken,
      body: reason ? { reason } : {},
    },
  );
}

export async function endGhotokImpersonation(
  accessToken: string,
  sessionId: string,
  reason?: string,
) {
  return apiRequest<GhotokImpersonationSession>(
    `/ghotok/me/impersonation/${sessionId}/end`,
    {
      method: "POST",
      token: accessToken,
      body: reason ? { reason } : {},
    },
  );
}

export async function consumeGhotokContactView(
  accessToken: string,
  sessionId: string,
  targetMemberProfileId: string,
) {
  return apiRequest<GhotokContactViewResponse>(
    `/ghotok/me/impersonation/${sessionId}/contact-view/${targetMemberProfileId}`,
    {
      method: "POST",
      token: accessToken,
      body: {},
    },
  );
}
