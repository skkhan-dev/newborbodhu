export type MemberDashboardResponse = {
  profile: {
    id: string;
    displayId: string;
    status: string;
    approvalStatus: string;
    profileOwnerType: string;
    firstName: string;
    lastName: string | null;
    displayName: string;
    gender: string;
    lookingFor: string;
    birthDate: string | null;
    maritalStatus: string | null;
    childrenStatus: string | null;
    heightCm: number | null;
    bodyType: string | null;
    complexion: string | null;
    bloodGroup: string | null;
    religion: string | null;
    religionSubgroup: string | null;
    motherTongue: string | null;
    familyValues: string | null;
    educationLevel: string | null;
    educationMajor: string | null;
    universityName: string | null;
    profession: string | null;
    designation: string | null;
    annualIncomeBand: string | null;
    currentCountryCode: string | null;
    currentCity: string | null;
    currentArea: string | null;
    residenceStatus: string | null;
    homeCountryCode: string | null;
    homeDivision: string | null;
    homeDistrict: string | null;
    fatherStatus: string | null;
    motherStatus: string | null;
    brothersCount: number | null;
    sistersCount: number | null;
    familyDetails: string | null;
    aboutMe: string | null;
    guardianName: string | null;
    guardianRelation: string | null;
    guardianPhone: string | null;
    familyInvolvementLevel: string | null;
    profileCompletionPct: number;
    primaryPhotoUrl: string | null;
    user: {
      email: string;
      preferredLocale: string;
      lastLoginAt: string | null;
    };
    partnerPreference: {
      gender: string | null;
      ageMin: number | null;
      ageMax: number | null;
      religions: string[] | null;
      motherTongues: string[] | null;
      educationLevels: string[] | null;
      professions: string[] | null;
      homeCountryCodes: string[] | null;
      livingCountryCodes: string[] | null;
      aboutPartner: string | null;
    } | null;
  };
  activity: {
    receivedInterests: number;
    receivedFavorites: number;
    profileVisits: number;
    pendingPhotoRequests: number;
  };
  membership: {
    id: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
    plan: { nameEn: string; nameBn: string | null; code: string; supportTier: string | null };
  } | null;
  assignedGhotok: {
    displayName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export type DiscoveryResponse = {
  total: number;
  results: Array<{
    id: string;
    displayId: string;
    displayName: string;
    age: number | null;
    gender: string;
    maritalStatus: string | null;
    religion: string | null;
    motherTongue: string | null;
    profession: string | null;
    educationLevel: string | null;
    currentCity: string | null;
    currentCountryCode: string | null;
    primaryPhotoUrl: string | null;
  }>;
};

export type SavedSearchItem = {
  id: string;
  name: string;
  criteriaJson: Record<string, unknown> | null;
  alertEnabled: boolean;
  updatedAt: string;
};

export type MediaItem = {
  id: string;
  mediaType: "PROFILE_PHOTO" | "BIODATA" | "DOCUMENT" | "VERIFICATION" | "VIDEO";
  storagePath: string;
  mimeType: string | null;
  privacyMode: "PUBLIC" | "PRIVATE" | "BLURRED_PUBLIC";
  isPrimary: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  storageUrl: string | null;
  thumbnailUrl: string | null;
};

export type ConversationSummary = {
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

export type ConversationMessagesResponse = {
  conversation: {
    id: string;
    type: string;
  };
  messages: Array<{
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
  }>;
};

export type MembershipPlan = {
  id: string;
  code: string;
  category?: string;
  nameEn: string;
  nameBn: string | null;
  durationDays: number;
  bdtPrice: number;
  usdPrice: number;
  contactLimit: number | null;
  messageEnabled: boolean;
  contactViewEnabled: boolean;
  highlightEnabled: boolean;
  supportTier: string | null;
};

export type MembershipPreview = {
  plan: {
    id: string;
    code: string;
    nameEn: string;
    nameBn: string | null;
    durationDays: number;
  };
  gateway: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon: {
    id: string;
    code: string;
    discountType: string;
  } | null;
  activationRule: string;
};

export type PaymentOrder = {
  id: string;
  paymentForType: string;
  gateway: string;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

export type UploadRequestResponse = {
  bucketName: string;
  storagePath: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
  visibility: string;
  publicUrl: string;
};

export type CreatedMembershipOrder = {
  payment: PaymentOrder;
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
};

export type WeddingProject = {
  id: string;
  memberProfileId: string;
  title: string;
  weddingDate: string | null;
  city: string | null;
  budgetBand: string | null;
  guestTarget: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  guestEntries: Array<{
    id: string;
    guestName: string;
    guestPhone: string | null;
    guestCount: number;
    invited: boolean;
    confirmed: boolean;
    createdAt: string;
  }>;
  shortlists: Array<{
    id: string;
    vendorProfileId: string;
    status: string;
    notes: string | null;
    createdAt: string;
    vendorProfile: {
      id: string;
      businessName: string;
      slug: string;
      categoryName: string | null;
    };
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

export type MemberProfileFormState = {
  firstName: string;
  lastName: string;
  displayName: string;
  birthDate: string;
  maritalStatus: string;
  childrenStatus: string;
  heightCm: string;
  bodyType: string;
  complexion: string;
  bloodGroup: string;
  religion: string;
  religionSubgroup: string;
  motherTongue: string;
  familyValues: string;
  educationLevel: string;
  educationMajor: string;
  universityName: string;
  profession: string;
  designation: string;
  annualIncomeBand: string;
  currentCountryCode: string;
  currentCity: string;
  currentArea: string;
  residenceStatus: string;
  homeCountryCode: string;
  homeDivision: string;
  homeDistrict: string;
  fatherStatus: string;
  motherStatus: string;
  brothersCount: string;
  sistersCount: string;
  familyDetails: string;
  aboutMe: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  familyInvolvementLevel: string;
};

export type MemberPreferenceFormState = {
  gender: string;
  ageMin: string;
  ageMax: string;
  religions: string;
  motherTongues: string;
  educationLevels: string;
  professions: string;
  homeCountryCodes: string;
  livingCountryCodes: string;
  aboutPartner: string;
};

export type MediaUploadFormState = {
  mediaType: "PROFILE_PHOTO" | "BIODATA" | "DOCUMENT" | "VERIFICATION" | "VIDEO";
  privacyMode: "PUBLIC" | "PRIVATE" | "BLURRED_PUBLIC";
  isPrimary: boolean;
};

export type BillingFormState = {
  membershipPlanId: string;
  gateway: "OFFICE" | "MANUAL" | "AMARPAY" | "PAYPAL";
  couponCode: string;
};

export type WeddingProjectFormState = {
  title: string;
  weddingDate: string;
  city: string;
  budgetBand: string;
  guestTarget: string;
};

export type WeddingGuestFormState = {
  guestName: string;
  guestPhone: string;
  guestCount: string;
  invited: boolean;
  confirmed: boolean;
};

export type VendorSearchFormState = {
  search: string;
  category: string;
  division: string;
  district: string;
};

export type DiscoverySearchFormState = {
  gender: string;
  ageMin: string;
  ageMax: string;
  religion: string;
  motherTongue: string;
  maritalStatus: string;
  currentCountryCode: string;
  keyword: string;
  hasPhoto: boolean;
  sortBy: "recent_login" | "new_signups" | "most_active";
  heightMin: string;
  heightMax: string;
  educationLevel: string;
  profession: string;
  homeCountryCode: string;
  homeDistrict: string;
};

export type MailboxConversationResponse = {
  id: string;
};

export type MembershipStatusResponse = {
  membership: {
    id: string;
    status: string;
    planName: string;
    planCode: string;
    supportTier: string | null;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
  contactsUsed: number;
  contactsRemaining: number; // -1 = unlimited
  contactLimit: number;
  canViewContacts: boolean;
  canMessage: boolean;
};

export type MemberProfileDetail = {
  id: string;
  displayId: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  lookingFor: string | null;
  age: number | null;
  birthDate: string | null;
  maritalStatus: string | null;
  heightCm: number | null;
  bodyType: string | null;
  complexion: string | null;
  bloodGroup: string | null;
  religion: string | null;
  religionSubgroup: string | null;
  motherTongue: string | null;
  familyValues: string | null;
  educationLevel: string | null;
  educationMajor: string | null;
  universityName: string | null;
  profession: string | null;
  designation: string | null;
  annualIncomeBand: string | null;
  currentCountryCode: string | null;
  currentCity: string | null;
  currentArea: string | null;
  residenceStatus: string | null;
  homeCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  aboutMe: string | null;
  familyDetails: string | null;
  fatherStatus: string | null;
  motherStatus: string | null;
  brothersCount: number | null;
  sistersCount: number | null;
  primaryPhotoUrl: string | null;
  partnerPreference: {
    gender: string | null;
    ageMin: number | null;
    ageMax: number | null;
    religions: string[] | null;
    motherTongues: string[] | null;
    aboutPartner: string | null;
  } | null;
  media: Array<{
    id: string;
    mediaType: string;
    privacyMode: string;
    isPrimary: boolean;
    approvalStatus: string;
    storageUrl: string | null;
    thumbnailUrl: string | null;
  }>;
  privatePhotoAccess: { granted: boolean; requestStatus?: string };
  contact: {
    unlocked: boolean;
    guardianPhone: string | null;
    guardianEmail: string | null;
    upgradeMessage?: string;
  };
};

export type ContactUnlockItem = {
  id: string;
  unlockedAt: string;
  profile: {
    id: string;
    displayId: string;
    displayName: string;
    gender: string;
    age: number | null;
    currentCity: string | null;
    currentCountryCode: string | null;
    primaryPhotoUrl: string | null;
  };
};
