export type MobileLocale = "en" | "bn";

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type MemberDashboardResponse = {
  profile: {
    id: string;
    displayId: string;
    displayName: string;
    firstName: string;
    lastName: string | null;
    status: string;
    approvalStatus: string;
    gender: string;
    lookingFor: string;
    currentCity: string | null;
    currentCountryCode: string | null;
    religion: string | null;
    profession: string | null;
    profileCompletionPct: number;
    user: {
      email: string;
      lastLoginAt: string | null;
    };
  };
  activity: {
    receivedInterests: number;
    receivedFavorites: number;
    profileVisits: number;
    pendingPhotoRequests: number;
  };
};

export type PartnerPreferencePayload = {
  id: string;
  memberProfileId: string;
  gender: string | null;
  ageMin: number | null;
  ageMax: number | null;
  heightMinCm: number | null;
  heightMaxCm: number | null;
  maritalStatuses: string[];
  religions: string[];
  motherTongues: string[];
  educationLevels: string[];
  professions: string[];
  homeCountryCodes: string[];
  livingCountryCodes: string[];
  aboutPartner: string | null;
};

export type MemberProfilePayload = {
  id: string;
  displayId: string;
  status: string;
  approvalStatus: string;
  profileOwnerType: string;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  gender: string;
  lookingFor: string;
  birthDate: string | null;
  maritalStatus: string | null;
  childrenStatus: string | null;
  heightCm: number | null;
  religion: string | null;
  religionSubgroup: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  educationMajor: string | null;
  profession: string | null;
  designation: string | null;
  annualIncomeBand: string | null;
  currentCountryCode: string | null;
  currentCity: string | null;
  homeCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  familyDetails: string | null;
  aboutMe: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  familyInvolvementLevel: string | null;
  isProfilePublic: boolean;
  profileCompletionPct: number;
  primaryPhoto: string | null;
  primaryPhotoUrl: string | null;
  user: {
    id: string;
    email: string;
    preferredLocale: string;
    lastLoginAt: string | null;
  };
  partnerPreference: PartnerPreferencePayload | null;
};

export type DiscoveryResponse = {
  total: number;
  results: Array<{
    id: string;
    displayId: string;
    displayName: string;
    gender: string;
    religion: string | null;
    profession: string | null;
    currentCity: string | null;
    currentCountryCode: string | null;
  }>;
};

export type PublicProfileDirectoryResponse = {
  total: number;
  page: number;
  pageSize: number;
  results: Array<{
    id: string;
    displayId: string;
    publicName: string;
    age: number | null;
    gender: string;
    lookingFor: string | null;
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
    publicSummary: string | null;
    seoDescription: string;
    lastLoginAt: string | null;
  }>;
};

export type MailboxConversation = {
  id: string;
  type: string;
  updatedAt: string;
  counterpart: {
    userId: string;
    email: string;
    memberProfile: {
      id: string;
      displayId: string;
      displayName: string;
      firstName: string;
    } | null;
  } | null;
  lastMessage: {
    id: string;
    body: string;
    sentAt: string;
    senderUserId: string;
  } | null;
  lastReadMessageId: string | null;
};

export type MailboxMessage = {
  id: string;
  body: string;
  sentAt: string;
  senderUserId: string;
  senderUser: {
    id: string;
    email: string;
  };
  senderMemberProfile: {
    id: string;
    displayId: string;
    displayName: string;
    firstName: string;
  } | null;
};

export type ConversationMessagesResponse = {
  conversation: {
    id: string;
    type: string;
  };
  messages: MailboxMessage[];
};

export type WeddingProject = {
  id: string;
  title: string;
  status: string;
  weddingDate: string | null;
  city: string | null;
  budgetBand: string | null;
  guestTarget: number | null;
  guestEntries: Array<{
    id: string;
    guestName: string;
    guestCount: number;
    invited: boolean;
    confirmed: boolean;
  }>;
  shortlists: Array<{
    id: string;
    notes: string | null;
    status: string;
    vendorProfile: {
      id: string;
      businessName: string;
      slug: string;
      categoryName: string | null;
    };
  }>;
};

export type MemberMediaItem = {
  id: string;
  memberProfileId: string;
  uploadedByUserId: string | null;
  mediaType: string;
  storagePath: string | null;
  thumbnailPath: string | null;
  mimeType: string | null;
  privacyMode: string | null;
  isPrimary: boolean;
  approvalStatus: string;
  createdAt: string;
  storageUrl: string | null;
  thumbnailUrl: string | null;
};

export type MediaUploadRequest = {
  bucketName: string;
  storagePath: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
  visibility: "private" | "public";
  publicUrl: string | null;
};

export type PhotoRequestsResponse = {
  incoming: Array<{
    id: string;
    status: string;
    decisionReason: string | null;
    createdAt: string;
    requesterMemberProfile: {
      id: string;
      displayId: string;
      displayName: string | null;
      firstName: string;
    };
  }>;
  outgoing: Array<{
    id: string;
    status: string;
    decisionReason: string | null;
    createdAt: string;
    ownerMemberProfile: {
      id: string;
      displayId: string;
      displayName: string | null;
      firstName: string;
    };
  }>;
};

export type MembershipPlan = {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string | null;
  durationDays: number;
  bdtPrice: number;
  usdPrice: number;
  contactLimit: number;
  messageEnabled: boolean;
  contactViewEnabled: boolean;
  highlightEnabled: boolean;
  supportTier: string | null;
};

export type MembershipOrder = {
  id: string;
  user?: {
    id: string;
    email: string;
  };
  paymentForType: string;
  gateway: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  paymentItems?: Array<{
    id: string;
    quantity: number;
    description: string;
  }>;
  couponRedemptions?: Array<{
    code: string;
    discountAmount: number;
  }>;
};

export type VendorDirectoryItem = {
  id: string;
  businessName: string;
  slug: string;
  categoryName: string | null;
  division: string | null;
  district: string | null;
  area: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
  logoPath: string | null;
  packages: Array<{
    id: string;
    nameEn: string;
    nameBn: string | null;
    priceBdt: number;
  }>;
};

export type AdminOverviewResponse = {
  profiles: {
    active: number;
    pending: number;
    rejected: number;
    cancelled: number;
  };
  payments: {
    pendingManualReview: number;
    collectedAmount: number;
  };
};

export type AdminProfileReviewListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string;
    displayId: string;
    displayName: string;
    firstName: string;
    lastName: string | null;
    gender: string;
    lookingFor: string;
    approvalStatus: string;
    status: string;
    currentCity: string | null;
    currentCountryCode: string | null;
    profession: string | null;
    profileCompletionPct: number;
    user: {
      id: string;
      email: string;
      createdAt: string;
    };
    media: Array<{
      id: string;
      storageUrl: string | null;
      thumbnailUrl: string | null;
      privacyMode: string | null;
    }>;
  }>;
};

export type ManualReviewPayment = {
  id: string;
  user?: {
    id: string;
    email: string;
  };
  paymentForType: string;
  gateway: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  paymentItems?: Array<{
    id: string;
    quantity: number;
    description: string;
  }>;
};

export type SuperAdminOverviewResponse = {
  people: {
    admins: number;
    superAdmins: number;
    members: number;
    ghotoks: number;
    vendors: number;
  };
  queues: {
    pendingProfiles: number;
    pendingVendors: number;
    pendingGhotoks: number;
    manualPayments: number;
  };
  catalog: {
    membershipPlans: number;
    activeCoupons: number;
  };
  revenue: {
    totalCollected: number;
    todayCollected: number;
    monthCollected: number;
    yearCollected: number;
  };
};

export type GhotokDashboardResponse = {
  profile: {
    displayName: string;
    status: string;
    email: string;
    phone: string | null;
  };
  wallet: {
    balance: number;
  };
  managedCounts: Array<{
    status: string;
    _count: {
      status: number;
    };
  }>;
  recentLedger?: Array<{
    id: string;
    amount: number;
    entryType: string;
    notes: string | null;
    createdAt: string;
  }>;
};

export type GhotokManagedMember = {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string | null;
  displayName: string;
  gender: string;
  lookingFor: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
};

export type GhotokImpersonationSession = {
  id: string;
  memberProfileId: string;
  startedAt: string;
  endedAt: string | null;
  reason?: string | null;
  memberProfile?: {
    id: string;
    displayId: string;
    displayName: string | null;
    firstName: string;
    status?: string;
    approvalStatus?: string;
  } | null;
};

export type GhotokContactViewResponse = {
  usedCredit: boolean;
  balanceAfter?: number;
  contact: {
    displayId: string;
    guardianPhone: string | null;
    guardianEmail: string | null;
  };
};

export type VendorDashboardResponse = {
  profile: {
    id?: string;
    businessName: string;
    slug: string;
    status: string;
    billingStatus: string;
    categoryName: string | null;
    division: string | null;
    district: string | null;
    area?: string | null;
    address?: string | null;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    descriptionEn?: string | null;
    descriptionBn?: string | null;
  };
  packages: Array<{
    id: string;
    nameEn: string;
    nameBn: string | null;
    descriptionEn?: string | null;
    descriptionBn?: string | null;
    priceBdt: number;
    isActive: boolean;
  }>;
  recentLeads: Array<{
    id: string;
    status: string;
    message?: string | null;
    requesterName: string | null;
    requesterEmail: string | null;
    requesterPhone: string | null;
    source?: string;
    createdAt: string;
    memberProfile?: {
      id: string;
      displayId: string;
      displayName: string;
    } | null;
    weddingProject?: {
      id: string;
      title: string;
    } | null;
  }>;
};

export type DashboardBundle = {
  member: {
    dashboard: MemberDashboardResponse;
    profile: MemberProfilePayload;
    discovery: DiscoveryResponse | null;
    conversations: MailboxConversation[];
    weddingProjects: WeddingProject[];
    vendors: VendorDirectoryItem[];
    media: MemberMediaItem[];
    photoRequests: PhotoRequestsResponse;
    plans: MembershipPlan[];
    orders: MembershipOrder[];
  } | null;
  admin: {
    overview: AdminOverviewResponse;
    profileReviews: AdminProfileReviewListResponse;
    manualPayments: ManualReviewPayment[];
  } | null;
  superAdmin: SuperAdminOverviewResponse | null;
  ghotok: {
    dashboard: GhotokDashboardResponse;
    managedMembers: GhotokManagedMember[];
    activeImpersonation: GhotokImpersonationSession | null;
    publicProfiles: PublicProfileDirectoryResponse;
  } | null;
  vendor: VendorDashboardResponse | null;
};
