"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/auth-provider";
import {
  type SuperAdminMailCampaignItem,
  type SuperAdminMatchMailResponse,
} from "@/components/super-admin-mailing-panel";
import {
  SuperAdminWorkspace,
  type SuperAdminAnalyticsSummary,
  type SuperAdminAdminItem,
  type SuperAdminCouponItem,
  type SuperAdminMembershipPlan,
  type SuperAdminOverviewResponse,
  type SuperAdminProfileSummary,
  type SuperAdminRevenueSummary,
} from "@/components/super-admin-workspace";
import {
  VendorWorkspace,
  type VendorDashboardResponse,
} from "@/components/vendor-workspace";
import {
  AdminWorkspace,
  type AdminOverviewResponse,
  type AdminProfileReviewItem,
  type ManualPayment,
} from "@/components/admin/admin-workspace";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import {
  GhotokWorkspace,
  type GhotokDashboardResponse,
} from "@/components/ghotok/ghotok-workspace";
import { DashboardAssistant } from "@/components/dashboard-assistant";
import { trackProductEvent } from "@/lib/analytics";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { type SuperAdminCommercialSettings } from "@/lib/commercial";
import { formatDate, formatDateTime, toCommaString, toStringValue, splitCommaValues } from "@/lib/format";
import { educationOptions, professionOptions, fullCountryList as extendedCountries, bdDistricts, heightOptions, generateSmartBio, generateSmartFamilyDetails, generateSmartPartnerPreference } from "@/lib/form-options";
import { localizePath, type PublicLocale } from "@/lib/locale";
import {
  localeText,
  translateGender,
  translateLookingFor,
} from "@/lib/public-page-locale";
import {
  translateMediaType,
  translatePrivacyMode,
  translateGateway,
  translateProfileStatus,
  translateApprovalStatus,
  translatePaymentStatus,
  translateWorkflowStatus,
} from "@/lib/translate";
import type {
  MemberDashboardResponse,
  DiscoveryResponse,
  SavedSearchItem,
  MediaItem,
  ConversationSummary,
  ConversationMessagesResponse,
  MembershipPlan,
  MembershipPreview,
  PaymentOrder,
  UploadRequestResponse,
  CreatedMembershipOrder,
  WeddingProject,
  VendorDirectoryItem,
  MemberProfileFormState,
  MemberPreferenceFormState,
  MediaUploadFormState,
  BillingFormState,
  WeddingProjectFormState,
  WeddingGuestFormState,
  VendorSearchFormState,
  DiscoverySearchFormState,
  MailboxConversationResponse,
  ContactUnlockItem,
} from "@/lib/types/member";
import type { AdminProfileReviewResponse } from "@/lib/types/admin";

/* Types imported from @/lib/types/* */

type DashboardShellCopy = {
  loadingKicker: string;
  loadingTitle: string;
  signInKicker: string;
  signInTitle: string;
  signInBody: string;
  loginLabel: string;
  signupLabel: string;
  heroEyebrowPrimary: string;
  heroEyebrowSecondary: string;
  heroTitleTemplate: string;
  heroBody: string;
  refreshing: string;
};

const defaultDashboardShellCopy: DashboardShellCopy = {
  loadingKicker: "Loading",
  loadingTitle: "Preparing your Borbodhu workspace.",
  signInKicker: "Sign in required",
  signInTitle: "Please log in to access your Borbodhu dashboard.",
  signInBody:
    "Create a free account or log in to manage your profile, search for matches, and plan your wedding journey.",
  loginLabel: "Log In",
  signupLabel: "Register Free",
  heroEyebrowPrimary: "Your Borbodhu Dashboard",
  heroEyebrowSecondary: "Secure · Private · Family-safe",
  heroTitleTemplate: "Welcome back, {email}",
  heroBody:
    "Manage your profile, discover matches, send interests, track messages, and plan your wedding — all in one place.",
  refreshing: "Refreshing your dashboard...",
};

function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function getDashboardShellCopy(locale: PublicLocale | null) {
  if (locale === "bn") {
    return {
      loadingKicker: "লোড হচ্ছে",
      loadingTitle: "আপনার বরবধূ ওয়ার্কস্পেস প্রস্তুত করা হচ্ছে।",
      signInKicker: "লগ ইন প্রয়োজন",
      signInTitle: "ড্যাশবোর্ড দেখার আগে একটি অ্যাকাউন্ট সেশন প্রয়োজন।",
      signInBody:
        "একটি ডেমো অ্যাকাউন্ট ব্যবহার করুন বা নতুন মেম্বার প্রোফাইল তৈরি করুন, তারপর এখানে ফিরে আসুন।",
      loginLabel: "লগ ইন",
      signupLabel: "সাইন আপ",
      heroEyebrowPrimary: "আপনার বরবধূ ড্যাশবোর্ড",
      heroEyebrowSecondary: "নিরাপদ · ব্যক্তিগত · পরিবার-উপযোগী",
      heroTitleTemplate: "{email}, আবার স্বাগতম",
      heroBody:
        "এই ড্যাশবোর্ডটি লাইভ GCP টেস্ট পরিবেশ ব্যবহার করছে, কোনো প্লেসহোল্ডার ডেটা নয়। নিচের প্রতিটি মডিউল বাস্তব API থেকে লোড হয়, যাতে আমরা ব্রাউজার আচরণ এবং ব্যাকএন্ড প্যারিটি একসাথে দেখতে পারি।",
      refreshing: "লাইভ ড্যাশবোর্ড ডেটা রিফ্রেশ হচ্ছে...",
    };
  }

  return defaultDashboardShellCopy;
}


function toProfileFormState(data: MemberDashboardResponse["profile"]): MemberProfileFormState {
  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    displayName: data.displayName ?? "",
    birthDate: data.birthDate ? data.birthDate.slice(0, 10) : "",
    maritalStatus: data.maritalStatus ?? "",
    childrenStatus: data.childrenStatus ?? "",
    heightCm: data.heightCm ? String(data.heightCm) : "",
    bodyType: data.bodyType ?? "",
    complexion: data.complexion ?? "",
    bloodGroup: data.bloodGroup ?? "",
    religion: data.religion ?? "",
    religionSubgroup: data.religionSubgroup ?? "",
    motherTongue: data.motherTongue ?? "",
    familyValues: data.familyValues ?? "",
    educationLevel: data.educationLevel ?? "",
    educationMajor: data.educationMajor ?? "",
    universityName: data.universityName ?? "",
    profession: data.profession ?? "",
    designation: data.designation ?? "",
    annualIncomeBand: data.annualIncomeBand ?? "",
    currentCountryCode: data.currentCountryCode ?? "",
    currentCity: data.currentCity ?? "",
    currentArea: data.currentArea ?? "",
    residenceStatus: data.residenceStatus ?? "",
    homeCountryCode: data.homeCountryCode ?? "",
    homeDivision: data.homeDivision ?? "",
    homeDistrict: data.homeDistrict ?? "",
    fatherStatus: data.fatherStatus ?? "",
    motherStatus: data.motherStatus ?? "",
    brothersCount: data.brothersCount != null ? String(data.brothersCount) : "",
    sistersCount: data.sistersCount != null ? String(data.sistersCount) : "",
    familyDetails: data.familyDetails ?? "",
    aboutMe: data.aboutMe ?? "",
    guardianName: data.guardianName ?? "",
    guardianRelation: data.guardianRelation ?? "",
    guardianPhone: data.guardianPhone ?? "",
    familyInvolvementLevel: data.familyInvolvementLevel ?? "",
  };
}

function toPreferenceFormState(
  preference: MemberDashboardResponse["profile"]["partnerPreference"],
): MemberPreferenceFormState {
  return {
    gender: preference?.gender ?? "",
    ageMin: toStringValue(preference?.ageMin),
    ageMax: toStringValue(preference?.ageMax),
    religions: toCommaString(preference?.religions),
    motherTongues: toCommaString(preference?.motherTongues),
    educationLevels: toCommaString(preference?.educationLevels),
    professions: toCommaString(preference?.professions),
    homeCountryCodes: toCommaString(preference?.homeCountryCodes),
    livingCountryCodes: toCommaString(preference?.livingCountryCodes),
    aboutPartner: preference?.aboutPartner ?? "",
  };
}

function toDiscoverySearchFormState(
  profile: MemberDashboardResponse["profile"],
): DiscoverySearchFormState {
  return {
    gender: profile.partnerPreference?.gender ?? profile.lookingFor ?? "",
    ageMin: toStringValue(profile.partnerPreference?.ageMin),
    ageMax: toStringValue(profile.partnerPreference?.ageMax),
    religion:
      typeof profile.partnerPreference?.religions?.[0] === "string"
        ? profile.partnerPreference.religions[0]
        : "",
    motherTongue:
      typeof profile.partnerPreference?.motherTongues?.[0] === "string"
        ? profile.partnerPreference.motherTongues[0]
        : "",
    maritalStatus: "",
    currentCountryCode: profile.currentCountryCode ?? "",
    keyword: "",
    hasPhoto: false,
    sortBy: "recent_login",
    heightMin: "",
    heightMax: "",
    educationLevel: "",
    profession: "",
    homeCountryCode: "",
    homeDistrict: "",
  };
}

function SectionTitle({
  kicker,
  title,
  detail,
}: {
  kicker: string;
  title: string;
  detail?: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h3>{title}</h3>
      </div>
      {detail ? <div>{detail}</div> : null}
    </div>
  );
}

function StatusPill({
  children,
  tone = "rose",
}: {
  children: ReactNode;
  tone?: "rose" | "leaf" | "gold" | "teal";
}) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}

function MemberWorkspace({
  accessToken,
  currentUserId,
  locale = null,
  assistantOpen,
  data,
  discovery,
  savedSearches,
  media,
  conversations,
  plans,
  orders,
  weddingProjects,
  initialVendorDirectory,
  contactUnlocks,
  onRefresh,
  onOpenAssistant,
}: {
  accessToken: string;
  currentUserId: string;
  locale?: PublicLocale | null;
  assistantOpen: boolean;
  data: MemberDashboardResponse;
  discovery: DiscoveryResponse | null;
  savedSearches: SavedSearchItem[];
  media: MediaItem[];
  conversations: ConversationSummary[];
  plans: MembershipPlan[];
  orders: PaymentOrder[];
  weddingProjects: WeddingProject[];
  initialVendorDirectory: VendorDirectoryItem[];
  contactUnlocks: ContactUnlockItem[];
  onRefresh: () => Promise<void>;
  onOpenAssistant: () => void;
}) {
  type MemberSection = "overview" | "profile" | "preferences" | "media" | "billing" | "mailbox" | "discovery" | "ai-suggestions" | "contacts-viewed" | "wedding" | "vendors";
  const [memberSection, setMemberSection] = useState<MemberSection>("overview");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Read tab from URL on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview","profile","preferences","media","billing","mailbox","discovery","ai-suggestions","contacts-viewed","wedding","vendors"].includes(tab)) {
      setMemberSection(tab as MemberSection);
    }
  }, [searchParams]);

  const memberSidebarSections = [
    {
      label: localeText(locale, "My Profile", "আমার প্রোফাইল"),
      items: [
        { key: "overview", label: localeText(locale, "Overview", "সারাংশ"), icon: "👤" },
        { key: "profile", label: localeText(locale, "Edit Profile", "প্রোফাইল সম্পাদনা"), icon: "✏️" },
        { key: "preferences", label: localeText(locale, "Partner Preferences", "পার্টনার পছন্দ"), icon: "💕" },
        { key: "media", label: localeText(locale, "Photos & Media", "ছবি ও মিডিয়া"), icon: "📷", count: media.length || undefined },
      ],
    },
    {
      label: localeText(locale, "Connections", "সংযোগ"),
      items: [
        { key: "mailbox", label: localeText(locale, "Messages", "মেসেজ"), icon: "💬", count: conversations.length || undefined },
        { key: "assistant", label: localeText(locale, "Ask AI", "AI জিজ্ঞাসা করুন"), icon: "🎙️" },
        { key: "discovery", label: localeText(locale, "Search Profiles", "প্রোফাইল সার্চ"), icon: "🔍" },
        { key: "ai-suggestions", label: localeText(locale, "AI Suggestions", "AI সাজেশন"), icon: "✨" },
        { key: "contacts-viewed", label: localeText(locale, "Contacts Viewed", "যোগাযোগ দেখা হয়েছে"), icon: "👁️" },
      ],
    },
    {
      label: localeText(locale, "Account", "অ্যাকাউন্ট"),
      items: [
        { key: "billing", label: localeText(locale, "Membership", "মেম্বারশিপ"), icon: "💎" },
      ],
    },
    {
      label: localeText(locale, "Wedding", "বিয়ে"),
      items: [
        { key: "wedding", label: localeText(locale, "Planning", "পরিকল্পনা"), icon: "🎊", count: weddingProjects.length || undefined },
        { key: "vendors", label: localeText(locale, "Vendor Directory", "ভেন্ডর ডিরেক্টরি"), icon: "🏪" },
      ],
    },
  ];

  const [profileForm, setProfileForm] = useState<MemberProfileFormState>(
    toProfileFormState(data.profile),
  );
  const [preferenceForm, setPreferenceForm] = useState<MemberPreferenceFormState>(
    toPreferenceFormState(data.profile.partnerPreference),
  );
  const [uploadForm, setUploadForm] = useState<MediaUploadFormState>({
    mediaType: "PROFILE_PHOTO",
    privacyMode: "PUBLIC",
    isPrimary: true,
  });
  const [billingForm, setBillingForm] = useState<BillingFormState>({
    membershipPlanId: plans[0]?.id ?? "",
    gateway: "OFFICE",
    couponCode: "",
  });
  const [projectForm, setProjectForm] = useState<WeddingProjectFormState>({
    title: "",
    weddingDate: "",
    city: "Dhaka",
    budgetBand: "",
    guestTarget: "",
  });
  const [guestForm, setGuestForm] = useState<WeddingGuestFormState>({
    guestName: "",
    guestPhone: "",
    guestCount: "1",
    invited: true,
    confirmed: false,
  });
  const [vendorSearch, setVendorSearch] = useState<VendorSearchFormState>({
    search: "",
    category: "",
    division: "",
    district: "",
  });
  const [discoveryForm, setDiscoveryForm] = useState<DiscoverySearchFormState>(
    toDiscoverySearchFormState(data.profile),
  );
  const [savedSearchState, setSavedSearchState] = useState<SavedSearchItem[]>(savedSearches);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [discoveryState, setDiscoveryState] = useState<DiscoveryResponse | null>(discovery);
  const [vendorDirectory, setVendorDirectory] =
    useState<VendorDirectoryItem[]>(initialVendorDirectory);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [selectedWeddingProjectId, setSelectedWeddingProjectId] = useState<string | null>(
    weddingProjects[0]?.id ?? null,
  );
  const [conversationMessages, setConversationMessages] =
    useState<ConversationMessagesResponse | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [preview, setPreview] = useState<MembershipPreview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [searchTab, setSearchTab] = useState<"quick" | "advanced" | "photo">("quick");
  const [showDiscoveryResults, setShowDiscoveryResults] = useState(!!discovery);
  const [aiMatches, setAiMatches] = useState<DiscoveryResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setProfileForm(toProfileFormState(data.profile));
    setPreferenceForm(toPreferenceFormState(data.profile.partnerPreference));
    setDiscoveryForm(toDiscoverySearchFormState(data.profile));
  }, [data]);

  useEffect(() => {
    setSavedSearchState(savedSearches);
  }, [savedSearches]);

  useEffect(() => {
    setDiscoveryState(discovery);
  }, [discovery]);

  useEffect(() => {
    setVendorDirectory(initialVendorDirectory);
  }, [initialVendorDirectory]);

  // Auto-load AI suggestions when section is first opened
  useEffect(() => {
    if (memberSection === "ai-suggestions" && !aiMatches && !aiLoading) {
      loadAiSuggestions();
    }
  }, [memberSection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!billingForm.membershipPlanId && plans[0]?.id) {
      setBillingForm((current) => ({
        ...current,
        membershipPlanId: plans[0].id,
      }));
    }
  }, [billingForm.membershipPlanId, plans]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversationId(null);
      setConversationMessages(null);
      return;
    }

    if (!selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
      return;
    }

    const selectedStillExists = conversations.some(
      (conversation) => conversation.id === selectedConversationId,
    );

    if (!selectedStillExists) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (!weddingProjects.length) {
      setSelectedWeddingProjectId(null);
      return;
    }

    if (!selectedWeddingProjectId) {
      setSelectedWeddingProjectId(weddingProjects[0].id);
      return;
    }

    const selectedStillExists = weddingProjects.some(
      (project) => project.id === selectedWeddingProjectId,
    );

    if (!selectedStillExists) {
      setSelectedWeddingProjectId(weddingProjects[0].id);
    }
  }, [weddingProjects, selectedWeddingProjectId]);

  useEffect(() => {
    let isCancelled = false;

    async function loadConversationMessages(conversationId: string) {
      setIsMessagesLoading(true);

      try {
        const messagesResponse = await apiRequest<ConversationMessagesResponse>(
          `/mailbox/conversations/${conversationId}/messages`,
          {
            token: accessToken,
          },
        );

        await apiRequest(`/mailbox/conversations/${conversationId}/read`, {
          method: "POST",
          token: accessToken,
        });

        if (!isCancelled) {
          setConversationMessages(messagesResponse);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!isCancelled) {
          setIsMessagesLoading(false);
        }
      }
    }

    if (selectedConversationId) {
      void loadConversationMessages(selectedConversationId);
    }

    return () => {
      isCancelled = true;
    };
  }, [accessToken, selectedConversationId]);

  function resetBanners() {
    setFeedback(null);
    setError(null);
  }

  function buildDiscoveryQueryString(criteria: DiscoverySearchFormState) {
    const params = new URLSearchParams();

    if (criteria.gender) {
      params.set("gender", criteria.gender);
    }

    if (criteria.ageMin) {
      params.set("ageMin", criteria.ageMin);
    }

    if (criteria.ageMax) {
      params.set("ageMax", criteria.ageMax);
    }

    if (criteria.religion) {
      params.set("religion", criteria.religion);
    }

    if (criteria.motherTongue) {
      params.set("motherTongue", criteria.motherTongue);
    }

    if (criteria.maritalStatus) {
      params.set("maritalStatus", criteria.maritalStatus);
    }

    if (criteria.currentCountryCode) {
      params.set("currentCountryCode", criteria.currentCountryCode);
    }

    if (criteria.keyword) {
      params.set("keyword", criteria.keyword);
    }

    if (criteria.hasPhoto) {
      params.set("hasPhoto", "true");
    }

    params.set("sortBy", criteria.sortBy);
    return params.toString();
  }

  function normalizeSavedSearchCriteria(
    criteriaJson: Record<string, unknown> | null | undefined,
  ): DiscoverySearchFormState {
    return {
      gender:
        typeof criteriaJson?.gender === "string" ? criteriaJson.gender : "",
      ageMin:
        typeof criteriaJson?.ageMin === "number"
          ? String(criteriaJson.ageMin)
          : typeof criteriaJson?.ageMin === "string"
            ? criteriaJson.ageMin
            : "",
      ageMax:
        typeof criteriaJson?.ageMax === "number"
          ? String(criteriaJson.ageMax)
          : typeof criteriaJson?.ageMax === "string"
            ? criteriaJson.ageMax
            : "",
      religion:
        typeof criteriaJson?.religion === "string" ? criteriaJson.religion : "",
      motherTongue:
        typeof criteriaJson?.motherTongue === "string"
          ? criteriaJson.motherTongue
          : "",
      maritalStatus:
        typeof criteriaJson?.maritalStatus === "string"
          ? criteriaJson.maritalStatus
          : "",
      currentCountryCode:
        typeof criteriaJson?.currentCountryCode === "string"
          ? criteriaJson.currentCountryCode
          : "",
      keyword:
        typeof criteriaJson?.keyword === "string" ? criteriaJson.keyword : "",
      hasPhoto:
        criteriaJson?.hasPhoto === true || criteriaJson?.hasPhoto === "true",
      sortBy:
        criteriaJson?.sortBy === "new_signups" ||
        criteriaJson?.sortBy === "most_active" ||
        criteriaJson?.sortBy === "recent_login"
          ? criteriaJson.sortBy
          : "recent_login",
      heightMin: typeof criteriaJson?.heightMin === "string" ? criteriaJson.heightMin : "",
      heightMax: typeof criteriaJson?.heightMax === "string" ? criteriaJson.heightMax : "",
      educationLevel: typeof criteriaJson?.educationLevel === "string" ? criteriaJson.educationLevel : "",
      profession: typeof criteriaJson?.profession === "string" ? criteriaJson.profession : "",
      homeCountryCode: typeof criteriaJson?.homeCountryCode === "string" ? criteriaJson.homeCountryCode : "",
      homeDistrict: typeof criteriaJson?.homeDistrict === "string" ? criteriaJson.homeDistrict : "",
    };
  }

  async function runDiscoverySearch(criteria = discoveryForm) {
    setBusyKey("search-discovery");
    resetBanners();

    try {
      const response = await apiRequest<DiscoveryResponse>(
        `/member-profiles/discovery?${buildDiscoveryQueryString(criteria)}`,
        {
          token: accessToken,
        },
      );

      setDiscoveryState(response);
      setShowDiscoveryResults(true);
      setFeedback(
        localeText(locale, "Search results refreshed.", "সার্চ ফলাফল রিফ্রেশ হয়েছে।"),
      );
    } catch (searchError) {
      setError(getErrorMessage(searchError));
    } finally {
      setBusyKey(null);
    }
  }

  async function loadAiSuggestions() {
    setAiLoading(true);
    resetBanners();
    try {
      const pref = data.profile.partnerPreference;
      const params = new URLSearchParams();
      // Use the opposite gender of the profile owner as default
      const targetGender = pref?.gender
        ?? (data.profile.gender === "Man" ? "Woman" : data.profile.gender === "Woman" ? "Man" : undefined);
      if (targetGender) params.set("gender", targetGender);
      if (pref?.ageMin) params.set("ageMin", String(pref.ageMin));
      if (pref?.ageMax) params.set("ageMax", String(pref.ageMax));
      if (pref?.religions?.[0]) params.set("religion", pref.religions[0]);
      if (pref?.motherTongues?.[0]) params.set("motherTongue", pref.motherTongues[0]);
      params.set("sortBy", "recent_login");
      let response = await apiRequest<DiscoveryResponse>(
        `/member-profiles/discovery?${params.toString()}`,
        { token: accessToken },
      );
      // If strict preferences returned 0 results, fall back to broader search (gender + age only)
      if (response.total === 0 && (pref?.religions?.[0] || pref?.motherTongues?.[0])) {
        const fallbackParams = new URLSearchParams();
        if (targetGender) fallbackParams.set("gender", targetGender);
        if (pref?.ageMin) fallbackParams.set("ageMin", String(pref.ageMin));
        if (pref?.ageMax) fallbackParams.set("ageMax", String(pref.ageMax));
        fallbackParams.set("sortBy", "recent_login");
        response = await apiRequest<DiscoveryResponse>(
          `/member-profiles/discovery?${fallbackParams.toString()}`,
          { token: accessToken },
        );
      }
      setAiMatches(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  }

  async function saveCurrentSearch() {
    const trimmedName = savedSearchName.trim();
    if (!trimmedName) {
      setError(localeText(locale, "Give this search a short name first.", "আগে এই সার্চের একটি নাম দিন।"));
      return;
    }

    setBusyKey("save-search");
    resetBanners();

    try {
      const created = await apiRequest<SavedSearchItem>("/member-profiles/me/saved-searches", {
        method: "POST",
        token: accessToken,
        body: {
          name: trimmedName,
          criteriaJson: discoveryForm,
          alertEnabled: false,
        },
      });

      setSavedSearchState((current) => [created, ...current]);
      setSavedSearchName("");
      setFeedback(localeText(locale, "Search saved.", "সার্চ সেভ হয়েছে।"));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteSavedSearch(searchSaveId: string) {
    setBusyKey(`delete-search:${searchSaveId}`);
    resetBanners();

    try {
      await apiRequest(`/member-profiles/me/saved-searches/${searchSaveId}`, {
        method: "DELETE",
        token: accessToken,
      });

      setSavedSearchState((current) =>
        current.filter((item) => item.id !== searchSaveId),
      );
      setFeedback(localeText(locale, "Saved search removed.", "সেভ করা সার্চ মুছে ফেলা হয়েছে।"));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusyKey(null);
    }
  }

  async function saveProfile() {
    setBusyKey("profile");
    resetBanners();

    try {
      await apiRequest("/member-profiles/me", {
        method: "PATCH",
        token: accessToken,
        body: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName || undefined,
          displayName: profileForm.displayName || undefined,
          birthDate: profileForm.birthDate || undefined,
          maritalStatus: profileForm.maritalStatus || undefined,
          childrenStatus: profileForm.childrenStatus || undefined,
          heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : undefined,
          bodyType: profileForm.bodyType || undefined,
          complexion: profileForm.complexion || undefined,
          bloodGroup: profileForm.bloodGroup || undefined,
          religion: profileForm.religion || undefined,
          religionSubgroup: profileForm.religionSubgroup || undefined,
          motherTongue: profileForm.motherTongue || undefined,
          familyValues: profileForm.familyValues || undefined,
          educationLevel: profileForm.educationLevel || undefined,
          educationMajor: profileForm.educationMajor || undefined,
          universityName: profileForm.universityName || undefined,
          profession: profileForm.profession || undefined,
          designation: profileForm.designation || undefined,
          annualIncomeBand: profileForm.annualIncomeBand || undefined,
          currentCountryCode: profileForm.currentCountryCode || undefined,
          currentCity: profileForm.currentCity || undefined,
          currentArea: profileForm.currentArea || undefined,
          residenceStatus: profileForm.residenceStatus || undefined,
          homeCountryCode: profileForm.homeCountryCode || undefined,
          homeDivision: profileForm.homeDivision || undefined,
          homeDistrict: profileForm.homeDistrict || undefined,
          fatherStatus: profileForm.fatherStatus || undefined,
          motherStatus: profileForm.motherStatus || undefined,
          brothersCount: profileForm.brothersCount ? Number(profileForm.brothersCount) : undefined,
          sistersCount: profileForm.sistersCount ? Number(profileForm.sistersCount) : undefined,
          familyDetails: profileForm.familyDetails || undefined,
          aboutMe: profileForm.aboutMe || undefined,
          guardianName: profileForm.guardianName || undefined,
          guardianRelation: profileForm.guardianRelation || undefined,
          guardianPhone: profileForm.guardianPhone || undefined,
          familyInvolvementLevel: profileForm.familyInvolvementLevel || undefined,
        },
      });

      setFeedback(localeText(locale, "Profile details saved.", "প্রোফাইল তথ্য সেভ হয়েছে।"));
      await onRefresh();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusyKey(null);
    }
  }

  async function savePreferences() {
    setBusyKey("preferences");
    resetBanners();

    try {
      await apiRequest("/member-profiles/me/preferences", {
        method: "PATCH",
        token: accessToken,
        body: {
          gender: preferenceForm.gender || undefined,
          ageMin: preferenceForm.ageMin ? Number(preferenceForm.ageMin) : undefined,
          ageMax: preferenceForm.ageMax ? Number(preferenceForm.ageMax) : undefined,
          religions: preferenceForm.religions
            ? splitCommaValues(preferenceForm.religions)
            : undefined,
          motherTongues: preferenceForm.motherTongues
            ? splitCommaValues(preferenceForm.motherTongues)
            : undefined,
          educationLevels: preferenceForm.educationLevels
            ? splitCommaValues(preferenceForm.educationLevels)
            : undefined,
          professions: preferenceForm.professions
            ? splitCommaValues(preferenceForm.professions)
            : undefined,
          homeCountryCodes: preferenceForm.homeCountryCodes
            ? splitCommaValues(preferenceForm.homeCountryCodes)
            : undefined,
          livingCountryCodes: preferenceForm.livingCountryCodes
            ? splitCommaValues(preferenceForm.livingCountryCodes)
            : undefined,
          aboutPartner: preferenceForm.aboutPartner || undefined,
        },
      });

      setFeedback(localeText(locale, "Partner preferences saved.", "পার্টনার পছন্দ সেভ হয়েছে।"));
      await onRefresh();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setBusyKey(null);
    }
  }

  async function submitForReview() {
    setBusyKey("submit-review");
    resetBanners();

    try {
      await apiRequest("/member-profiles/me/submit-review", {
        method: "POST",
        token: accessToken,
      });

      setFeedback(localeText(locale, "Profile submitted for review.", "প্রোফাইল রিভিউয়ের জন্য জমা হয়েছে।"));
      await onRefresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setBusyKey(null);
    }
  }

  async function runDiscoveryAction(
    memberProfileId: string,
    action:
      | "interests"
      | "favorites"
      | "photo-requests"
      | "start-conversation",
  ) {
    setBusyKey(`${action}:${memberProfileId}`);
    resetBanners();

    try {
      if (action === "start-conversation") {
        const response = await apiRequest<MailboxConversationResponse>(
          "/mailbox/conversations/direct",
          {
            method: "POST",
            token: accessToken,
            body: {
              targetMemberProfileId: memberProfileId,
            },
          },
        );

        setSelectedConversationId(response.id);
        setFeedback(localeText(locale, "Conversation is ready in your mailbox.", "আপনার মেইলবক্সে কথোপকথন প্রস্তুত।"));
      } else {
        await apiRequest(`/member-profiles/${memberProfileId}/${action}`, {
          method: "POST",
          token: accessToken,
        });

        setFeedback(
          action === "interests"
            ? localeText(locale, "Interest sent.", "আগ্রহ পাঠানো হয়েছে।")
            : action === "favorites"
              ? localeText(locale, "Added to favorites.", "ফেভারিটে যোগ হয়েছে।")
              : localeText(locale, "Private photo request sent.", "প্রাইভেট ছবি অনুরোধ পাঠানো হয়েছে।"),
        );
      }

      await onRefresh();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function uploadMedia() {
    if (!selectedFile) {
      setError(localeText(locale, "Choose a file first.", "আগে একটি ফাইল বেছে নিন।"));
      return;
    }

    const maxSize = uploadForm.mediaType === "VIDEO" ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const limitLabel = uploadForm.mediaType === "VIDEO" ? "50MB" : "5MB";
      setError(localeText(locale, `File too large. Maximum size is ${limitLabel}.`, `ফাইল খুব বড়। সর্বোচ্চ সাইজ ${limitLabel}।`));
      return;
    }

    setBusyKey("upload-media");
    resetBanners();

    try {
      const uploadRequest = await apiRequest<UploadRequestResponse>(
        "/media/member/me/upload-request",
        {
          method: "POST",
          token: accessToken,
          body: {
            mediaType: uploadForm.mediaType,
            fileName: selectedFile.name,
            mimeType: selectedFile.type || "application/octet-stream",
            privacyMode: uploadForm.privacyMode,
          },
        },
      );

      const uploadResponse = await fetch(uploadRequest.uploadUrl, {
        method: uploadRequest.method,
        headers: uploadRequest.headers,
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          localeText(
            locale,
            "Cloud upload failed. Check bucket CORS and signed upload settings.",
            "ক্লাউড আপলোড ব্যর্থ হয়েছে। বাকেট CORS এবং signed upload settings পরীক্ষা করুন।",
          ),
        );
      }

      await apiRequest("/media/member/me", {
        method: "POST",
        token: accessToken,
        body: {
          mediaType: uploadForm.mediaType,
          storagePath: uploadRequest.storagePath,
          mimeType: selectedFile.type || "application/octet-stream",
          privacyMode: uploadForm.privacyMode,
          isPrimary:
            uploadForm.mediaType === "PROFILE_PHOTO" ? uploadForm.isPrimary : false,
        },
      });

      setSelectedFile(null);
      setUploadForm({
        mediaType: "PROFILE_PHOTO",
        privacyMode: "PUBLIC",
        isPrimary: true,
      });
      setFeedback(localeText(locale, "File uploaded and submitted for review.", "ফাইল আপলোড হয়েছে এবং রিভিউয়ের জন্য জমা হয়েছে।"));
      await onRefresh();
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setBusyKey(null);
    }
  }

  async function updateMedia(mediaId: string, body: Record<string, unknown>, message: string) {
    setBusyKey(`media:${mediaId}`);
    resetBanners();

    try {
      await apiRequest(`/media/member/me/${mediaId}`, {
        method: "PATCH",
        token: accessToken,
        body,
      });

      setFeedback(message);
      await onRefresh();
    } catch (mediaError) {
      setError(getErrorMessage(mediaError));
    } finally {
      setBusyKey(null);
    }
  }

  async function previewMembership() {
    if (!billingForm.membershipPlanId) {
      setError(localeText(locale, "Choose a membership plan first.", "আগে একটি মেম্বারশিপ প্ল্যান বেছে নিন।"));
      return;
    }

    setBusyKey("preview-membership");
    resetBanners();

    try {
      const response = await apiRequest<MembershipPreview>("/billing/membership-preview", {
        method: "POST",
        body: {
          membershipPlanId: billingForm.membershipPlanId,
          gateway: billingForm.gateway,
          couponCode: billingForm.couponCode || undefined,
        },
      });

      setPreview(response);
      setFeedback(localeText(locale, "Membership preview updated.", "মেম্বারশিপ প্রিভিউ আপডেট হয়েছে।"));
    } catch (previewError) {
      setError(getErrorMessage(previewError));
      setPreview(null);
    } finally {
      setBusyKey(null);
    }
  }

  async function createMembershipOrder() {
    if (!billingForm.membershipPlanId) {
      setError(localeText(locale, "Choose a membership plan first.", "আগে একটি মেম্বারশিপ প্ল্যান বেছে নিন।"));
      return;
    }

    setBusyKey("create-order");
    resetBanners();

    try {
      const response = await apiRequest<CreatedMembershipOrder>("/billing/membership-orders", {
        method: "POST",
        token: accessToken,
        body: {
          membershipPlanId: billingForm.membershipPlanId,
          gateway: billingForm.gateway,
          couponCode: billingForm.couponCode || undefined,
        },
      });
      void trackProductEvent({
        eventName: "MEMBERSHIP_CHECKOUT_STARTED",
        token: accessToken,
        locale,
        pagePath: localizePath("/dashboard", locale),
        entityType: "PAYMENT",
        entityId: response.payment.id,
        metadataJson: {
          gateway: billingForm.gateway,
          membershipPlanId: billingForm.membershipPlanId,
          nextAction: response.nextAction,
        },
      });

      if (response.nextAction === "redirect_to_gateway" && response.checkout?.checkoutUrl) {
        void trackProductEvent({
          eventName: "PAYMENT_REDIRECT_STARTED",
          token: accessToken,
          locale,
          pagePath: localizePath("/dashboard", locale),
          entityType: "PAYMENT",
          entityId: response.payment.id,
          metadataJson: {
            gateway: response.payment.gateway,
            checkoutUrl: response.checkout.checkoutUrl,
          },
        });
        window.location.assign(response.checkout.checkoutUrl);
        return;
      }

      setFeedback(
        response.nextAction === "await_admin_approval"
          ? localeText(
              locale,
              "Membership order created. It will activate after admin approval.",
              "মেম্বারশিপ অর্ডার তৈরি হয়েছে। অ্যাডমিন অনুমোদনের পর এটি সক্রিয় হবে।",
            )
          : localeText(
              locale,
              "Membership order created. Gateway redirect will be the next step.",
              "মেম্বারশিপ অর্ডার তৈরি হয়েছে। পরের ধাপ হবে গেটওয়ে রিডাইরেক্ট।",
            ),
      );
      await onRefresh();
    } catch (createOrderError) {
      setError(getErrorMessage(createOrderError));
    } finally {
      setBusyKey(null);
    }
  }

  async function sendMessage() {
    if (!selectedConversationId || !messageDraft.trim()) {
      return;
    }

    setBusyKey("send-message");
    resetBanners();

    try {
      await apiRequest(`/mailbox/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        token: accessToken,
        body: {
          body: messageDraft,
        },
      });

      setMessageDraft("");
      setFeedback(localeText(locale, "Message sent.", "বার্তা পাঠানো হয়েছে।"));
      await onRefresh();
      const refreshedMessages = await apiRequest<ConversationMessagesResponse>(
        `/mailbox/conversations/${selectedConversationId}/messages`,
        {
          token: accessToken,
        },
      );
      setConversationMessages(refreshedMessages);
    } catch (messageError) {
      setError(getErrorMessage(messageError));
    } finally {
      setBusyKey(null);
    }
  }

  async function createWeddingProject() {
    if (!projectForm.title.trim()) {
      setError(localeText(locale, "Wedding project title is required.", "ওয়েডিং প্রজেক্টের শিরোনাম প্রয়োজন।"));
      return;
    }

    setBusyKey("create-project");
    resetBanners();

    try {
      await apiRequest("/wedding/projects", {
        method: "POST",
        token: accessToken,
        body: {
          title: projectForm.title,
          weddingDate: projectForm.weddingDate || undefined,
          city: projectForm.city || undefined,
          budgetBand: projectForm.budgetBand || undefined,
          guestTarget: projectForm.guestTarget
            ? Number(projectForm.guestTarget)
            : undefined,
        },
      });

      setProjectForm({
        title: "",
        weddingDate: "",
        city: "Dhaka",
        budgetBand: "",
        guestTarget: "",
      });
      setFeedback(localeText(locale, "Wedding project created.", "ওয়েডিং প্রজেক্ট তৈরি হয়েছে।"));
      await onRefresh();
    } catch (projectError) {
      setError(getErrorMessage(projectError));
    } finally {
      setBusyKey(null);
    }
  }

  async function addWeddingGuest() {
    if (!selectedWeddingProjectId) {
      setError(localeText(locale, "Choose a wedding project first.", "আগে একটি ওয়েডিং প্রজেক্ট বেছে নিন।"));
      return;
    }

    if (!guestForm.guestName.trim()) {
      setError(localeText(locale, "Guest name is required.", "অতিথির নাম প্রয়োজন।"));
      return;
    }

    setBusyKey("add-guest");
    resetBanners();

    try {
      await apiRequest(`/wedding/projects/${selectedWeddingProjectId}/guests`, {
        method: "POST",
        token: accessToken,
        body: {
          guestName: guestForm.guestName,
          guestPhone: guestForm.guestPhone || undefined,
          guestCount: guestForm.guestCount ? Number(guestForm.guestCount) : 1,
          invited: guestForm.invited,
          confirmed: guestForm.confirmed,
        },
      });

      setGuestForm({
        guestName: "",
        guestPhone: "",
        guestCount: "1",
        invited: true,
        confirmed: false,
      });
      setFeedback(localeText(locale, "Guest added to the wedding project.", "অতিথি ওয়েডিং প্রজেক্টে যোগ হয়েছে।"));
      await onRefresh();
    } catch (guestError) {
      setError(getErrorMessage(guestError));
    } finally {
      setBusyKey(null);
    }
  }

  async function searchVendors() {
    setBusyKey("search-vendors");
    resetBanners();

    try {
      const params = new URLSearchParams();

      if (vendorSearch.search.trim()) {
        params.set("search", vendorSearch.search.trim());
      }

      if (vendorSearch.category.trim()) {
        params.set("category", vendorSearch.category.trim());
      }

      if (vendorSearch.division.trim()) {
        params.set("division", vendorSearch.division.trim());
      }

      if (vendorSearch.district.trim()) {
        params.set("district", vendorSearch.district.trim());
      }

      const response = await apiRequest<VendorDirectoryItem[]>(
        `/vendors${params.size ? `?${params.toString()}` : ""}`,
      );

      setVendorDirectory(response);
      setFeedback(localeText(locale, "Vendor directory updated.", "ভেন্ডর ডিরেক্টরি আপডেট হয়েছে।"));
    } catch (vendorError) {
      setError(getErrorMessage(vendorError));
    } finally {
      setBusyKey(null);
    }
  }

  async function shortlistVendor(vendorProfileId: string) {
    if (!selectedWeddingProjectId) {
      setError(
        localeText(
          locale,
          "Create or choose a wedding project before shortlisting vendors.",
          "ভেন্ডর শর্টলিস্ট করার আগে একটি ওয়েডিং প্রজেক্ট তৈরি করুন বা বেছে নিন।",
        ),
      );
      return;
    }

    setBusyKey(`shortlist:${vendorProfileId}`);
    resetBanners();

    try {
      await apiRequest(`/wedding/projects/${selectedWeddingProjectId}/shortlists`, {
        method: "POST",
        token: accessToken,
        body: {
          vendorProfileId,
        },
      });

      setFeedback(localeText(locale, "Vendor added to your shortlist.", "ভেন্ডর আপনার শর্টলিস্টে যোগ হয়েছে।"));
      await onRefresh();
    } catch (shortlistError) {
      setError(getErrorMessage(shortlistError));
    } finally {
      setBusyKey(null);
    }
  }

  const selectedWeddingProject =
    weddingProjects.find((project) => project.id === selectedWeddingProjectId) ?? null;
  const vendorCategories = Array.from(
    new Set(initialVendorDirectory.map((vendor) => vendor.categoryName).filter(Boolean)),
  );
  const vendorDivisions = Array.from(
    new Set(initialVendorDirectory.map((vendor) => vendor.division).filter(Boolean)),
  );

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <SidebarNav
          sections={memberSidebarSections}
          activeKey={assistantOpen ? "assistant" : memberSection}
          onNavigate={(key) => {
            if (key === "assistant") {
              onOpenAssistant();
              return;
            }
            if (key === "discovery") {
              router.push(localizePath("/search", locale));
              return;
            }
            setMemberSection(key as MemberSection);
            setError(null);
            setFeedback(null);
          }}
        />
      </aside>
      <div className="dashboard-content">
    <section className="dashboard-stack">
      {/* ── Overview Section ── */}
      <div style={memberSection !== "overview" ? { display: "none" } : undefined}>
        {/* Card A: Profile Summary */}
        <article className="dashboard-panel dashboard-panel-wide">
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Photo */}
            <div style={{ flexShrink: 0 }}>
              {data.profile.primaryPhotoUrl ? (
                <img
                  src={data.profile.primaryPhotoUrl}
                  alt={data.profile.displayName}
                  style={{ width: 100, height: 100, borderRadius: 16, objectFit: "cover", border: "2px solid var(--line)" }}
                />
              ) : (
                <div
                  style={{ width: 100, height: 100, borderRadius: 16, background: "linear-gradient(135deg, var(--rose-soft), var(--gold-soft))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "var(--muted)", border: "2px solid var(--line)" }}
                >
                  👤
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
                  {(() => {
                    const raw = data.profile.firstName
                      ? `${data.profile.firstName} ${data.profile.lastName ?? ""}`.trim()
                      : (data.profile.displayName ?? "");
                    return (!raw || raw.toUpperCase() === "NULL") ? data.profile.displayId : raw;
                  })()}
                </h2>
                <StatusPill tone="leaf">{translateProfileStatus(data.profile.status, locale)}</StatusPill>
                <StatusPill tone="gold">{translateApprovalStatus(data.profile.approvalStatus, locale)}</StatusPill>
              </div>
              <p className="hint" style={{ margin: "0 0 8px" }}>
                {localeText(locale, "Member ID", "মেম্বার আইডি")}: {data.profile.displayId} • {localeText(locale, "Last login", "সর্বশেষ লগ ইন")}: {formatDate(data.profile.user.lastLoginAt, locale)}
              </p>
              <div className="tag-list" style={{ gap: 5 }}>
                <span className="tag">{translateGender(data.profile.gender, locale ?? "en")}</span>
                {data.profile.lookingFor ? (
                  <span className="tag">{localeText(locale, `Seeking ${translateGender(data.profile.lookingFor, locale ?? "en")}`, `${translateGender(data.profile.lookingFor, locale ?? "en")} খুঁজছেন`)}</span>
                ) : null}
                {data.profile.religion ? <span className="tag">{data.profile.religion}</span> : null}
                {data.profile.motherTongue ? <span className="tag">{data.profile.motherTongue}</span> : null}
                {data.profile.currentCity ? (
                  <span className="tag">{data.profile.currentCity}{data.profile.currentCountryCode ? `, ${data.profile.currentCountryCode}` : ""}</span>
                ) : null}
                {data.profile.educationLevel ? <span className="tag">{data.profile.educationLevel}</span> : null}
                {data.profile.profession ? <span className="tag">{data.profile.profession}</span> : null}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {data.profile.approvalStatus === "APPROVED" ? (
                  <Link href={localizePath(`/profiles/${data.profile.displayId}`, locale)} className="button button-primary" style={{ fontSize: "0.82rem", padding: "8px 16px" }}>
                    {localeText(locale, "View My Public Profile", "আমার পাবলিক প্রোফাইল দেখুন")}
                  </Link>
                ) : data.profile.approvalStatus !== "PENDING_REVIEW" ? (
                  <button type="button" className="button button-primary" style={{ fontSize: "0.82rem", padding: "8px 16px" }} onClick={() => void submitForReview()} disabled={busyKey === "submit-review"}>
                    {busyKey === "submit-review" ? localeText(locale, "Submitting...", "জমা হচ্ছে...") : localeText(locale, "Submit For Review", "রিভিউয়ের জন্য জমা দিন")}
                  </button>
                ) : (
                  <span className="tag tag-highlight" style={{ fontSize: "0.8rem", padding: "8px 14px" }}>
                    {localeText(locale, "Under review — visible after approval", "রিভিউ চলছে — অনুমোদনের পর দেখা যাবে")}
                  </span>
                )}
                <button type="button" className="button button-soft" style={{ fontSize: "0.82rem", padding: "8px 16px" }} onClick={() => setMemberSection("profile")}>
                  {localeText(locale, "Edit Profile", "প্রোফাইল সম্পাদনা")}
                </button>
              </div>
            </div>
          </div>
          {feedback ? <div className="success-banner dashboard-banner" style={{ marginTop: 16 }}>{feedback}</div> : null}
        </article>

        {/* Card B: Profile Completion + Checklist */}
        <article className="dashboard-panel dashboard-panel-wide" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              {localeText(locale, "Profile Completion", "প্রোফাইল সম্পূর্ণতা")}
            </h3>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: data.profile.profileCompletionPct >= 80 ? "var(--leaf)" : data.profile.profileCompletionPct >= 50 ? "var(--gold)" : "var(--rose)" }}>
              {data.profile.profileCompletionPct}%
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "var(--line)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${data.profile.profileCompletionPct}%`, borderRadius: 5, background: data.profile.profileCompletionPct >= 80 ? "var(--leaf)" : data.profile.profileCompletionPct >= 50 ? "var(--gold)" : "var(--rose)", transition: "width 0.5s ease" }} />
          </div>

          {/* Completion checklist */}
          {(() => {
            const checks = [
              { done: !!data.profile.primaryPhotoUrl, label: localeText(locale, "Upload a profile photo", "প্রোফাইল ছবি আপলোড করুন"), action: "media" as MemberSection },
              { done: !!data.profile.aboutMe, label: localeText(locale, "Write about yourself", "নিজের সম্পর্কে লিখুন"), action: "profile" as MemberSection },
              { done: !!data.profile.educationLevel, label: localeText(locale, "Add education details", "শিক্ষাগত তথ্য যোগ করুন"), action: "profile" as MemberSection },
              { done: !!data.profile.profession, label: localeText(locale, "Add profession", "পেশা যোগ করুন"), action: "profile" as MemberSection },
              { done: !!data.profile.heightCm, label: localeText(locale, "Add height", "উচ্চতা যোগ করুন"), action: "profile" as MemberSection },
              { done: !!data.profile.familyDetails, label: localeText(locale, "Add family details", "পারিবারিক তথ্য যোগ করুন"), action: "profile" as MemberSection },
              { done: !!data.profile.homeDistrict, label: localeText(locale, "Add home district", "জেলা যোগ করুন"), action: "profile" as MemberSection },
              { done: !!data.profile.partnerPreference?.gender, label: localeText(locale, "Set partner preferences", "পার্টনার পছন্দ সেট করুন"), action: "preferences" as MemberSection },
              { done: !!data.profile.guardianName, label: localeText(locale, "Add guardian info", "অভিভাবকের তথ্য যোগ করুন"), action: "profile" as MemberSection },
            ];
            const incomplete = checks.filter((c) => !c.done);
            if (incomplete.length === 0) {
              return (
                <p style={{ fontSize: "0.88rem", color: "var(--leaf)", fontWeight: 600 }}>
                  ✅ {localeText(locale, "Your profile is complete! You're getting maximum visibility.", "আপনার প্রোফাইল সম্পূর্ণ! সর্বোচ্চ দৃশ্যমানতা পাচ্ছেন।")}
                </p>
              );
            }
            return (
              <div style={{ display: "grid", gap: 6 }}>
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 4px" }}>
                  {localeText(locale, `Complete ${incomplete.length} more item(s) to improve your profile:`, `আরও ${incomplete.length}টি তথ্য দিলে প্রোফাইল আরও ভালো হবে:`)}
                  <span style={{ display: "block", fontSize: "0.78rem", color: "var(--gold)", marginTop: 2 }}>
                    {localeText(locale, "Complete profiles get up to 5x more interest.", "সম্পূর্ণ প্রোফাইলে ৫ গুণ বেশি আগ্রহ পাওয়া যায়।")}
                  </span>
                </p>
                {incomplete.map((check) => (
                  <button
                    key={check.label}
                    type="button"
                    onClick={() => setMemberSection(check.action)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)",
                      cursor: "pointer", textAlign: "left", fontSize: "0.84rem", width: "100%",
                      transition: "background 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>⬜</span>
                    <span style={{ flex: 1, color: "var(--ink)" }}>{check.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--rose)", fontWeight: 600 }}>→</span>
                  </button>
                ))}
              </div>
            );
          })()}
        </article>

        {/* Card C: Activity Stats */}
        <article className="dashboard-panel dashboard-panel-wide" style={{ marginTop: 14 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700 }}>
            {localeText(locale, "Activity", "কার্যক্রম")}
          </h3>
          <div className="dashboard-stats">
            <article className="stat-card">
              <strong>{data.activity.profileVisits}</strong>
              <span>{localeText(locale, "Profile visits", "প্রোফাইল ভিজিট")}</span>
            </article>
            <article className="stat-card">
              <strong>{data.activity.receivedInterests}</strong>
              <span>{localeText(locale, "Interests received", "প্রাপ্ত আগ্রহ")}</span>
            </article>
            <article className="stat-card">
              <strong>{data.activity.receivedFavorites}</strong>
              <span>{localeText(locale, "Shortlisted by", "পছন্দতালিকায়")}</span>
            </article>
            <article className="stat-card">
              <strong>{data.activity.pendingPhotoRequests}</strong>
              <span>{localeText(locale, "Photo requests", "ছবি অনুরোধ")}</span>
            </article>
          </div>
          {data.activity.profileVisits === 0 && data.activity.receivedInterests === 0 && (
            <p style={{ margin: "12px 0 0", fontSize: "0.82rem", color: "var(--gold)", textAlign: "center" }}>
              {localeText(locale, "Complete your profile and add a photo to start getting noticed.", "প্রোফাইল সম্পূর্ণ করুন এবং ছবি যোগ করুন — আগ্রহ আসতে শুরু করবে।")}
            </p>
          )}
        </article>

      </div>

      {/* ── Profile Edit + Preferences Section ── */}
      <div style={memberSection !== "profile" && memberSection !== "preferences" ? { display: "none" } : undefined}>
        <article className="dashboard-panel dashboard-panel-wide" style={memberSection === "preferences" ? { display: "none" } : undefined}>
          <SectionTitle
            kicker={localeText(locale, "Profile Edit", "প্রোফাইল সম্পাদনা")}
            title={localeText(locale, "All profile details", "সব প্রোফাইল তথ্য")}
          />

          {/* ---- Account Details (read-only) ---- */}
          <h4 style={{ margin: "0 0 12px" }}>{localeText(locale, "Account Details", "অ্যাকাউন্ট তথ্য")}</h4>
          <div className="input-grid-2">
            <label className="field">
              <span className="field-label">{localeText(locale, "Full Name", "পূর্ণ নাম")}</span>
              <input type="text" value={`${data.profile.firstName ?? ""} ${data.profile.lastName ?? ""}`.trim()} disabled style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
            </label>
            <label className="field">
              <span className="field-label">{localeText(locale, "Email", "ইমেইল")}</span>
              <input type="text" value={data.profile.user.email} disabled style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
            </label>
            <label className="field">
              <span className="field-label">{localeText(locale, "Phone", "ফোন")}</span>
              <input type="text" value={data.profile.guardianPhone ?? "—"} disabled style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
            </label>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#888", margin: "8px 0 20px" }}>
            {localeText(locale, "To update name, phone or email, please ", "নাম, ফোন বা ইমেইল আপডেট করতে, অনুগ্রহ করে ")}
            <a href="mailto:support@borbodhu.com" style={{ color: "var(--rose)" }}>
              {localeText(locale, "contact support", "সাপোর্টে যোগাযোগ করুন")}
            </a>.
          </p>

          <p className="section-kicker" style={{ marginTop: 12 }}>{localeText(locale, "Personal Details", "ব্যক্তিগত তথ্য")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Display name", "ডিসপ্লে নাম")}</span>
              <input type="text" value={profileForm.displayName} onChange={(e) => setProfileForm((c) => ({ ...c, displayName: e.target.value }))} />
            </label>
            <label className="field"><span>{localeText(locale, "Date of birth", "জন্ম তারিখ")}</span>
              <input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm((c) => ({ ...c, birthDate: e.target.value }))} />
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Marital status", "বৈবাহিক অবস্থা")}</span>
              <select value={profileForm.maritalStatus} onChange={(e) => setProfileForm((c) => ({ ...c, maritalStatus: e.target.value }))}>
                <option value="">—</option><option value="Never Married">Never Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Have children", "সন্তান আছে")}</span>
              <select value={profileForm.childrenStatus} onChange={(e) => setProfileForm((c) => ({ ...c, childrenStatus: e.target.value }))}>
                <option value="">—</option><option value="No">No</option><option value="Yes, living together">Yes, living together</option><option value="Yes, not living together">Yes, not living together</option>
              </select>
            </label>
          </div>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "Physical Appearance", "শারীরিক গঠন")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Height", "উচ্চতা")}</span>
              <select value={profileForm.heightCm} onChange={(e) => setProfileForm((c) => ({ ...c, heightCm: e.target.value }))}>
                <option value="">—</option>
                {heightOptions.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Body type", "দেহের গঠন")}</span>
              <select value={profileForm.bodyType} onChange={(e) => setProfileForm((c) => ({ ...c, bodyType: e.target.value }))}>
                <option value="">—</option><option value="Slim">Slim</option><option value="Average">Average</option><option value="Athletic">Athletic</option><option value="Heavy">Heavy</option>
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Complexion", "গায়ের রং")}</span>
              <select value={profileForm.complexion} onChange={(e) => setProfileForm((c) => ({ ...c, complexion: e.target.value }))}>
                <option value="">—</option><option value="Very Fair">Very Fair</option><option value="Fair">Fair</option><option value="Wheatish">Wheatish</option><option value="Medium">Medium</option><option value="Brown">Brown</option><option value="Dark">Dark</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Blood group", "রক্তের গ্রুপ")}</span>
              <select value={profileForm.bloodGroup} onChange={(e) => setProfileForm((c) => ({ ...c, bloodGroup: e.target.value }))}>
                <option value="">—</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </label>
          </div>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "Religion & Community", "ধর্ম ও সম্প্রদায়")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Religion", "ধর্ম")}</span>
              <select value={profileForm.religion} onChange={(e) => setProfileForm((c) => ({ ...c, religion: e.target.value }))}>
                <option value="">—</option><option value="Muslim">Muslim</option><option value="Hindu">Hindu</option><option value="Christian">Christian</option><option value="Buddhist">Buddhist</option><option value="Other">Other</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Sect / Subgroup", "মাজহাব / সাবগ্রুপ")}</span>
              <input type="text" value={profileForm.religionSubgroup} onChange={(e) => setProfileForm((c) => ({ ...c, religionSubgroup: e.target.value }))} placeholder="e.g. Sunni, Shia" />
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Mother tongue", "মাতৃভাষা")}</span>
              <input type="text" value={profileForm.motherTongue} onChange={(e) => setProfileForm((c) => ({ ...c, motherTongue: e.target.value }))} />
            </label>
            <label className="field"><span>{localeText(locale, "Family values", "পারিবারিক মূল্যবোধ")}</span>
              <select value={profileForm.familyValues} onChange={(e) => setProfileForm((c) => ({ ...c, familyValues: e.target.value }))}>
                <option value="">—</option><option value="Religious">Religious</option><option value="Traditional">Traditional</option><option value="Moderate">Moderate</option><option value="Liberal">Liberal</option>
              </select>
            </label>
          </div>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "Education & Career", "শিক্ষা ও ক্যারিয়ার")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Education level", "শিক্ষাগত যোগ্যতা")}</span>
              <select value={profileForm.educationLevel} onChange={(e) => setProfileForm((c) => ({ ...c, educationLevel: e.target.value }))}>
                <option value="">—</option>
                {educationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Major / Field", "বিষয়")}</span>
              <input type="text" value={profileForm.educationMajor} onChange={(e) => setProfileForm((c) => ({ ...c, educationMajor: e.target.value }))} placeholder="e.g. Computer Science" />
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "College / University", "কলেজ / বিশ্ববিদ্যালয়")}</span>
              <input type="text" value={profileForm.universityName} onChange={(e) => setProfileForm((c) => ({ ...c, universityName: e.target.value }))} placeholder="e.g. University of Dhaka" />
            </label>
            <label className="field"><span>{localeText(locale, "Profession", "পেশা")}</span>
              <select value={profileForm.profession} onChange={(e) => setProfileForm((c) => ({ ...c, profession: e.target.value }))}>
                <option value="">—</option>
                {professionOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Designation", "পদবী")}</span>
              <input type="text" value={profileForm.designation} onChange={(e) => setProfileForm((c) => ({ ...c, designation: e.target.value }))} placeholder="e.g. Senior Engineer" />
            </label>
            <label className="field"><span>{localeText(locale, "Income range", "আয়ের পরিসীমা")}</span>
              <select value={profileForm.annualIncomeBand} onChange={(e) => setProfileForm((c) => ({ ...c, annualIncomeBand: e.target.value }))}>
                <option value="">—</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Below 2 Lakh">Below 2 Lakh BDT</option>
                <option value="2-5 Lakh">2-5 Lakh BDT</option>
                <option value="5-10 Lakh">5-10 Lakh BDT</option>
                <option value="10-20 Lakh">10-20 Lakh BDT</option>
                <option value="20-50 Lakh">20-50 Lakh BDT</option>
                <option value="50+ Lakh">50+ Lakh BDT</option>
              </select>
            </label>
          </div>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "Location", "ঠিকানা")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Current country", "বর্তমান দেশ")}</span>
              <select value={profileForm.currentCountryCode} onChange={(e) => setProfileForm((c) => ({ ...c, currentCountryCode: e.target.value }))}>
                <option value="">—</option>
                {extendedCountries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Current city", "বর্তমান শহর")}</span>
              <input type="text" value={profileForm.currentCity} onChange={(e) => setProfileForm((c) => ({ ...c, currentCity: e.target.value }))} placeholder="e.g. Dhaka, London" />
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Current area", "বর্তমান এলাকা")}</span>
              <input type="text" value={profileForm.currentArea} onChange={(e) => setProfileForm((c) => ({ ...c, currentArea: e.target.value }))} placeholder="e.g. Gulshan, Dhanmondi" />
            </label>
            <label className="field"><span>{localeText(locale, "Residential status", "বাসস্থানের ধরন")}</span>
              <select value={profileForm.residenceStatus} onChange={(e) => setProfileForm((c) => ({ ...c, residenceStatus: e.target.value }))}>
                <option value="">—</option><option value="Rental">Rental</option><option value="Owner">Owner</option>
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Home country", "স্থায়ী দেশ")}</span>
              <select value={profileForm.homeCountryCode} onChange={(e) => setProfileForm((c) => ({ ...c, homeCountryCode: e.target.value }))}>
                <option value="">—</option>
                {extendedCountries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Home district", "নিজ জেলা")}</span>
              <select value={profileForm.homeDistrict} onChange={(e) => setProfileForm((c) => ({ ...c, homeDistrict: e.target.value }))}>
                <option value="">—</option>
                {bdDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "Family & Guardian", "পরিবার ও অভিভাবক")}</p>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Father", "পিতা")}</span>
              <select value={profileForm.fatherStatus} onChange={(e) => setProfileForm((c) => ({ ...c, fatherStatus: e.target.value }))}>
                <option value="">—</option><option value="Employed">Employed</option><option value="Business">Business</option><option value="Retired">Retired</option><option value="Professional">Professional</option><option value="Not Employed">Not Employed</option><option value="Passed Away">Passed Away</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Mother", "মাতা")}</span>
              <select value={profileForm.motherStatus} onChange={(e) => setProfileForm((c) => ({ ...c, motherStatus: e.target.value }))}>
                <option value="">—</option><option value="Homemaker">Homemaker</option><option value="Employed">Employed</option><option value="Business">Business</option><option value="Retired">Retired</option><option value="Professional">Professional</option><option value="Passed Away">Passed Away</option>
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Brother(s)", "ভাই")}</span>
              <select value={profileForm.brothersCount} onChange={(e) => setProfileForm((c) => ({ ...c, brothersCount: e.target.value }))}>
                <option value="">—</option>{Array.from({ length: 11 }, (_, i) => <option key={i} value={String(i)}>{i}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Sister(s)", "বোন")}</span>
              <select value={profileForm.sistersCount} onChange={(e) => setProfileForm((c) => ({ ...c, sistersCount: e.target.value }))}>
                <option value="">—</option>{Array.from({ length: 11 }, (_, i) => <option key={i} value={String(i)}>{i}</option>)}
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Family involvement", "পারিবারিক সম্পৃক্ততা")}</span>
              <select value={profileForm.familyInvolvementLevel} onChange={(e) => setProfileForm((c) => ({ ...c, familyInvolvementLevel: e.target.value }))}>
                <option value="">—</option><option value="Very Involved">Very Involved</option><option value="Involved">Involved</option><option value="Somewhat Involved">Somewhat Involved</option><option value="Not Involved">Not Involved</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Guardian name", "অভিভাবকের নাম")}</span>
              <input type="text" value={profileForm.guardianName} onChange={(e) => setProfileForm((c) => ({ ...c, guardianName: e.target.value }))} />
            </label>
          </div>
          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Guardian relation", "অভিভাবকের সম্পর্ক")}</span>
              <select value={profileForm.guardianRelation} onChange={(e) => setProfileForm((c) => ({ ...c, guardianRelation: e.target.value }))}>
                <option value="">—</option><option value="Father">Father</option><option value="Mother">Mother</option><option value="Brother">Brother</option><option value="Sister">Sister</option><option value="Uncle">Uncle</option><option value="Other">Other</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Guardian phone", "অভিভাবকের ফোন")}</span>
              <input type="text" value={profileForm.guardianPhone} onChange={(e) => setProfileForm((c) => ({ ...c, guardianPhone: e.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {localeText(locale, "Family details", "পারিবারিক বিবরণ")}
              <button type="button" className="button button-soft" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => { const text = generateSmartFamilyDetails({ religion: profileForm.religion, familyValues: profileForm.familyValues, currentCity: profileForm.currentCity }); setProfileForm((c) => ({ ...c, familyDetails: text })); }}>AI Suggest</button>
            </span>
            <textarea rows={4} value={profileForm.familyDetails} onChange={(e) => setProfileForm((c) => ({ ...c, familyDetails: e.target.value }))} placeholder={localeText(locale, "Tell about your family background...", "আপনার পরিবার সম্পর্কে লিখুন...")} />
          </label>

          <p className="section-kicker" style={{ marginTop: 16 }}>{localeText(locale, "About Me", "আমার সম্পর্কে")}</p>
          <label className="field">
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {localeText(locale, "About me", "আমার সম্পর্কে")}
              <button type="button" className="button button-soft" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => { const text = generateSmartBio({ firstName: data.profile.firstName, profession: profileForm.profession, educationLevel: profileForm.educationLevel, universityName: profileForm.universityName, currentCity: profileForm.currentCity, currentCountryCode: profileForm.currentCountryCode, religion: profileForm.religion, lookingFor: data.profile.lookingFor }); setProfileForm((c) => ({ ...c, aboutMe: text })); }}>AI Suggest</button>
            </span>
            <textarea rows={5} value={profileForm.aboutMe} onChange={(e) => setProfileForm((c) => ({ ...c, aboutMe: e.target.value }))} />
          </label>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => void saveProfile()}
              disabled={busyKey === "profile"}
            >
              {busyKey === "profile"
                ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                : localeText(locale, "Save Profile", "প্রোফাইল সেভ করুন")}
            </button>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel-wide" style={{ ...(memberSection === "profile" ? { display: "none" } : {}), marginTop: 16 }}>
          <SectionTitle
            kicker={localeText(locale, "Partner Preference", "পার্টনার পছন্দ")}
            title={localeText(locale, "Match criteria", "ম্যাচের মানদণ্ড")}
          />

          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Looking for", "খুঁজছেন")}</span>
              <select value={preferenceForm.gender} onChange={(e) => setPreferenceForm((c) => ({ ...c, gender: e.target.value }))}>
                <option value="">{localeText(locale, "Select", "নির্বাচন করুন")}</option>
                <option value="MAN">{localeText(locale, "Man", "পুরুষ")}</option>
                <option value="WOMAN">{localeText(locale, "Woman", "নারী")}</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Preferred religion", "পছন্দের ধর্ম")}</span>
              <select value={preferenceForm.religions} onChange={(e) => setPreferenceForm((c) => ({ ...c, religions: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                <option value="Muslim">Muslim</option><option value="Hindu">Hindu</option>
                <option value="Christian">Christian</option><option value="Buddhist">Buddhist</option><option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Age from", "বয়স থেকে")}</span>
              <select value={preferenceForm.ageMin} onChange={(e) => setPreferenceForm((c) => ({ ...c, ageMin: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                {Array.from({ length: 53 }, (_, i) => i + 18).map((a) => <option key={a} value={String(a)}>{a}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Age to", "বয়স পর্যন্ত")}</span>
              <select value={preferenceForm.ageMax} onChange={(e) => setPreferenceForm((c) => ({ ...c, ageMax: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                {Array.from({ length: 53 }, (_, i) => i + 18).map((a) => <option key={a} value={String(a)}>{a}</option>)}
              </select>
            </label>
          </div>

          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Mother tongue", "মাতৃভাষা")}</span>
              <select value={preferenceForm.motherTongues} onChange={(e) => setPreferenceForm((c) => ({ ...c, motherTongues: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                <option value="Bangla">Bangla</option><option value="English">English</option>
                <option value="Sylheti">Sylheti</option><option value="Chittagonian">Chittagonian</option>
                <option value="Urdu">Urdu</option><option value="Hindi">Hindi</option>
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Education level", "শিক্ষাগত যোগ্যতা")}</span>
              <select value={preferenceForm.educationLevels} onChange={(e) => setPreferenceForm((c) => ({ ...c, educationLevels: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                {educationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          <div className="input-grid">
            <label className="field"><span>{localeText(locale, "Home country", "স্থায়ী দেশ")}</span>
              <select value={preferenceForm.homeCountryCodes} onChange={(e) => setPreferenceForm((c) => ({ ...c, homeCountryCodes: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                {extendedCountries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
            <label className="field"><span>{localeText(locale, "Living country", "বর্তমান দেশ")}</span>
              <select value={preferenceForm.livingCountryCodes} onChange={(e) => setPreferenceForm((c) => ({ ...c, livingCountryCodes: e.target.value }))}>
                <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                {extendedCountries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
          </div>

          <label className="field">
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {localeText(locale, "About preferred partner", "পছন্দের পার্টনার সম্পর্কে")}
              <button type="button" className="button button-soft" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => { const text = generateSmartPartnerPreference({ gender: preferenceForm.gender, ageMin: preferenceForm.ageMin, ageMax: preferenceForm.ageMax, religions: preferenceForm.religions, educationLevels: preferenceForm.educationLevels, professions: preferenceForm.professions, livingCountryCodes: preferenceForm.livingCountryCodes }); setPreferenceForm((c) => ({ ...c, aboutPartner: text })); }}>AI Suggest</button>
            </span>
            <textarea rows={5} value={preferenceForm.aboutPartner} onChange={(e) => setPreferenceForm((c) => ({ ...c, aboutPartner: e.target.value }))} placeholder={localeText(locale, "Describe what you are looking for...", "আপনি কী খুঁজছেন তা বর্ণনা করুন...")} />
          </label>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => void savePreferences()}
              disabled={busyKey === "preferences"}
            >
              {busyKey === "preferences"
                ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                : localeText(locale, "Save Preferences", "পছন্দ সেভ করুন")}
            </button>
          </div>
        </article>
      </div>

      {/* ── Media + Billing ── */}
      <div style={memberSection !== "media" && memberSection !== "billing" ? { display: "none" } : undefined}>
        <article className="dashboard-panel dashboard-panel-wide" style={memberSection === "billing" ? { display: "none" } : undefined}>
          <SectionTitle
            kicker={localeText(locale, "Media", "মিডিয়া")}
            title={localeText(locale, "Upload profile photos and documents", "প্রোফাইল ছবি এবং ডকুমেন্ট আপলোড করুন")}
            detail={
              <StatusPill tone="teal">
                {media.length} {localeText(locale, "item(s)", "আইটেম")}
              </StatusPill>
            }
          />

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Media type", "মিডিয়ার ধরন")}</span>
              <select
                value={uploadForm.mediaType}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    mediaType: event.target.value as MediaUploadFormState["mediaType"],
                    isPrimary:
                      event.target.value === "PROFILE_PHOTO" ? current.isPrimary : false,
                  }))
                }
              >
                <option value="PROFILE_PHOTO">
                  {translateMediaType("PROFILE_PHOTO", locale)}
                </option>
                <option value="BIODATA">{translateMediaType("BIODATA", locale)}</option>
                <option value="DOCUMENT">{translateMediaType("DOCUMENT", locale)}</option>
                <option value="VIDEO">{localeText(locale, "Video", "ভিডিও")}</option>
                <option value="VERIFICATION">
                  {translateMediaType("VERIFICATION", locale)}
                </option>
              </select>
            </label>

            <label className="field">
              <span>{localeText(locale, "Privacy", "প্রাইভেসি")}</span>
              <select
                value={uploadForm.privacyMode}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    privacyMode: event.target.value as MediaUploadFormState["privacyMode"],
                  }))
                }
              >
                <option value="PUBLIC">{translatePrivacyMode("PUBLIC", locale)}</option>
                <option value="PRIVATE">{translatePrivacyMode("PRIVATE", locale)}</option>
                <option value="BLURRED_PUBLIC">
                  {translatePrivacyMode("BLURRED_PUBLIC", locale)}
                </option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>{localeText(locale, "Choose file", "ফাইল বেছে নিন")}</span>
            <input type="file" onChange={handleFileChange} />
          </label>

          {uploadForm.mediaType === "PROFILE_PHOTO" ? (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={uploadForm.isPrimary}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    isPrimary: event.target.checked,
                  }))
                }
              />
              <span>{localeText(locale, "Make this the primary profile photo", "এটিকে মূল প্রোফাইল ছবি করুন")}</span>
            </label>
          ) : null}

          <p className="form-note">
            {localeText(
              locale,
              "Browser uploads go directly to the Borbodhu test bucket using signed URLs, then the file is registered for admin moderation.",
              "ব্রাউজার আপলোড signed URL ব্যবহার করে সরাসরি Borbodhu টেস্ট বাকেটে যায়, তারপর ফাইলটি অ্যাডমিন মডারেশনের জন্য নিবন্ধিত হয়।",
            )}
          </p>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => void uploadMedia()}
              disabled={busyKey === "upload-media"}
            >
              {busyKey === "upload-media"
                ? localeText(locale, "Uploading...", "আপলোড হচ্ছে...")
                : localeText(locale, "Upload Media", "মিডিয়া আপলোড করুন")}
            </button>
          </div>

          {media.length ? (
            <div className="card-grid">
              {media.map((item) => (
                <article key={item.id} className="mini-card">
                  {item.thumbnailUrl || item.storageUrl ? (
                    <img
                      src={item.thumbnailUrl ?? item.storageUrl ?? undefined}
                      alt={translateMediaType(item.mediaType, locale)}
                      className="mini-card-media"
                    />
                  ) : (
                    <div className="mini-card-media mini-card-media-placeholder">
                      {translateMediaType(item.mediaType, locale)}
                    </div>
                  )}

                  <div className="mini-card-body">
                    <div className="tag-list">
                      <StatusPill tone="teal">
                        {translateMediaType(item.mediaType, locale)}
                      </StatusPill>
                      <StatusPill
                        tone={
                          item.approvalStatus === "APPROVED"
                            ? "leaf"
                            : item.approvalStatus === "PENDING"
                              ? "gold"
                              : "rose"
                        }
                      >
                        {translateApprovalStatus(item.approvalStatus, locale)}
                      </StatusPill>
                    </div>
                    <p className="mini-text">{item.storagePath.split("/").pop()}</p>
                    <p className="mini-text">
                      {translatePrivacyMode(item.privacyMode, locale)}
                      {item.isPrimary
                        ? ` • ${localeText(locale, "Primary", "মূল")}`
                        : ""}
                    </p>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="button button-soft"
                        onClick={() =>
                          void updateMedia(
                            item.id,
                            {
                              privacyMode:
                                item.privacyMode === "PRIVATE" ? "PUBLIC" : "PRIVATE",
                            },
                            item.privacyMode === "PRIVATE"
                              ? localeText(locale, "Media changed to public.", "মিডিয়া পাবলিক করা হয়েছে।")
                              : localeText(locale, "Media changed to private.", "মিডিয়া প্রাইভেট করা হয়েছে।"),
                          )
                        }
                        disabled={busyKey === `media:${item.id}`}
                      >
                        {item.privacyMode === "PRIVATE"
                          ? localeText(locale, "Make Public", "পাবলিক করুন")
                          : localeText(locale, "Make Private", "প্রাইভেট করুন")}
                      </button>
                      {item.mediaType === "PROFILE_PHOTO" && !item.isPrimary ? (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() =>
                            void updateMedia(
                              item.id,
                              {
                                isPrimary: true,
                              },
                              localeText(locale, "Primary photo updated.", "মূল ছবি আপডেট হয়েছে।"),
                            )
                          }
                          disabled={busyKey === `media:${item.id}`}
                        >
                          {localeText(locale, "Make Primary", "মূল করুন")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button button-soft"
                        style={{ fontSize: "0.78rem", padding: "4px 10px", color: "#dc2626" }}
                        disabled={busyKey === `delete-media:${item.id}`}
                        onClick={async () => {
                          if (!window.confirm(localeText(locale, "Delete this media permanently?", "এই মিডিয়া স্থায়ীভাবে মুছে ফেলবেন?"))) return;
                          setBusyKey(`delete-media:${item.id}`);
                          try {
                            await apiRequest(`/media/member/me/${item.id}`, { method: "DELETE", token: accessToken });
                            setFeedback(localeText(locale, "Media deleted", "মিডিয়া মুছে ফেলা হয়েছে"));
                            await onRefresh();
                          } catch (err) {
                            setError(getErrorMessage(err));
                          } finally {
                            setBusyKey(null);
                          }
                        }}
                      >
                        {busyKey === `delete-media:${item.id}` ? "..." : localeText(locale, "Delete", "মুছুন")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>{localeText(locale, "No media uploaded yet.", "এখনও কোনো মিডিয়া আপলোড হয়নি।")}</EmptyState>
          )}
        </article>

        <article className="dashboard-panel dashboard-panel-wide" style={{ ...(memberSection === "media" ? { display: "none" } : {}), marginTop: 16 }}>
          <SectionTitle
            kicker={localeText(locale, "Membership", "মেম্বারশিপ")}
            title={localeText(locale, "Upgrade and payment review", "আপগ্রেড এবং পেমেন্ট রিভিউ")}
            detail={
              <StatusPill tone="gold">
                {orders.length} {localeText(locale, "order(s)", "অর্ডার")}
              </StatusPill>
            }
          />

          {/* Online Plans */}
          {plans.filter((p) => (p.category ?? "ONLINE") === "ONLINE").length > 0 && (
            <>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--muted)", margin: "12px 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {localeText(locale, "Online Membership", "অনলাইন মেম্বারশিপ")}
              </p>
              <div className="select-card-grid">
                {plans.filter((p) => (p.category ?? "ONLINE") === "ONLINE").map((plan) => {
                  const isSelected = billingForm.membershipPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className={`select-card${isSelected ? " select-card-active" : ""}`}
                      onClick={() =>
                        setBillingForm((current) => ({
                          ...current,
                          membershipPlanId: plan.id,
                        }))
                      }
                    >
                      <strong>{locale === "bn" ? plan.nameBn ?? plan.nameEn : plan.nameEn}</strong>
                      <span>
                        {plan.durationDays} {localeText(locale, "days", "দিন")}
                      </span>
                      <span>{plan.bdtPrice} BDT</span>
                      <span>
                        {plan.contactLimit ?? localeText(locale, "Unlimited", "সীমাহীন")}{" "}
                        {localeText(locale, "contacts", "কন্টাক্ট")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Assisted Plans */}
          {plans.filter((p) => p.category === "ASSISTED").length > 0 && (
            <>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#2e7d6f", margin: "18px 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {localeText(locale, "Assisted Matrimony", "এসিস্টেড ম্যাট্রিমনি")}
              </p>
              <div className="select-card-grid">
                {plans.filter((p) => p.category === "ASSISTED").map((plan) => {
                  const isSelected = billingForm.membershipPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className={`select-card${isSelected ? " select-card-active" : ""}`}
                      style={isSelected ? { borderColor: "#2e7d6f" } : {}}
                      onClick={() =>
                        setBillingForm((current) => ({
                          ...current,
                          membershipPlanId: plan.id,
                        }))
                      }
                    >
                      <strong>{locale === "bn" ? plan.nameBn ?? plan.nameEn : plan.nameEn}</strong>
                      <span>
                        {plan.durationDays} {localeText(locale, "days", "দিন")}
                      </span>
                      <span>{plan.bdtPrice} BDT</span>
                      <span style={{ fontSize: "0.78rem", color: "#2e7d6f" }}>
                        {localeText(locale, "Dedicated matchmaker", "ডেডিকেটেড ম্যাচমেকার")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Gateway", "গেটওয়ে")}</span>
              <select
                value={billingForm.gateway}
                onChange={(event) =>
                  setBillingForm((current) => ({
                    ...current,
                    gateway: event.target.value as BillingFormState["gateway"],
                  }))
                }
              >
                <option value="OFFICE">{translateGateway("OFFICE", locale)}</option>
                <option value="MANUAL">{translateGateway("MANUAL", locale)}</option>
                <option value="AMARPAY">aamarPay</option>
                <option value="PAYPAL">PayPal</option>
              </select>
            </label>

            <label className="field">
              <span>{localeText(locale, "Coupon code", "কুপন কোড")}</span>
              <input
                type="text"
                value={billingForm.couponCode}
                onChange={(event) =>
                  setBillingForm((current) => ({
                    ...current,
                    couponCode: event.target.value.toUpperCase(),
                  }))
                }
                placeholder={localeText(locale, "Optional", "ঐচ্ছিক")}
              />
            </label>
          </div>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-soft"
              onClick={() => void previewMembership()}
              disabled={busyKey === "preview-membership"}
            >
              {busyKey === "preview-membership"
                ? localeText(locale, "Checking...", "পরীক্ষা হচ্ছে...")
                : localeText(locale, "Preview Upgrade", "আপগ্রেড প্রিভিউ")}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => void createMembershipOrder()}
              disabled={busyKey === "create-order"}
            >
              {busyKey === "create-order"
                ? localeText(locale, "Creating...", "তৈরি হচ্ছে...")
                : localeText(locale, "Create Order", "অর্ডার তৈরি করুন")}
            </button>
          </div>

          {preview ? (
            <div className="summary-card">
              <div className="summary-row">
                <span>{preview.plan.nameEn}</span>
                <strong>
                  {preview.finalAmount} {preview.currency}
                </strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Subtotal", "সাবটোটাল")}</span>
                <span>
                  {preview.subtotalAmount} {preview.currency}
                </span>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Discount", "ডিসকাউন্ট")}</span>
                <span>
                  {preview.discountAmount} {preview.currency}
                </span>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Activation", "অ্যাক্টিভেশন")}</span>
                <span>{preview.activationRule.replaceAll("_", " ")}</span>
              </div>
            </div>
          ) : null}

          {orders.length ? (
            <div className="stack-list">
              {orders.map((order) => (
                <article key={order.id} className="mini-card mini-card-horizontal">
                  <div className="mini-card-body">
                    <div className="panel-header">
                      <div>
                        <strong>{translateGateway(order.gateway, locale)}</strong>
                        <p className="mini-text">
                          {order.finalAmount} {order.currency}
                        </p>
                      </div>
                      <StatusPill
                        tone={
                          order.status.includes("APPROVED")
                            ? "leaf"
                            : order.status.includes("REVIEW")
                              ? "gold"
                              : "rose"
                        }
                      >
                        {translatePaymentStatus(order.status, locale)}
                      </StatusPill>
                    </div>
                    <p className="mini-text">
                      {localeText(locale, "Created", "তৈরি হয়েছে")}{" "}
                      {formatDateTime(order.createdAt, locale)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>{localeText(locale, "No membership orders yet.", "এখনও কোনো মেম্বারশিপ অর্ডার নেই।")}</EmptyState>
          )}
        </article>
      </div>

      {/* ── Mailbox + Discovery ── */}
      <div style={memberSection !== "mailbox" && memberSection !== "discovery" ? { display: "none" } : undefined}>
        <article className="dashboard-panel dashboard-panel-wide" style={memberSection === "discovery" ? { display: "none" } : undefined}>
          <SectionTitle
            kicker={localeText(locale, "Mailbox", "মেইলবক্স")}
            title={localeText(locale, "Member conversations", "মেম্বার কথোপকথন")}
            detail={
              <StatusPill tone="teal">
                {conversations.length} {localeText(locale, "thread(s)", "থ্রেড")}
              </StatusPill>
            }
          />

          <div className="mailbox-layout">
            <div className="conversation-list">
              {conversations.length ? (
                conversations.map((conversation) => {
                  const isSelected = selectedConversationId === conversation.id;
                  const cName = conversation.counterpart?.memberProfile?.displayName;
                  const safeCName = (!cName || /^NULL$/i.test(cName.trim()) || /^NULL\s+NULL$/i.test(cName.trim()) || cName.trim() === "")
                    ? (conversation.counterpart?.memberProfile?.displayId ?? conversation.counterpart?.email ?? localeText(locale, "Member", "মেম্বার"))
                    : cName;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`conversation-card${isSelected ? " conversation-card-active" : ""}`}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <strong>
                        {safeCName}
                      </strong>
                      <span>
                        {conversation.lastMessage?.body ??
                          localeText(locale, "No messages yet.", "এখনও কোনো বার্তা নেই।")}
                      </span>
                      <small>{formatDateTime(conversation.updatedAt, locale)}</small>
                    </button>
                  );
                })
              ) : (
                <EmptyState>
                  {localeText(
                    locale,
                    "No conversations yet. Start one from Discovery.",
                    "এখনও কোনো কথোপকথন নেই। ডিসকভারি থেকে একটি শুরু করুন।",
                  )}
                </EmptyState>
              )}
            </div>

            <div className="message-pane">
              {selectedConversationId ? (
                <>
                  <div className="message-thread">
                    {isMessagesLoading ? (
                      <EmptyState>{localeText(locale, "Loading conversation...", "কথোপকথন লোড হচ্ছে...")}</EmptyState>
                    ) : conversationMessages?.messages.length ? (
                      conversationMessages.messages.map((message) => {
                        const isSelf = message.senderUserId === currentUserId;
                        const sName = message.senderMemberProfile?.displayName;
                        const safeSName = (!sName || /^NULL$/i.test(sName.trim()) || /^NULL\s+NULL$/i.test(sName.trim()) || sName.trim() === "")
                          ? (message.senderMemberProfile?.displayId ?? message.senderUser.email)
                          : sName;

                        return (
                          <article
                            key={message.id}
                            className={`message-bubble${isSelf ? " message-bubble-self" : ""}`}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ width: 28, height: 28, borderRadius: "50%", background: isSelf ? "var(--rose)" : "var(--leaf)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                                {safeSName.charAt(0).toUpperCase()}
                              </span>
                              <strong>
                                {message.senderMemberProfile?.displayId ? (
                                  <Link href={`/profiles/${message.senderMemberProfile.displayId}`} style={{ color: "inherit", textDecoration: "underline" }}>
                                    {safeSName}
                                  </Link>
                                ) : (
                                  safeSName
                                )}
                              </strong>
                            </div>
                            <p>{message.body}</p>
                            <small>{formatDateTime(message.sentAt, locale)}</small>
                          </article>
                        );
                      })
                    ) : (
                      <EmptyState>{localeText(locale, "No messages in this thread yet. Send the first message below.", "এই থ্রেডে এখনও কোনো বার্তা নেই। নিচে প্রথম বার্তা পাঠান।")}</EmptyState>
                    )}
                  </div>

                  {!isMessagesLoading && (
                  <>
                  <label className="field">
                    <span>{localeText(locale, "Reply", "উত্তর")}</span>
                    <textarea
                      rows={4}
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder={localeText(locale, "Write a respectful message...", "ভদ্র একটি বার্তা লিখুন...")}
                    />
                  </label>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void sendMessage()}
                      disabled={busyKey === "send-message"}
                    >
                      {busyKey === "send-message"
                        ? localeText(locale, "Sending...", "পাঠানো হচ্ছে...")
                        : localeText(locale, "Send Message", "বার্তা পাঠান")}
                    </button>
                  </div>
                  </>
                  )}
                </>
              ) : (
                <EmptyState>{localeText(locale, "Select a conversation to open the mailbox.", "মেইলবক্স খুলতে একটি কথোপকথন বেছে নিন।")}</EmptyState>
              )}
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel-wide" style={{ ...(memberSection === "mailbox" ? { display: "none" } : {}), marginTop: 16 }}>
          <SectionTitle
            kicker={localeText(locale, "Search & Discovery", "সার্চ ও ডিসকভারি")}
            title={localeText(locale, "Find your match", "আপনার ম্যাচ খুঁজুন")}
            detail={
              discoveryState ? (
                <StatusPill tone="teal">
                  {discoveryState.total} {localeText(locale, "result(s)", "ফলাফল")}
                </StatusPill>
              ) : null
            }
          />

          <div className="dashboard-stack">
            {/* Saved searches — moved above search form for visibility */}
            {savedSearchState.length ? (
              <div className="stack-list">
                <p style={{ fontWeight: 600, fontSize: "0.88rem", margin: "0 0 8px" }}>{localeText(locale, "Saved Searches", "সেভ করা সার্চ")}</p>
                {savedSearchState.map((search) => (
                  <article key={search.id} className="summary-card">
                    <div className="panel-header">
                      <div>
                        <strong>{search.name}</strong>
                        <p className="mini-text">{formatDateTime(search.updatedAt, locale)}</p>
                      </div>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="button button-soft"
                          onClick={() => {
                            const next = normalizeSavedSearchCriteria(search.criteriaJson);
                            setDiscoveryForm(next);
                            void runDiscoverySearch(next);
                          }}
                        >
                          {localeText(locale, "Apply", "প্রয়োগ করুন")}
                        </button>
                        <button
                          type="button"
                          className="button button-soft"
                          onClick={() => void deleteSavedSearch(search.id)}
                          disabled={busyKey === `delete-search:${search.id}`}
                        >
                          {busyKey === `delete-search:${search.id}`
                            ? localeText(locale, "Removing...", "মুছে ফেলা হচ্ছে...")
                            : localeText(locale, "Delete", "মুছুন")}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {/* Search tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #eee" }}>
              {(["quick", "advanced", "photo"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSearchTab(tab);
                    if (tab === "photo") setDiscoveryForm((f) => ({ ...f, hasPhoto: true }));
                    else setDiscoveryForm((f) => ({ ...f, hasPhoto: false }));
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderBottom: searchTab === tab ? "2px solid var(--rose)" : "2px solid transparent",
                    marginBottom: -2,
                    background: "none",
                    cursor: "pointer",
                    fontWeight: searchTab === tab ? 600 : 400,
                    color: searchTab === tab ? "var(--rose)" : "#666",
                    fontSize: "0.9rem",
                  }}
                >
                  {tab === "quick" ? localeText(locale, "Quick Search", "দ্রুত সার্চ")
                   : tab === "advanced" ? localeText(locale, "Advanced", "বিস্তারিত")
                   : localeText(locale, "Photo Search", "ফটো সার্চ")}
                </button>
              ))}
            </div>

            <div className="input-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {/* Quick tab fields — always visible */}
              <label className="field">
                <span>{localeText(locale, "Seeking", "খুঁজছি")}</span>
                <select value={discoveryForm.gender} onChange={(e) => setDiscoveryForm((c) => ({ ...c, gender: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="MAN">{localeText(locale, "Man", "পুরুষ")}</option>
                  <option value="WOMAN">{localeText(locale, "Woman", "নারী")}</option>
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Age from", "বয়স শুরু")}</span>
                <select value={discoveryForm.ageMin} onChange={(e) => setDiscoveryForm((c) => ({ ...c, ageMin: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {Array.from({ length: 43 }, (_, i) => String(i + 18)).map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Age to", "বয়স শেষ")}</span>
                <select value={discoveryForm.ageMax} onChange={(e) => setDiscoveryForm((c) => ({ ...c, ageMax: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  {Array.from({ length: 43 }, (_, i) => String(i + 18)).map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Religion", "ধর্ম")}</span>
                <select value={discoveryForm.religion} onChange={(e) => setDiscoveryForm((c) => ({ ...c, religion: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Muslim">{localeText(locale, "Muslim", "মুসলিম")}</option>
                  <option value="Hindu">{localeText(locale, "Hindu", "হিন্দু")}</option>
                  <option value="Christian">{localeText(locale, "Christian", "খ্রিস্টান")}</option>
                  <option value="Buddhist">{localeText(locale, "Buddhist", "বৌদ্ধ")}</option>
                  <option value="Other">{localeText(locale, "Other", "অন্যান্য")}</option>
                </select>
              </label>

              <label className="field">
                <span>{localeText(locale, "Marital status", "বৈবাহিক অবস্থা")}</span>
                <select value={discoveryForm.maritalStatus} onChange={(e) => setDiscoveryForm((c) => ({ ...c, maritalStatus: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Never Married">{localeText(locale, "Never Married", "অবিবাহিত")}</option>
                  <option value="Divorced">{localeText(locale, "Divorced", "তালাকপ্রাপ্ত")}</option>
                  <option value="Widowed">{localeText(locale, "Widowed", "বিধবা/বিপত্নীক")}</option>
                  <option value="Separated">{localeText(locale, "Separated", "পৃথক")}</option>
                </select>
              </label>

              {/* Advanced-only fields — hidden on quick and photo tabs */}
              <label className="field" style={{ display: searchTab === "advanced" ? undefined : "none" }}>
                <span>{localeText(locale, "Mother tongue", "মাতৃভাষা")}</span>
                <select value={discoveryForm.motherTongue} onChange={(e) => setDiscoveryForm((c) => ({ ...c, motherTongue: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Bangla">{localeText(locale, "Bangla", "বাংলা")}</option>
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Other">{localeText(locale, "Other", "অন্যান্য")}</option>
                </select>
              </label>

              <label className="field" style={{ display: searchTab === "advanced" ? undefined : "none" }}>
                <span>{localeText(locale, "Country", "দেশ")}</span>
                <select value={discoveryForm.currentCountryCode} onChange={(e) => setDiscoveryForm((c) => ({ ...c, currentCountryCode: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="BD">Bangladesh</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AE">UAE</option>
                  <option value="AU">Australia</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="IN">India</option>
                  <option value="MY">Malaysia</option>
                  <option value="SG">Singapore</option>
                  <option value="QA">Qatar</option>
                  <option value="KW">Kuwait</option>
                  <option value="IT">Italy</option>
                </select>
              </label>

              <label className="field" style={{ display: searchTab === "advanced" ? undefined : "none" }}>
                <span>{localeText(locale, "Education", "শিক্ষা")}</span>
                <select value={discoveryForm.educationLevel} onChange={(e) => setDiscoveryForm((c) => ({ ...c, educationLevel: e.target.value }))}>
                  <option value="">{localeText(locale, "Any", "যেকোনো")}</option>
                  <option value="Phd/Doctorate">PhD / Doctorate</option>
                  <option value="Masters">Masters</option>
                  <option value="MBA">MBA</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Honours">Honours</option>
                  <option value="BBA">BBA</option>
                  <option value="Diploma">Diploma</option>
                  <option value="HSC">HSC</option>
                  <option value="SSC">SSC</option>
                </select>
              </label>

              <label className="field" style={{ display: searchTab === "advanced" ? undefined : "none" }}>
                <span>{localeText(locale, "Sort by", "সাজান")}</span>
                <select value={discoveryForm.sortBy} onChange={(e) => setDiscoveryForm((c) => ({ ...c, sortBy: e.target.value as DiscoverySearchFormState["sortBy"] }))}>
                  <option value="most_active">{localeText(locale, "Most active", "সবচেয়ে সক্রিয়")}</option>
                  <option value="recent_login">{localeText(locale, "Recent login", "সম্প্রতি লগ ইন")}</option>
                  <option value="new_signups">{localeText(locale, "New signups", "নতুন সাইন আপ")}</option>
                </select>
              </label>
            </div>

            <div className="input-grid" style={{ display: searchTab === "advanced" ? undefined : "none" }}>
              <label className="field">
                <span>{localeText(locale, "Keyword", "কীওয়ার্ড")}</span>
                <input
                  type="text"
                  value={discoveryForm.keyword}
                  onChange={(e) => setDiscoveryForm((c) => ({ ...c, keyword: e.target.value }))}
                  placeholder={localeText(locale, "city, profession, district", "শহর, পেশা, জেলা")}
                />
              </label>
              <label className="checkbox-row" style={{ alignSelf: "end", paddingBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={discoveryForm.hasPhoto}
                  onChange={(e) => setDiscoveryForm((c) => ({ ...c, hasPhoto: e.target.checked }))}
                />
                <span>{localeText(locale, "Only profiles with photo", "শুধু ছবি থাকা প্রোফাইল")}</span>
              </label>
            </div>

            {/* Photo tab hint */}
            {searchTab === "photo" && (
              <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 8px" }}>
                {localeText(locale, "Showing only profiles with photos. Adjust gender and age above.", "শুধু ছবি থাকা প্রোফাইল দেখানো হচ্ছে। উপরে লিঙ্গ ও বয়স পরিবর্তন করুন।")}
              </p>
            )}

            <div className="inline-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => void runDiscoverySearch()}
                disabled={busyKey === "search-discovery"}
              >
                {busyKey === "search-discovery"
                  ? localeText(locale, "Searching...", "খোঁজা হচ্ছে...")
                  : localeText(locale, "Search members", "মেম্বার সার্চ করুন")}
              </button>
              <button
                type="button"
                className="button button-soft"
                onClick={() => {
                  const next = toDiscoverySearchFormState(data.profile);
                  setDiscoveryForm(next);
                  void runDiscoverySearch(next);
                }}
              >
                {localeText(locale, "Reset to preference", "পছন্দ অনুযায়ী রিসেট")}
              </button>
              <Link href={localizePath("/profiles", locale)} className="button button-soft">
                {localeText(locale, "Public search page", "পাবলিক সার্চ পেজ")}
              </Link>
            </div>

            <div className="input-grid">
              <label className="field">
                <span>{localeText(locale, "Save this search", "এই সার্চ সেভ করুন")}</span>
                <input
                  type="text"
                  value={savedSearchName}
                  onChange={(event) => setSavedSearchName(event.target.value)}
                  placeholder={localeText(locale, "Dhaka Muslim professionals", "ঢাকার মুসলিম প্রফেশনালস")}
                />
              </label>
              <div className="field">
                <span>{localeText(locale, "Saved searches", "সেভ করা সার্চ")}</span>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="button button-soft"
                    onClick={() => void saveCurrentSearch()}
                    disabled={busyKey === "save-search"}
                  >
                    {busyKey === "save-search"
                      ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                      : localeText(locale, "Save current search", "বর্তমান সার্চ সেভ করুন")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showDiscoveryResults && (
            <>
              <div className="inline-actions" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setShowDiscoveryResults(false)}
                >
                  {localeText(locale, "← Back to Search", "← সার্চে ফিরুন")}
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {discoveryState?.total ?? 0} {localeText(locale, "result(s)", "ফলাফল")}
                </span>
              </div>
            </>
          )}

          {showDiscoveryResults && discoveryState?.results.length ? (
            <div className="card-grid">
              {discoveryState.results.map((profile) => {
                const safeName = (() => {
                  const raw = (profile.displayName ?? "").trim();
                  return (!raw || /^(NULL\s*)+$/i.test(raw) || raw === "—") ? profile.displayId : raw;
                })();

                return (
                  <article key={profile.id} className="mini-card">
                    {/* Photo */}
                    <div className="mini-card-media-wrap">
                      {profile.primaryPhotoUrl ? (
                        <img src={profile.primaryPhotoUrl} alt={safeName} className="mini-card-media" />
                      ) : (
                        <div className="mini-card-media mini-card-media-placeholder">
                          <span style={{ fontSize: 32, opacity: 0.4 }}>👤</span>
                        </div>
                      )}
                      {profile.age ? (
                        <span className="status-pill status-pill-gold" style={{ position: "absolute", top: 8, right: 8, fontSize: "0.75rem" }}>
                          {profile.age} {localeText(locale, "yrs", "বছর")}
                        </span>
                      ) : null}
                    </div>

                    <div className="mini-card-body">
                      {/* Name + ID */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: "0.95rem", lineHeight: 1.3 }}>{safeName}</strong>
                          <p className="mini-text" style={{ margin: "2px 0 0", fontSize: "0.75rem", opacity: 0.6 }}>{profile.displayId}</p>
                        </div>
                        <StatusPill tone="teal">
                          {translateGender(profile.gender, locale ?? "en")}
                        </StatusPill>
                      </div>

                      {/* Location */}
                      <p className="mini-text" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                        {titleCase(profile.currentCity) || localeText(locale, "Location pending", "লোকেশন অপেক্ষমাণ")}
                        {profile.currentCountryCode ? `, ${profile.currentCountryCode}` : ""}
                      </p>

                      {/* Tags */}
                      <div className="tag-list" style={{ gap: 4, marginTop: 6 }}>
                        {profile.religion ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.religion}</span> : null}
                        {profile.maritalStatus ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.maritalStatus}</span> : null}
                        {profile.motherTongue ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.motherTongue}</span> : null}
                        {profile.profession ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.profession}</span> : null}
                        {profile.educationLevel ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.educationLevel}</span> : null}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <Link
                          href={localizePath(`/profiles/${profile.displayId}`, locale) + "?from=dashboard"}
                          className="button button-soft"
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem", padding: "8px 10px" }}
                        >
                          {localeText(locale, "View Profile", "প্রোফাইল দেখুন")}
                        </Link>
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem", padding: "8px 10px" }}
                          onClick={() => void runDiscoveryAction(profile.id, "interests")}
                          disabled={busyKey === `interests:${profile.id}`}
                        >
                          {busyKey === `interests:${profile.id}`
                            ? localeText(locale, "Sending...", "পাঠানো হচ্ছে...")
                            : localeText(locale, "Send Interest", "আগ্রহ পাঠান")}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="button button-soft"
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", padding: "6px 8px" }}
                          onClick={() => void runDiscoveryAction(profile.id, "favorites")}
                          disabled={busyKey === `favorites:${profile.id}`}
                        >
                          {busyKey === `favorites:${profile.id}`
                            ? "..."
                            : localeText(locale, "♡ Favorite", "♡ পছন্দ")}
                        </button>
                        <button
                          type="button"
                          className="button button-soft"
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", padding: "6px 8px" }}
                          onClick={() => void runDiscoveryAction(profile.id, "photo-requests")}
                          disabled={busyKey === `photo-requests:${profile.id}`}
                        >
                          {busyKey === `photo-requests:${profile.id}`
                            ? "..."
                            : localeText(locale, "📷 Photo", "📷 ছবি")}
                        </button>
                        <button
                          type="button"
                          className="button button-soft"
                          style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", padding: "6px 8px" }}
                          onClick={() => void runDiscoveryAction(profile.id, "start-conversation")}
                          disabled={busyKey === `start-conversation:${profile.id}`}
                        >
                          {busyKey === `start-conversation:${profile.id}`
                            ? "..."
                            : localeText(locale, "💬 Message", "💬 মেসেজ")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : showDiscoveryResults ? (
            <EmptyState>{localeText(locale, "No discovery matches found. Try adjusting your search criteria.", "কোনো ডিসকভারি ম্যাচ পাওয়া যায়নি। সার্চ ফিল্টার পরিবর্তন করে দেখুন।")}</EmptyState>
          ) : null}
        </article>
      </div>

      {/* ── AI Suggestions ── */}
      <article className="dashboard-panel dashboard-panel-wide" style={memberSection !== "ai-suggestions" ? { display: "none" } : undefined}>
        <SectionTitle
          kicker={localeText(locale, "AI-Powered", "AI চালিত")}
          title={localeText(locale, "Smart Match Suggestions", "স্মার্ট ম্যাচ সাজেশন")}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void loadAiSuggestions()}
            disabled={aiLoading}
          >
            {aiLoading
              ? localeText(locale, "Loading Suggestions...", "সাজেশন লোড হচ্ছে...")
              : localeText(locale, "Load Suggestions", "সাজেশন লোড করুন")}
          </button>
          {aiMatches ? (
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {aiMatches.total} {localeText(locale, "match(es) found", "ম্যাচ পাওয়া গেছে")}
            </span>
          ) : null}
        </div>

        {aiLoading ? (
          <EmptyState>{localeText(locale, "Finding your best matches...", "আপনার সেরা ম্যাচ খোঁজা হচ্ছে...")}</EmptyState>
        ) : aiMatches?.results.length ? (
          <div className="card-grid">
            {aiMatches.results.map((profile) => {
              const safeName = (() => {
                const raw = (profile.displayName ?? "").trim();
                return (!raw || /^(NULL\s*)+$/i.test(raw) || raw === "\u2014") ? profile.displayId : raw;
              })();

              return (
                <article key={profile.id} className="mini-card">
                  <div className="mini-card-media-wrap">
                    {profile.primaryPhotoUrl ? (
                      <img src={profile.primaryPhotoUrl} alt={safeName} className="mini-card-media" />
                    ) : (
                      <div className="mini-card-media mini-card-media-placeholder">
                        <span style={{ fontSize: 32, opacity: 0.4 }}>👤</span>
                      </div>
                    )}
                    {profile.age ? (
                      <span className="status-pill status-pill-gold" style={{ position: "absolute", top: 8, right: 8, fontSize: "0.75rem" }}>
                        {profile.age} {localeText(locale, "yrs", "বছর")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mini-card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: "0.95rem", lineHeight: 1.3 }}>{safeName}</strong>
                        <p className="mini-text" style={{ margin: "2px 0 0", fontSize: "0.75rem", opacity: 0.6 }}>{profile.displayId}</p>
                      </div>
                      <StatusPill tone="teal">
                        {translateGender(profile.gender, locale ?? "en")}
                      </StatusPill>
                    </div>

                    <p className="mini-text" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                      {profile.currentCity ?? localeText(locale, "Location pending", "লোকেশন অপেক্ষমাণ")}
                      {profile.currentCountryCode ? `, ${profile.currentCountryCode}` : ""}
                    </p>

                    <div className="tag-list" style={{ gap: 4, marginTop: 6 }}>
                      {profile.religion ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.religion}</span> : null}
                      {profile.maritalStatus ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.maritalStatus}</span> : null}
                      {profile.motherTongue ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.motherTongue}</span> : null}
                      {profile.profession ? <span className="tag" style={{ fontSize: "0.72rem" }}>{profile.profession}</span> : null}
                    </div>

                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <Link
                        href={localizePath(`/profiles/${profile.displayId}`, locale) + "?from=dashboard"}
                        className="button button-soft"
                        style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem", padding: "8px 10px" }}
                      >
                        {localeText(locale, "View Profile", "প্রোফাইল দেখুন")}
                      </Link>
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem", padding: "8px 10px" }}
                        onClick={() => void runDiscoveryAction(profile.id, "interests")}
                        disabled={busyKey === `interests:${profile.id}`}
                      >
                        {busyKey === `interests:${profile.id}`
                          ? localeText(locale, "Sending...", "পাঠানো হচ্ছে...")
                          : localeText(locale, "Send Interest", "আগ্রহ পাঠান")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : aiMatches ? (
          <EmptyState>
            {localeText(locale, "No suggestions found. Try updating your partner preferences.", "কোনো সাজেশন পাওয়া যায়নি। পার্টনার পছন্দ আপডেট করে দেখুন।")}
          </EmptyState>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", padding: 24 }}>
            {localeText(locale,
              "AI suggestions are based on your partner preferences. Set your preferences first for better results.",
              "AI সাজেশন আপনার পার্টনার পছন্দের উপর ভিত্তি করে। ভালো ফলাফলের জন্য আগে পছন্দ সেট করুন।"
            )}
          </p>
        )}
      </article>

      {/* ---- Contacts Viewed ---- */}
      <div style={memberSection !== "contacts-viewed" ? { display: "none" } : undefined}>
        <h3 style={{ margin: "0 0 16px" }}>
          {localeText(locale, "Contacts Viewed", "যোগাযোগ দেখা হয়েছে")}
        </h3>

        {/* Membership summary bar */}
        {data?.membership ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 16px", background: "#dcfce7", borderRadius: 12, marginBottom: 16, fontSize: "0.88rem" }}>
            <span>💎 {data.membership.plan.nameEn}</span>
            <span>•</span>
            <span>{localeText(locale, "Contacts viewed", "যোগাযোগ দেখা হয়েছে")}: {contactUnlocks.length}</span>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", background: "#fef3c7", borderRadius: 12, marginBottom: 16, fontSize: "0.88rem" }}>
            🔒 {localeText(locale, "Upgrade to unlock contact details", "যোগাযোগের তথ্য দেখতে আপগ্রেড করুন")}
            {" "}
            <Link href="/upgrade" style={{ color: "var(--rose)", fontWeight: 600 }}>
              {localeText(locale, "View plans", "প্ল্যান দেখুন")}
            </Link>
          </div>
        )}

        {/* Contacts list */}
        {contactUnlocks.length > 0 ? (
          <div className="card-grid">
            {contactUnlocks.map((unlock) => (
              <div key={unlock.id} className="mini-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {unlock.profile.primaryPhotoUrl ? (
                    <img src={unlock.profile.primaryPhotoUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #8b1a30, #5c1020)", color: "white", fontWeight: 600, fontSize: "1rem" }}>
                      {(unlock.profile.displayName ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>
                      {unlock.profile.displayName || unlock.profile.displayId}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>
                      {unlock.profile.displayId}
                      {unlock.profile.age ? ` • ${unlock.profile.age} yrs` : ""}
                      {unlock.profile.currentCity ? ` • ${unlock.profile.currentCity}` : ""}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#aaa" }}>
                      {localeText(locale, "Viewed", "দেখা হয়েছে")} {new Date(unlock.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Link href={`/profiles/${unlock.profile.displayId}`} className="button button-soft" style={{ fontSize: "0.78rem", padding: "4px 12px" }}>
                    {localeText(locale, "View Profile", "প্রোফাইল দেখুন")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>👁️</p>
            <p style={{ color: "#888" }}>
              {localeText(locale, "No contacts viewed yet. Unlock contacts from profile pages.", "এখনও কোনো যোগাযোগ দেখা হয়নি। প্রোফাইল পেজ থেকে যোগাযোগ আনলক করুন।")}
            </p>
          </div>
        )}
      </div>

      {/* ── Wedding ── */}
      <div className="dashboard-grid" style={memberSection !== "wedding" ? { display: "none" } : undefined}>
        <article className="dashboard-panel">
          <SectionTitle
            kicker={localeText(locale, "Wedding Planning", "ওয়েডিং প্ল্যানিং")}
            title={localeText(locale, "Projects, guests, and shortlisted vendors", "প্রজেক্ট, অতিথি, এবং শর্টলিস্ট ভেন্ডর")}
            detail={
              <StatusPill tone="gold">
                {weddingProjects.length} project{weddingProjects.length === 1 ? "" : "s"}
              </StatusPill>
            }
          />

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Project title", "প্রজেক্টের শিরোনাম")}</span>
              <input
                type="text"
                value={projectForm.title}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={localeText(locale, "Amina Wedding Plan", "আমিনা ওয়েডিং প্ল্যান")}
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Wedding date", "বিয়ের তারিখ")}</span>
              <input
                type="date"
                value={projectForm.weddingDate}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    weddingDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "City", "শহর")}</span>
              <input
                type="text"
                value={projectForm.city}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Budget band", "বাজেট")}</span>
              <input
                type="text"
                value={projectForm.budgetBand}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    budgetBand: event.target.value,
                  }))
                }
                placeholder={localeText(locale, "10-15 lakh", "১০-১৫ লাখ")}
              />
            </label>
          </div>

          <label className="field">
            <span>{localeText(locale, "Guest target", "অতিথি সংখ্যা লক্ষ্য")}</span>
            <input
              type="number"
              value={projectForm.guestTarget}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  guestTarget: event.target.value,
                }))
              }
            />
          </label>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => void createWeddingProject()}
              disabled={busyKey === "create-project"}
            >
              {busyKey === "create-project"
                ? localeText(locale, "Creating...", "তৈরি হচ্ছে...")
                : localeText(locale, "Create Wedding Project", "ওয়েডিং প্রজেক্ট তৈরি করুন")}
            </button>
          </div>

          {weddingProjects.length ? (
            <div className="stack-list">
              {weddingProjects.map((project) => {
                const isSelected = selectedWeddingProjectId === project.id;
                const hasDate = !!project.weddingDate;
                const hasGuests = project.guestEntries.length > 0;
                const hasVendors = project.shortlists.length > 0;

                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`conversation-card${isSelected ? " conversation-card-active" : ""}`}
                    onClick={() => setSelectedWeddingProjectId(project.id)}
                  >
                    {/* Progress steps */}
                    <div className="wedding-progress">
                      <span className={`wedding-step${hasDate ? " wedding-step-done" : ""}`}>
                        {hasDate ? "✓" : "○"} {localeText(locale, "Date set", "তারিখ সেট")}
                      </span>
                      <span className={`wedding-step${hasGuests ? " wedding-step-done" : ""}`}>
                        {hasGuests ? "✓" : "○"} {localeText(locale, "Guests added", "অতিথি যোগ")}
                      </span>
                      <span className={`wedding-step${hasVendors ? " wedding-step-done" : ""}`}>
                        {hasVendors ? "✓" : "○"} {localeText(locale, "Vendors shortlisted", "ভেন্ডর শর্টলিস্ট")}
                      </span>
                    </div>
                    <strong>{project.title}</strong>
                    <span>
                      {project.city ??
                        localeText(locale, "Location pending", "লোকেশন অপেক্ষমাণ")}
                      {project.budgetBand ? ` • ${project.budgetBand}` : ""}
                    </span>
                    <small>
                      {project.guestEntries.length}{" "}
                      {localeText(locale, "guests", "অতিথি")} • {project.shortlists.length}{" "}
                      {localeText(locale, "shortlisted vendors", "শর্টলিস্ট ভেন্ডর")}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState>
              {localeText(locale, "Create your first wedding project to start planning.", "প্ল্যানিং শুরু করতে আপনার প্রথম ওয়েডিং প্রজেক্ট তৈরি করুন।")}
            </EmptyState>
          )}
        </article>

        <article className="dashboard-panel">
          <SectionTitle
            kicker={localeText(locale, "Wedding Workflow", "ওয়েডিং ওয়ার্কফ্লো")}
            title={
              selectedWeddingProject
                ? selectedWeddingProject.title
                : localeText(locale, "Choose a wedding project", "একটি ওয়েডিং প্রজেক্ট বেছে নিন")
            }
            detail={
              selectedWeddingProject ? (
                <StatusPill tone="teal">
                  {translateWorkflowStatus(selectedWeddingProject.status, locale)}
                </StatusPill>
              ) : null
            }
          />

          {selectedWeddingProject ? (
            <>
              <div className="summary-card">
                <div className="summary-row">
                  <span>{localeText(locale, "Wedding city", "বিয়ের শহর")}</span>
                  <strong>{selectedWeddingProject.city ?? localeText(locale, "Not set", "সেট হয়নি")}</strong>
                </div>
                <div className="summary-row">
                  <span>{localeText(locale, "Guest target", "অতিথি লক্ষ্য")}</span>
                  <span>{selectedWeddingProject.guestTarget ?? localeText(locale, "Not set", "সেট হয়নি")}</span>
                </div>
                <div className="summary-row">
                  <span>{localeText(locale, "Wedding date", "বিয়ের তারিখ")}</span>
                  <span>{formatDate(selectedWeddingProject.weddingDate, locale)}</span>
                </div>
              </div>

              <div className="input-grid">
                <label className="field">
                  <span>{localeText(locale, "Guest name", "অতিথির নাম")}</span>
                  <input
                    type="text"
                    value={guestForm.guestName}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        guestName: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>{localeText(locale, "Phone", "ফোন")}</span>
                  <input
                    type="text"
                    value={guestForm.guestPhone}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        guestPhone: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="input-grid">
                <label className="field">
                  <span>{localeText(locale, "Guest count", "অতিথি সংখ্যা")}</span>
                  <input
                    type="number"
                    value={guestForm.guestCount}
                    onChange={(event) =>
                      setGuestForm((current) => ({
                        ...current,
                        guestCount: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="checkbox-stack">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={guestForm.invited}
                      onChange={(event) =>
                        setGuestForm((current) => ({
                          ...current,
                          invited: event.target.checked,
                        }))
                      }
                    />
                    <span>{localeText(locale, "Invitation sent", "নিমন্ত্রণ পাঠানো হয়েছে")}</span>
                  </label>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={guestForm.confirmed}
                      onChange={(event) =>
                        setGuestForm((current) => ({
                          ...current,
                          confirmed: event.target.checked,
                        }))
                      }
                    />
                    <span>{localeText(locale, "Attendance confirmed", "উপস্থিতি নিশ্চিত")}</span>
                  </label>
                </div>
              </div>

              <div className="inline-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void addWeddingGuest()}
                  disabled={busyKey === "add-guest"}
                >
                  {busyKey === "add-guest"
                    ? localeText(locale, "Adding...", "যোগ হচ্ছে...")
                    : localeText(locale, "Add Guest", "অতিথি যোগ করুন")}
                </button>
              </div>

              <div className="detail-columns">
                <div>
                  <p className="section-kicker">{localeText(locale, "Guest List", "অতিথি তালিকা")}</p>
                  {selectedWeddingProject.guestEntries.length ? (
                    <>
                      <table className="guest-table">
                        <thead>
                          <tr>
                            <th>{localeText(locale, "Name", "নাম")}</th>
                            <th>{localeText(locale, "Phone", "ফোন")}</th>
                            <th>{localeText(locale, "Count", "সংখ্যা")}</th>
                            <th>{localeText(locale, "Status", "স্ট্যাটাস")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedWeddingProject.guestEntries.map((guest) => (
                            <tr key={guest.id}>
                              <td><strong>{guest.guestName}</strong></td>
                              <td>{guest.guestPhone ?? "—"}</td>
                              <td>{guest.guestCount}</td>
                              <td>
                                <div className="tag-list" style={{ gap: 4 }}>
                                  <StatusPill tone={guest.invited ? "gold" : "rose"}>
                                    {guest.invited
                                      ? localeText(locale, "Invited", "নিমন্ত্রিত")
                                      : localeText(locale, "Draft", "খসড়া")}
                                  </StatusPill>
                                  <StatusPill tone={guest.confirmed ? "leaf" : "teal"}>
                                    {guest.confirmed
                                      ? localeText(locale, "Confirmed", "নিশ্চিত")
                                      : localeText(locale, "Awaiting reply", "উত্তরের অপেক্ষায়")}
                                  </StatusPill>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                        {localeText(locale, "Total guests:", "মোট অতিথি:")} {selectedWeddingProject.guestEntries.reduce((sum, g) => sum + g.guestCount, 0)}
                      </div>
                    </>
                  ) : (
                    <EmptyState>{localeText(locale, "No guests added yet.", "এখনও কোনো অতিথি যোগ করা হয়নি।")}</EmptyState>
                  )}
                </div>

                <div>
                  <p className="section-kicker">{localeText(locale, "Shortlisted Vendors", "শর্টলিস্ট ভেন্ডর")}</p>
                  {selectedWeddingProject.shortlists.length ? (
                    <div className="stack-list">
                      {selectedWeddingProject.shortlists.map((shortlist) => (
                        <article key={shortlist.id} className="mini-card mini-card-horizontal">
                          <div className="mini-card-body">
                            <strong>{shortlist.vendorProfile.businessName}</strong>
                            <p className="mini-text">
                              {shortlist.vendorProfile.categoryName ??
                                localeText(locale, "Vendor", "ভেন্ডর")}
                            </p>
                            <p className="mini-text">
                              {shortlist.notes ??
                                localeText(
                                  locale,
                                  "No notes added for this shortlist yet.",
                                  "এই শর্টলিস্টে এখনও কোনো নোট যোগ করা হয়নি।",
                                )}
                            </p>
                            <div className="inline-actions">
                              <Link
                                href={localizePath(`/vendors/${shortlist.vendorProfile.slug}`, locale)}
                                className="button button-soft"
                              >
                                {localeText(locale, "View Vendor", "ভেন্ডর দেখুন")}
                              </Link>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>{localeText(locale, "No vendors shortlisted yet.", "এখনও কোনো ভেন্ডর শর্টলিস্ট করা হয়নি।")}</EmptyState>
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState>
              {localeText(locale, "Select a wedding project to manage guests and vendors.", "অতিথি ও ভেন্ডর ব্যবস্থাপনার জন্য একটি ওয়েডিং প্রজেক্ট বেছে নিন।")}
            </EmptyState>
          )}
        </article>
      </div>

      {/* ── Vendors ── */}
      <article className="dashboard-panel dashboard-panel-wide" style={memberSection !== "vendors" ? { display: "none" } : undefined}>
        <SectionTitle
          kicker={localeText(locale, "Vendor Directory", "ভেন্ডর ডিরেক্টরি")}
          title={localeText(locale, "Bangladeshi wedding services", "বাংলাদেশি ওয়েডিং সার্ভিস")}
          detail={
            <div className="inline-actions">
              <Link
                href={localizePath("/vendors", locale)}
                className="button button-soft"
              >
                {localeText(locale, "Open full vendor page", "পূর্ণ ভেন্ডর পেজ খুলুন")}
              </Link>
              <StatusPill tone="teal">
                {vendorDirectory.length} {localeText(locale, "vendor(s)", "ভেন্ডর")}
              </StatusPill>
            </div>
          }
        />

        <div className="input-grid vendor-filter-grid">
          <label className="field">
            <span>{localeText(locale, "Search", "সার্চ")}</span>
            <input
              type="text"
              value={vendorSearch.search}
              onChange={(event) =>
                setVendorSearch((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder={localeText(locale, "Planner, decor, venue", "প্ল্যানার, ডেকর, ভেন্যু")}
            />
          </label>

          <label className="field">
            <span>{localeText(locale, "Category", "ক্যাটাগরি")}</span>
            <select
              value={vendorSearch.category}
              onChange={(event) =>
                setVendorSearch((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              <option value="">{localeText(locale, "All categories", "সব ক্যাটাগরি")}</option>
              {vendorCategories.map((category) => (
                <option key={category} value={category ?? ""}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{localeText(locale, "Division", "বিভাগ")}</span>
            <select
              value={vendorSearch.division}
              onChange={(event) =>
                setVendorSearch((current) => ({
                  ...current,
                  division: event.target.value,
                }))
              }
            >
              <option value="">{localeText(locale, "All divisions", "সব বিভাগ")}</option>
              {vendorDivisions.map((division) => (
                <option key={division} value={division ?? ""}>
                  {division}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{localeText(locale, "District", "জেলা")}</span>
            <input
              type="text"
              value={vendorSearch.district}
              onChange={(event) =>
                setVendorSearch((current) => ({
                  ...current,
                  district: event.target.value,
                }))
              }
              placeholder={localeText(locale, "Dhaka", "ঢাকা")}
            />
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void searchVendors()}
            disabled={busyKey === "search-vendors"}
          >
            {busyKey === "search-vendors"
              ? localeText(locale, "Searching...", "খোঁজা হচ্ছে...")
              : localeText(locale, "Search Vendors", "ভেন্ডর খুঁজুন")}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>
            {vendorDirectory.length} {localeText(locale, "vendor(s) found", "ভেন্ডর পাওয়া গেছে")}
          </span>
        </div>
        {vendorDirectory.length ? (
          <div className="card-grid vendor-card-grid">
            {vendorDirectory.map((vendor) => (
              <article key={vendor.id} className="vendor-showcase-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  {vendor.categoryName ? (
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, background: "#ede9fe", color: "#7c3aed" }}>
                      {vendor.categoryName}
                    </span>
                  ) : null}
                  <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: "0.82rem", fontWeight: 700, background: "#fef3c7", color: "#b45309" }}>
                    {vendor.packages[0]?.priceBdt
                      ? `৳${vendor.packages[0].priceBdt.toLocaleString()}`
                      : localeText(locale, "Get Quote", "কোট নিন")}
                  </span>
                </div>
                <strong style={{ fontSize: "1.05rem", display: "block", marginBottom: 4 }}>{vendor.businessName}</strong>
                {(vendor.area || vendor.district || vendor.division) ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 8px" }}>
                    📍 {[vendor.area, vendor.district, vendor.division].filter(Boolean).join(", ")}
                  </p>
                ) : null}
                <p className="mini-text" style={{ marginBottom: 10 }}>
                  {vendor.descriptionEn ??
                    vendor.descriptionBn ??
                    localeText(locale, "Vendor description coming soon.", "ভেন্ডরের বর্ণনা শিগগিরই আসছে।")}
                </p>
                {vendor.packages.length ? (
                  <div className="tag-list" style={{ marginBottom: 10 }}>
                    {vendor.packages.slice(0, 2).map((pkg) => (
                      <span key={pkg.id} className="tag">
                        {pkg.nameEn}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="inline-actions">
                  <Link
                    href={localizePath(`/vendors/${vendor.slug}`, locale)}
                    className="button button-soft"
                  >
                    {localeText(locale, "View Vendor", "ভেন্ডর দেখুন")}
                  </Link>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => void shortlistVendor(vendor.id)}
                    disabled={busyKey === `shortlist:${vendor.id}`}
                  >
                    {busyKey === `shortlist:${vendor.id}`
                      ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                      : localeText(locale, "Shortlist For Wedding", "বিয়ের জন্য শর্টলিস্ট করুন")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>{localeText(locale, "No vendors matched this filter yet.", "এই ফিল্টারে এখনো কোনো ভেন্ডর মেলেনি।")}</EmptyState>
        )}
      </article>
    </section>
    </div>
    </div>
  );
}


export function DashboardPageClient({
  locale = null,
}: {
  locale?: PublicLocale | null;
}) {
  const { accessToken, isReady, isRefreshing, user } = useAuth();
  const shellCopy = getDashboardShellCopy(locale);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [memberData, setMemberData] = useState<MemberDashboardResponse | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [weddingProjects, setWeddingProjects] = useState<WeddingProject[]>([]);
  const [vendorDirectory, setVendorDirectory] = useState<VendorDirectoryItem[]>([]);
  const [contactUnlocks, setContactUnlocks] = useState<ContactUnlockItem[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewResponse | null>(null);
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
  const [profileReviews, setProfileReviews] = useState<AdminProfileReviewItem[]>([]);
  const [superAdminOverview, setSuperAdminOverview] =
    useState<SuperAdminOverviewResponse | null>(null);
  const [superAdminAdmins, setSuperAdminAdmins] = useState<SuperAdminAdminItem[]>([]);
  const [superAdminPlans, setSuperAdminPlans] = useState<SuperAdminMembershipPlan[]>([]);
  const [superAdminCoupons, setSuperAdminCoupons] = useState<SuperAdminCouponItem[]>([]);
  const [superAdminRevenue, setSuperAdminRevenue] =
    useState<SuperAdminRevenueSummary | null>(null);
  const [superAdminProfileSummary, setSuperAdminProfileSummary] =
    useState<SuperAdminProfileSummary | null>(null);
  const [superAdminAnalytics, setSuperAdminAnalytics] =
    useState<SuperAdminAnalyticsSummary | null>(null);
  const [superAdminCommercialSettings, setSuperAdminCommercialSettings] =
    useState<SuperAdminCommercialSettings | null>(null);
  const [superAdminMatchMail, setSuperAdminMatchMail] =
    useState<SuperAdminMatchMailResponse | null>(null);
  const [superAdminMailCampaigns, setSuperAdminMailCampaigns] = useState<
    SuperAdminMailCampaignItem[]
  >([]);
  const [ghotokData, setGhotokData] = useState<GhotokDashboardResponse | null>(null);
  const [vendorData, setVendorData] = useState<VendorDashboardResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function resendVerificationEmail() {
    if (!accessToken || resendBusy || resendDone) return;
    setResendBusy(true);
    try {
      await apiRequest("/auth/resend-verification", { method: "POST", token: accessToken });
      setResendDone(true);
    } catch {
      // silently ignore — user can try again on next refresh
    } finally {
      setResendBusy(false);
    }
  }

  async function loadDashboard() {
    if (!accessToken || !user) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      if (user.roles.includes("MEMBER")) {
        const [
          memberDashboard,
          discoveryResponse,
          savedSearchResponse,
          mediaResponse,
          conversationResponse,
          planResponse,
          orderResponse,
          weddingProjectResponse,
          vendorDirectoryResponse,
          contactUnlocksResponse,
        ] = await Promise.allSettled([
          apiRequest<MemberDashboardResponse>("/member-profiles/me/dashboard", {
            token: accessToken,
          }),
          apiRequest<DiscoveryResponse>("/member-profiles/discovery?sortBy=recent_login", {
            token: accessToken,
          }),
          apiRequest<SavedSearchItem[]>("/member-profiles/me/saved-searches", {
            token: accessToken,
          }),
          apiRequest<MediaItem[]>("/media/member/me", {
            token: accessToken,
          }),
          apiRequest<ConversationSummary[]>("/mailbox/conversations", {
            token: accessToken,
          }),
          apiRequest<MembershipPlan[]>("/billing/plans"),
          apiRequest<PaymentOrder[]>("/billing/me/orders", {
            token: accessToken,
          }),
          apiRequest<WeddingProject[]>("/wedding/projects/me", {
            token: accessToken,
          }),
          apiRequest<VendorDirectoryItem[]>("/vendors"),
          apiRequest<{ total: number; results: ContactUnlockItem[] }>("/member-profiles/me/contact-unlocks", { token: accessToken }).then(r => r.results),
        ]);

        if (memberDashboard.status !== "fulfilled") {
          throw memberDashboard.reason;
        }

        setMemberData(memberDashboard.value);
        setDiscovery(
          discoveryResponse.status === "fulfilled"
            ? discoveryResponse.value
            : { total: 0, results: [] },
        );
        setSavedSearches(
          savedSearchResponse.status === "fulfilled" ? savedSearchResponse.value : [],
        );
        setMedia(mediaResponse.status === "fulfilled" ? mediaResponse.value : []);
        setConversations(
          conversationResponse.status === "fulfilled" ? conversationResponse.value : [],
        );
        setPlans(planResponse.status === "fulfilled" ? planResponse.value : []);
        setOrders(orderResponse.status === "fulfilled" ? orderResponse.value : []);
        setWeddingProjects(
          weddingProjectResponse.status === "fulfilled"
            ? weddingProjectResponse.value
            : [],
        );
        setVendorDirectory(
          vendorDirectoryResponse.status === "fulfilled"
            ? vendorDirectoryResponse.value
            : [],
        );
        setContactUnlocks(
          contactUnlocksResponse.status === "fulfilled"
            ? contactUnlocksResponse.value
            : [],
        );
      } else {
        setMemberData(null);
        setDiscovery(null);
        setSavedSearches([]);
        setMedia([]);
        setConversations([]);
        setPlans([]);
        setOrders([]);
        setWeddingProjects([]);
        setVendorDirectory([]);
        setContactUnlocks([]);
      }

      if (user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN")) {
        const [overview, pendingPayments, pendingProfileReviews] = await Promise.all([
          apiRequest<AdminOverviewResponse>("/admin/overview", {
            token: accessToken,
          }),
          apiRequest<ManualPayment[]>("/admin/manual-payments", {
            token: accessToken,
          }),
          apiRequest<AdminProfileReviewResponse>("/admin/profile-reviews?status=PENDING", {
            token: accessToken,
          }),
        ]);

        setAdminOverview(overview);
        setManualPayments(pendingPayments);
        setProfileReviews(pendingProfileReviews.items);
      } else {
        setAdminOverview(null);
        setManualPayments([]);
        setProfileReviews([]);
      }

      if (user.roles.includes("SUPER_ADMIN")) {
        const [
          superOverview,
          superAdmins,
          superPlans,
          superCoupons,
          superRevenueSummary,
          superProfileSummary,
          superAnalyticsSummary,
          superCommercialSettings,
          superMatchMail,
          superMailCampaigns,
        ] = await Promise.all([
          apiRequest<SuperAdminOverviewResponse>("/super-admin/overview", {
            token: accessToken,
          }),
          apiRequest<SuperAdminAdminItem[]>("/super-admin/admins", {
            token: accessToken,
          }),
          apiRequest<SuperAdminMembershipPlan[]>("/super-admin/membership-plans", {
            token: accessToken,
          }),
          apiRequest<SuperAdminCouponItem[]>("/super-admin/coupons", {
            token: accessToken,
          }),
          apiRequest<SuperAdminRevenueSummary>("/super-admin/revenue-summary", {
            token: accessToken,
          }),
          apiRequest<SuperAdminProfileSummary>("/super-admin/profile-summary", {
            token: accessToken,
          }),
          apiRequest<SuperAdminAnalyticsSummary>("/analytics/summary", {
            token: accessToken,
          }),
          apiRequest<SuperAdminCommercialSettings>("/super-admin/commercial-settings", {
            token: accessToken,
          }),
          apiRequest<SuperAdminMatchMailResponse>("/super-admin/match-mail/settings", {
            token: accessToken,
          }),
          apiRequest<SuperAdminMailCampaignItem[]>("/super-admin/mail-campaigns", {
            token: accessToken,
          }),
        ]);

        setSuperAdminOverview(superOverview);
        setSuperAdminAdmins(superAdmins);
        setSuperAdminPlans(superPlans);
        setSuperAdminCoupons(superCoupons);
        setSuperAdminRevenue(superRevenueSummary);
        setSuperAdminProfileSummary(superProfileSummary);
        setSuperAdminAnalytics(superAnalyticsSummary);
        setSuperAdminCommercialSettings(superCommercialSettings);
        setSuperAdminMatchMail(superMatchMail);
        setSuperAdminMailCampaigns(superMailCampaigns);
      } else {
        setSuperAdminOverview(null);
        setSuperAdminAdmins([]);
        setSuperAdminPlans([]);
        setSuperAdminCoupons([]);
        setSuperAdminRevenue(null);
        setSuperAdminProfileSummary(null);
        setSuperAdminAnalytics(null);
        setSuperAdminCommercialSettings(null);
        setSuperAdminMatchMail(null);
        setSuperAdminMailCampaigns([]);
      }

      if (user.roles.includes("GHOTOK")) {
        const response = await apiRequest<GhotokDashboardResponse>("/ghotok/me/dashboard", {
          token: accessToken,
        });
        setGhotokData(response);
      } else {
        setGhotokData(null);
      }

      if (user.roles.includes("VENDOR")) {
        const response = await apiRequest<VendorDashboardResponse>("/vendors/me/dashboard", {
          token: accessToken,
        });
        setVendorData(response);
      } else {
        setVendorData(null);
      }
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady || !accessToken || !user) {
      return;
    }

    void loadDashboard();
  }, [accessToken, isReady, user?.id]);

  if (!isReady || isRefreshing) {
    return (
      <main className="page-shell">
        <section className="dashboard-empty">
          <p className="section-kicker">{shellCopy.loadingKicker}</p>
          <h1>{shellCopy.loadingTitle}</h1>
        </section>
      </main>
    );
  }

  if (!user || !accessToken) {
    return (
      <main className="page-shell">
        <section className="dashboard-empty">
          <p className="section-kicker">{shellCopy.signInKicker}</p>
          <h1>{shellCopy.signInTitle}</h1>
          <p className="hero-copy auth-copy">{shellCopy.signInBody}</p>
          <div className="inline-actions">
            <Link
              href={localizePath("/login", locale)}
              className="button button-primary"
            >
              {shellCopy.loginLabel}
            </Link>
            <Link
              href={localizePath("/signup", locale)}
              className="button button-soft"
            >
              {shellCopy.signupLabel}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="dashboard-greeting">
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
            {shellCopy.heroTitleTemplate.replace("{email}", memberData?.profile.firstName || memberData?.profile.displayName || user.email)}
          </h1>
          {memberData ? (
            <span className="tag tag-light" style={{ fontSize: "0.72rem", background: memberData.membership ? "var(--leaf-soft)" : "var(--gold-soft)", color: memberData.membership ? "var(--leaf)" : "var(--gold)" }}>
              {memberData.membership
                ? `${memberData.membership.plan.nameEn} — ${memberData.membership.status}`
                : localeText(locale, "Free tier", "ফ্রি টায়ার")}
            </span>
          ) : null}
          {memberData?.assignedGhotok ? (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {localeText(locale, "Ghotok:", "ঘটক:")} {memberData.assignedGhotok.displayName}
              {memberData.assignedGhotok.phone ? ` (${memberData.assignedGhotok.phone})` : memberData.assignedGhotok.email ? ` (${memberData.assignedGhotok.email})` : ""}
            </span>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {localeText(locale, "Support:", "সাপোর্ট:")} <a href="mailto:support@borbodhu.com" style={{ color: "var(--rose)" }}>support@borbodhu.com</a>
            </span>
          )}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
            {!user.roles.includes("MEMBER") ? (
              <button
                type="button"
                className="button button-soft"
                style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                onClick={() => setAssistantOpen(true)}
              >
                {localeText(locale, "Ask AI", "AI জিজ্ঞাসা করুন")}
              </button>
            ) : null}
            {user.roles.map((role) => (
              <span key={role} className="tag tag-light" style={{ fontSize: "0.72rem" }}>
                {role}
              </span>
            ))}
          </div>
        </div>
      </header>

      {loadError ? <div className="error-banner dashboard-banner">{loadError}</div> : null}
      {isLoading ? (
        <div className="success-banner dashboard-banner">
          {shellCopy.refreshing}
        </div>
      ) : null}

      <DashboardAssistant
        accessToken={accessToken}
        user={user}
        locale={locale}
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      {/* Email verification nudge — only for unverified members */}
      {user.roles.includes("MEMBER") && !user.emailVerifiedAt && (
        <div className="dashboard-banner" style={{ background: "var(--gold-soft)", borderLeft: "4px solid var(--gold)", padding: "12px 18px", borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--ink)", fontWeight: 500 }}>
            📧 Please verify your email address to unlock full access. Check your inbox for the verification link.
          </span>
          {resendDone ? (
            <span style={{ fontSize: "0.82rem", color: "var(--leaf)", fontWeight: 600 }}>Email sent!</span>
          ) : (
            <button
              type="button"
              className="button button-soft"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
              onClick={resendVerificationEmail}
              disabled={resendBusy}
            >
              {resendBusy ? "Sending…" : "Resend verification"}
            </button>
          )}
        </div>
      )}

      {/* Profile completion nudge for new members with low completion */}
      {user.roles.includes("MEMBER") && memberData && memberData.profile.profileCompletionPct < 40 && (
        <div className="dashboard-banner" style={{ background: "var(--rose-soft)", borderLeft: "4px solid var(--rose)", padding: "12px 18px", borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--ink)", fontWeight: 500 }}>
            Your profile is only {memberData.profile.profileCompletionPct}% complete. Complete it to get more matches.
          </span>
          <a href="/dashboard/setup" className="button button-primary" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            Complete profile
          </a>
        </div>
      )}

      {memberData ? (
        <MemberWorkspace
          accessToken={accessToken}
          currentUserId={user.id}
          locale={locale}
          assistantOpen={assistantOpen}
          data={memberData}
          discovery={discovery}
          savedSearches={savedSearches}
          media={media}
          conversations={conversations}
          plans={plans}
          orders={orders}
          weddingProjects={weddingProjects}
          initialVendorDirectory={vendorDirectory}
          contactUnlocks={contactUnlocks}
          onRefresh={loadDashboard}
          onOpenAssistant={() => setAssistantOpen(true)}
        />
      ) : null}

      {adminOverview ? (
        <AdminWorkspace
          accessToken={accessToken}
          locale={locale}
          overview={adminOverview}
          manualPayments={manualPayments}
          profileReviews={profileReviews}
          onRefresh={loadDashboard}
        />
      ) : null}

      {superAdminOverview &&
      superAdminRevenue &&
      superAdminProfileSummary &&
      superAdminAnalytics &&
      superAdminCommercialSettings &&
      superAdminMatchMail ? (
        <SuperAdminWorkspace
          accessToken={accessToken}
          locale={locale}
          overview={superAdminOverview}
          admins={superAdminAdmins}
          plans={superAdminPlans}
          coupons={superAdminCoupons}
          revenue={superAdminRevenue}
          profileSummary={superAdminProfileSummary}
          analytics={superAdminAnalytics}
          commercialSettings={superAdminCommercialSettings}
          matchMail={superAdminMatchMail}
          campaigns={superAdminMailCampaigns}
          onRefresh={loadDashboard}
        />
      ) : null}

      {ghotokData ? <GhotokWorkspace data={ghotokData} locale={locale} /> : null}
      {vendorData && accessToken ? (
        <VendorWorkspace
          accessToken={accessToken}
          data={vendorData}
          locale={locale}
          onRefresh={loadDashboard}
        />
      ) : null}
    </main>
  );
}
