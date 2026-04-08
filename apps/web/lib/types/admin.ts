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
  ghotoks?: {
    active: number;
    pending: number;
  };
  vendors?: {
    active: number;
    pending: number;
  };
};

export type ManualPayment = {
  id: string;
  user: {
    id: string;
    email: string;
  };
  gateway: string;
  currency: string;
  finalAmount: number;
  status: string;
  createdAt: string;
};

export type AiModerationResult = {
  adult: string;
  violence: string;
  racy: string;
  flagged: boolean;
  checkedAt: string;
};

export type AdminProfileReviewItem = {
  id: string;
  displayId: string;
  status: string;
  approvalStatus: string;
  firstName: string;
  lastName: string | null;
  displayName: string;
  gender: string;
  lookingFor: string;
  religion: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  profession: string | null;
  currentCountryCode: string | null;
  currentCity: string | null;
  aboutMe: string | null;
  phone: string | null;
  profileCompletionPct: number;
  qualityScore: number;
  possibleDuplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  revisions: Array<{
    id: string;
    revisionNumber: number;
    reviewStatus: string | null;
    reviewNotes: string | null;
    createdAt: string;
  }>;
  media: Array<{
    id: string;
    mediaType: string;
    approvalStatus: string;
    privacyMode: string | null;
    storageUrl: string | null;
    thumbnailUrl: string | null;
    aiModerationResult: AiModerationResult | null;
  }>;
};

export type AdminProfileReviewResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminProfileReviewItem[];
};

export type AdminMemberSearchItem = {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string | null;
  displayName: string;
  gender: string;
  status: string;
  approvalStatus: string;
  profileCompletionPct: number;
  currentCountryCode: string | null;
  currentCity: string | null;
  phone: string | null;
  createdAt: string;
  primaryPhotoUrl: string | null;
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: string;
  };
};

export type AdminMemberSearchResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminMemberSearchItem[];
};

export type AuditLogItem = {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  description: string | null;
  createdAt: string;
  actorUser: { email: string } | null;
};
