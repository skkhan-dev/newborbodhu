"use client";

import { useEffect, useMemo, useState } from "react";

import {
  SuperAdminMailingPanel,
  type SuperAdminMailCampaignItem,
  type SuperAdminMatchMailResponse,
} from "@/components/super-admin-mailing-panel";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { type SuperAdminCommercialSettings } from "@/lib/commercial";
import { type PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

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
  profiles: {
    active: number;
    rejected: number;
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

export type SuperAdminAdminItem = {
  id: string;
  displayName: string;
  isSuperAdmin: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    status: string;
    roles: string[];
  };
  permissions: Array<{
    id: string;
    key: string;
    value: string;
  }>;
};

export type SuperAdminMembershipPlan = {
  id: string;
  code: string;
  category?: string;
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
  isActive: boolean;
  sortOrder: number;
};

export type SuperAdminCouponItem = {
  id: string;
  code: string;
  discountType: string;
  amount: number | null;
  percent: number | null;
  currencyScope: string | null;
  appliesTo: string;
  maxTotalUses: number | null;
  maxUsesPerUser: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  usageCount: number;
  createdByAdmin: {
    id: string;
    email: string;
  } | null;
};

export type SuperAdminRevenueSummary = {
  range: {
    from: string;
    to: string;
  };
  totals: {
    count: number;
    amount: number;
  };
  byGateway: Array<{
    gateway: string;
    count: number;
    amount: number;
  }>;
  byAdmin: Array<{
    adminUserId: string | null;
    userId: string | null;
    displayName: string;
    email: string | null;
    count: number;
    amount: number;
  }>;
};

export type SuperAdminProfileSummary = {
  range: {
    from: string;
    to: string;
  };
  totals: {
    created: number;
    active: number;
    rejected: number;
    cancelled: number;
    pendingApproval: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  byApprovalStatus: Array<{
    approvalStatus: string;
    count: number;
  }>;
};

export type SuperAdminAnalyticsSummary = {
  range: {
    days: number;
    from: string;
    to: string;
  };
  totals: {
    events: number;
    signedInUsers: number;
    anonymousVisitors: number;
  };
  keyEvents: {
    pageViews: number;
    loginSuccesses: number;
    memberSignups: number;
    vendorSignups: number;
    vendorLeads: number;
    checkoutStarts: number;
    paymentRedirects: number;
    paymentCompletions: number;
  };
  byPlatform: Array<{
    platform: string;
    count: number;
  }>;
  byLocale: Array<{
    locale: string;
    count: number;
  }>;
  topEvents: Array<{
    eventName: string;
    count: number;
  }>;
};

export type PendingGhotokItem = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  bioEn: string | null;
  status: string;
  creditBalance: number;
  managedMemberCount: number;
  createdAt: string;
  user: { id: string; email: string } | null;
};

export type PendingVendorItem = {
  id: string;
  businessName: string;
  slug: string;
  categoryName: string | null;
  division: string | null;
  district: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  user: { id: string; email: string } | null;
};

type AdminFormState = {
  email: string;
  password: string;
  displayName: string;
  isSuperAdmin: boolean;
  status: string;
  permissions: string;
};

type AdminDraftState = {
  displayName: string;
  password: string;
  isSuperAdmin: boolean;
  status: string;
  permissions: string;
};

type PlanFormState = {
  code: string;
  category: string;
  nameEn: string;
  nameBn: string;
  durationDays: string;
  bdtPrice: string;
  usdPrice: string;
  contactLimit: string;
  messageEnabled: boolean;
  contactViewEnabled: boolean;
  highlightEnabled: boolean;
  supportTier: string;
  isActive: boolean;
  sortOrder: string;
};

type CouponFormState = {
  code: string;
  discountType: string;
  amount: string;
  percent: string;
  currencyScope: string;
  appliesTo: string;
  maxTotalUses: string;
  maxUsesPerUser: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  notes: string;
};

type ReportRangeState = {
  from: string;
  to: string;
};

type CommercialFormState = {
  amarpayEnabled: boolean;
  paypalEnabled: boolean;
  officeEnabled: boolean;
  manualEnabled: boolean;
  adsEnabled: boolean;
  adsMode: "TEST" | "ADSENSE";
  adsClientId: string;
  homeHeroSlotId: string;
  vendorsSlotId: string;
  weddingSlotId: string;
  profilesSlotId: string;
  showAdsOnHome: boolean;
  showAdsOnVendors: boolean;
  showAdsOnWedding: boolean;
  showAdsOnProfiles: boolean;
};

function formatDate(value: string | null, locale: PublicLocale | null = null) {
  if (!value) {
    return localeText(locale, "Not set", "সেট হয়নি");
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function translateAdminStatus(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "ACTIVE":
      return localeText(locale, "Active", "সক্রিয়");
    case "INACTIVE":
      return localeText(locale, "Inactive", "নিষ্ক্রিয়");
    case "SUSPENDED":
      return localeText(locale, "Suspended", "সাসপেন্ডেড");
    default:
      return value;
  }
}

function translateDiscountType(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PERCENT":
      return localeText(locale, "Percent", "শতাংশ");
    case "AMOUNT":
      return localeText(locale, "Amount", "পরিমাণ");
    default:
      return value;
  }
}

function translateEventName(value: string, locale: PublicLocale | null) {
  switch (value) {
    case "PAGE_VIEW":
      return localeText(locale, "Page view", "পেজ ভিউ");
    case "LOGIN_SUCCEEDED":
      return localeText(locale, "Login success", "সফল লগইন");
    case "MEMBER_SIGNUP_COMPLETED":
      return localeText(locale, "Member signup", "মেম্বার সাইনআপ");
    case "VENDOR_SIGNUP_COMPLETED":
      return localeText(locale, "Vendor signup", "ভেন্ডর সাইনআপ");
    case "VENDOR_LEAD_SUBMITTED":
      return localeText(locale, "Vendor lead", "ভেন্ডর লিড");
    case "MEMBERSHIP_CHECKOUT_STARTED":
      return localeText(locale, "Checkout started", "চেকআউট শুরু");
    case "PAYMENT_REDIRECT_STARTED":
      return localeText(locale, "Gateway redirect", "গেটওয়ে রিডাইরেক্ট");
    case "PAYMENT_COMPLETED":
      return localeText(locale, "Payment completed", "পেমেন্ট সম্পন্ন");
    case "PAYMENT_FAILED":
      return localeText(locale, "Payment failed", "পেমেন্ট ব্যর্থ");
    default:
      return value.replaceAll("_", " ");
  }
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function splitPermissionString(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createPlanFormState(plan?: SuperAdminMembershipPlan): PlanFormState {
  return {
    code: plan?.code ?? "",
    category: plan?.category ?? "ONLINE",
    nameEn: plan?.nameEn ?? "",
    nameBn: plan?.nameBn ?? "",
    durationDays: plan ? String(plan.durationDays) : "30",
    bdtPrice: plan ? String(plan.bdtPrice) : "",
    usdPrice: plan ? String(plan.usdPrice) : "",
    contactLimit: plan ? String(plan.contactLimit) : "0",
    messageEnabled: plan?.messageEnabled ?? false,
    contactViewEnabled: plan?.contactViewEnabled ?? false,
    highlightEnabled: plan?.highlightEnabled ?? false,
    supportTier: plan?.supportTier ?? "",
    isActive: plan?.isActive ?? true,
    sortOrder: plan ? String(plan.sortOrder) : "0",
  };
}

function createCommercialFormState(
  settings: SuperAdminCommercialSettings,
): CommercialFormState {
  return {
    amarpayEnabled: settings.payments.amarpayEnabled,
    paypalEnabled: settings.payments.paypalEnabled,
    officeEnabled: settings.payments.officeEnabled,
    manualEnabled: settings.payments.manualEnabled,
    adsEnabled: settings.ads.enabled,
    adsMode: settings.ads.mode,
    adsClientId: settings.ads.clientId ?? "",
    homeHeroSlotId: settings.ads.homeHeroSlotId ?? "",
    vendorsSlotId: settings.ads.vendorsSlotId ?? "",
    weddingSlotId: settings.ads.weddingSlotId ?? "",
    profilesSlotId: settings.ads.profilesSlotId ?? "",
    showAdsOnHome: settings.ads.showOnHome,
    showAdsOnVendors: settings.ads.showOnVendors,
    showAdsOnWedding: settings.ads.showOnWedding,
    showAdsOnProfiles: settings.ads.showOnProfiles,
  };
}

export function SuperAdminWorkspace({
  accessToken,
  locale = null,
  overview,
  admins,
  plans,
  coupons,
  revenue,
  profileSummary,
  analytics,
  commercialSettings,
  matchMail,
  campaigns,
  onRefresh,
}: {
  accessToken: string;
  locale?: PublicLocale | null;
  overview: SuperAdminOverviewResponse;
  admins: SuperAdminAdminItem[];
  plans: SuperAdminMembershipPlan[];
  coupons: SuperAdminCouponItem[];
  revenue: SuperAdminRevenueSummary;
  profileSummary: SuperAdminProfileSummary;
  analytics: SuperAdminAnalyticsSummary;
  commercialSettings: SuperAdminCommercialSettings;
  matchMail: SuperAdminMatchMailResponse;
  campaigns: SuperAdminMailCampaignItem[];
  onRefresh: () => Promise<void>;
}) {
  const [createAdminForm, setCreateAdminForm] = useState<AdminFormState>({
    email: "",
    password: "",
    displayName: "",
    isSuperAdmin: false,
    status: "ACTIVE",
    permissions: "",
  });
  const [adminDrafts, setAdminDrafts] = useState<Record<string, AdminDraftState>>({});
  const [createPlanForm, setCreatePlanForm] = useState<PlanFormState>(createPlanFormState());
  const [planDrafts, setPlanDrafts] = useState<Record<string, PlanFormState>>({});
  const [createCouponForm, setCreateCouponForm] = useState<CouponFormState>({
    code: "",
    discountType: "PERCENT",
    amount: "",
    percent: "10",
    currencyScope: "BDT",
    appliesTo: "UPGRADE",
    maxTotalUses: "500",
    maxUsesPerUser: "1",
    startsAt: "",
    expiresAt: "",
    isActive: true,
    notes: "",
  });
  const [reportRange, setReportRange] = useState<ReportRangeState>({
    from: toDateInputValue(revenue.range.from),
    to: toDateInputValue(revenue.range.to),
  });
  const [revenueReport, setRevenueReport] = useState(revenue);
  const [profileReport, setProfileReport] = useState(profileSummary);
  const [analyticsSummary, setAnalyticsSummary] = useState(analytics);
  const [commercialForm, setCommercialForm] = useState<CommercialFormState>(
    createCommercialFormState(commercialSettings),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [pendingGhotoks, setPendingGhotoks] = useState<PendingGhotokItem[]>([]);
  const [allGhotoks, setAllGhotoks] = useState<PendingGhotokItem[]>([]);
  const [ghotokTab, setGhotokTab] = useState<"PENDING_REVIEW" | "ACTIVE" | "SUSPENDED">("PENDING_REVIEW");
  const [ghotokNotes, setGhotokNotes] = useState<Record<string, string>>({});
  const [ghotokCredits, setGhotokCredits] = useState<Record<string, string>>({});
  const [pendingVendors, setPendingVendors] = useState<PendingVendorItem[]>([]);
  const [allVendors, setAllVendors] = useState<PendingVendorItem[]>([]);
  const [vendorTab, setVendorTab] = useState<"PENDING_REVIEW" | "ACTIVE" | "REJECTED">("PENDING_REVIEW");
  const [vendorNotes, setVendorNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setAdminDrafts(
      Object.fromEntries(
        admins.map((admin) => [
          admin.id,
          {
            displayName: admin.displayName,
            password: "",
            isSuperAdmin: admin.isSuperAdmin,
            status: admin.status,
            permissions: admin.permissions.map((permission) => permission.key).join(", "),
          },
        ]),
      ),
    );
  }, [admins]);

  useEffect(() => {
    setPlanDrafts(
      Object.fromEntries(plans.map((plan) => [plan.id, createPlanFormState(plan)])),
    );
  }, [plans]);

  useEffect(() => {
    setRevenueReport(revenue);
    setProfileReport(profileSummary);
    setAnalyticsSummary(analytics);
    setCommercialForm(createCommercialFormState(commercialSettings));
    setReportRange({
      from: toDateInputValue(revenue.range.from),
      to: toDateInputValue(revenue.range.to),
    });
  }, [analytics, commercialSettings, profileSummary, revenue]);

  const activeAdmins = useMemo(
    () => admins.filter((admin) => admin.status === "ACTIVE").length,
    [admins],
  );

  useEffect(() => {
    void apiRequest<PendingGhotokItem[]>("/super-admin/ghotoks?status=PENDING_REVIEW", { token: accessToken })
      .then(setPendingGhotoks)
      .catch(() => { /* non-critical */ });
    void apiRequest<PendingGhotokItem[]>("/super-admin/ghotoks?status=ALL", { token: accessToken })
      .then(setAllGhotoks)
      .catch(() => { /* non-critical */ });
    void apiRequest<PendingVendorItem[]>("/super-admin/vendors?status=PENDING_REVIEW", { token: accessToken })
      .then(setPendingVendors)
      .catch(() => { /* non-critical */ });
    void apiRequest<PendingVendorItem[]>("/super-admin/vendors?status=ALL", { token: accessToken })
      .then(setAllVendors)
      .catch(() => { /* non-critical */ });
  }, [accessToken]);

  function resetMessages() {
    setFeedback(null);
    setError(null);
  }

  async function refreshAfter(message: string) {
    setFeedback(message);
    await onRefresh();
  }

  async function moderateGhotok(id: string, action: "approve" | "reject") {
    setBusyKey(`ghotok:${action}:${id}`);
    resetMessages();
    try {
      await apiRequest(`/super-admin/ghotoks/${id}/${action}`, {
        method: "POST",
        token: accessToken,
        body: { notes: ghotokNotes[id] ?? "" },
      });
      setPendingGhotoks((prev) => prev.filter((g) => g.id !== id));
      setFeedback(action === "approve" ? "Ghotok approved." : "Ghotok rejected.");
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function addGhotokCredits(id: string) {
    const amount = parseInt(ghotokCredits[id] ?? "0", 10);
    if (!amount || amount <= 0) return;
    setBusyKey(`ghotok:credits:${id}`);
    resetMessages();
    try {
      await apiRequest(`/super-admin/ghotoks/${id}/credits`, {
        method: "POST",
        token: accessToken,
        body: { amount, notes: ghotokNotes[id] ?? "" },
      });
      setGhotokCredits((prev) => ({ ...prev, [id]: "" }));
      setAllGhotoks((prev) =>
        prev.map((g) => g.id === id ? { ...g, creditBalance: g.creditBalance + amount } : g),
      );
      setFeedback(`Added ${amount} credits.`);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function changeGhotokStatus(id: string, status: string) {
    setBusyKey(`ghotok:status:${id}`);
    resetMessages();
    try {
      await apiRequest(`/super-admin/ghotoks/${id}/status`, {
        method: "PATCH",
        token: accessToken,
        body: { status, notes: "" },
      });
      setAllGhotoks((prev) =>
        prev.map((g) => g.id === id ? { ...g, status } : g),
      );
      setFeedback(`Ghotok status updated to ${status}.`);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function moderateVendor(id: string, action: "approve" | "reject") {
    setBusyKey(`vendor:${action}:${id}`);
    resetMessages();
    try {
      await apiRequest(`/super-admin/vendors/${id}/${action}`, {
        method: "POST",
        token: accessToken,
        body: { notes: vendorNotes[id] ?? "" },
      });
      setPendingVendors((prev) => prev.filter((v) => v.id !== id));
      setFeedback(action === "approve" ? "Vendor approved." : "Vendor rejected.");
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function changeVendorStatus(id: string, status: string) {
    setBusyKey(`vendor:status:${id}`);
    resetMessages();
    try {
      await apiRequest(`/super-admin/vendors/${id}/status`, {
        method: "PATCH",
        token: accessToken,
        body: { status },
      });
      setAllVendors((prev) => prev.map((v) => v.id === id ? { ...v, status } : v));
      setFeedback(`Vendor status updated to ${status}.`);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function createAdmin() {
    setBusyKey("create-admin");
    resetMessages();

    try {
      await apiRequest("/super-admin/admins", {
        method: "POST",
        token: accessToken,
        body: {
          email: createAdminForm.email,
          password: createAdminForm.password,
          displayName: createAdminForm.displayName,
          isSuperAdmin: createAdminForm.isSuperAdmin,
          status: createAdminForm.status,
          permissions: splitPermissionString(createAdminForm.permissions),
        },
      });

      setCreateAdminForm({
        email: "",
        password: "",
        displayName: "",
        isSuperAdmin: false,
        status: "ACTIVE",
        permissions: "",
      });
      await refreshAfter(localeText(locale, "Admin account created.", "অ্যাডমিন অ্যাকাউন্ট তৈরি হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function updateAdmin(adminId: string) {
    const draft = adminDrafts[adminId];

    if (!draft) {
      return;
    }

    setBusyKey(`admin:${adminId}`);
    resetMessages();

    try {
      await apiRequest(`/super-admin/admins/${adminId}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          displayName: draft.displayName,
          password: draft.password || undefined,
          isSuperAdmin: draft.isSuperAdmin,
          status: draft.status,
          permissions: splitPermissionString(draft.permissions),
        },
      });

      await refreshAfter(localeText(locale, "Admin settings updated.", "অ্যাডমিন সেটিংস আপডেট হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function createPlan() {
    setBusyKey("create-plan");
    resetMessages();

    try {
      await apiRequest("/super-admin/membership-plans", {
        method: "POST",
        token: accessToken,
        body: {
          code: createPlanForm.code,
          category: createPlanForm.category,
          nameEn: createPlanForm.nameEn,
          nameBn: createPlanForm.nameBn || undefined,
          durationDays: Number(createPlanForm.durationDays),
          bdtPrice: Number(createPlanForm.bdtPrice),
          usdPrice: Number(createPlanForm.usdPrice),
          contactLimit: Number(createPlanForm.contactLimit),
          messageEnabled: createPlanForm.messageEnabled,
          contactViewEnabled: createPlanForm.contactViewEnabled,
          highlightEnabled: createPlanForm.highlightEnabled,
          supportTier: createPlanForm.supportTier || undefined,
          isActive: createPlanForm.isActive,
          sortOrder: Number(createPlanForm.sortOrder),
        },
      });

      setCreatePlanForm(createPlanFormState());
      await refreshAfter(localeText(locale, "Membership plan created.", "মেম্বারশিপ প্ল্যান তৈরি হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function updatePlan(planId: string) {
    const draft = planDrafts[planId];

    if (!draft) {
      return;
    }

    setBusyKey(`plan:${planId}`);
    resetMessages();

    try {
      await apiRequest(`/super-admin/membership-plans/${planId}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          code: draft.code,
          category: draft.category,
          nameEn: draft.nameEn,
          nameBn: draft.nameBn || undefined,
          durationDays: Number(draft.durationDays),
          bdtPrice: Number(draft.bdtPrice),
          usdPrice: Number(draft.usdPrice),
          contactLimit: Number(draft.contactLimit),
          messageEnabled: draft.messageEnabled,
          contactViewEnabled: draft.contactViewEnabled,
          highlightEnabled: draft.highlightEnabled,
          supportTier: draft.supportTier || undefined,
          isActive: draft.isActive,
          sortOrder: Number(draft.sortOrder),
        },
      });

      await refreshAfter(
        localeText(locale, `Plan ${draft.code} updated.`, `প্ল্যান ${draft.code} আপডেট হয়েছে।`),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function createCoupon() {
    setBusyKey("create-coupon");
    resetMessages();

    try {
      await apiRequest("/super-admin/coupons", {
        method: "POST",
        token: accessToken,
        body: {
          code: createCouponForm.code,
          discountType: createCouponForm.discountType,
          amount: createCouponForm.amount ? Number(createCouponForm.amount) : undefined,
          percent: createCouponForm.percent ? Number(createCouponForm.percent) : undefined,
          currencyScope: createCouponForm.currencyScope || undefined,
          appliesTo: createCouponForm.appliesTo || undefined,
          maxTotalUses: createCouponForm.maxTotalUses
            ? Number(createCouponForm.maxTotalUses)
            : undefined,
          maxUsesPerUser: createCouponForm.maxUsesPerUser
            ? Number(createCouponForm.maxUsesPerUser)
            : undefined,
          startsAt: createCouponForm.startsAt || undefined,
          expiresAt: createCouponForm.expiresAt || undefined,
          isActive: createCouponForm.isActive,
          notes: createCouponForm.notes || undefined,
        },
      });

      setCreateCouponForm({
        code: "",
        discountType: "PERCENT",
        amount: "",
        percent: "10",
        currencyScope: "BDT",
        appliesTo: "UPGRADE",
        maxTotalUses: "500",
        maxUsesPerUser: "1",
        startsAt: "",
        expiresAt: "",
        isActive: true,
        notes: "",
      });
      await refreshAfter(localeText(locale, "Coupon created.", "কুপন তৈরি হয়েছে।"));
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleCoupon(couponId: string, nextIsActive: boolean) {
    setBusyKey(`coupon:${couponId}`);
    resetMessages();

    try {
      await apiRequest(`/super-admin/coupons/${couponId}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          isActive: nextIsActive,
        },
      });

      await refreshAfter(
        nextIsActive
          ? localeText(locale, "Coupon activated.", "কুপন চালু হয়েছে।")
          : localeText(locale, "Coupon paused.", "কুপন স্থগিত হয়েছে।"),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function runReports() {
    setBusyKey("reports");
    resetMessages();

    try {
      const query = new URLSearchParams();

      if (reportRange.from) {
        query.set("from", reportRange.from);
      }

      if (reportRange.to) {
        query.set("to", reportRange.to);
      }

      const [nextRevenue, nextProfiles] = await Promise.all([
        apiRequest<SuperAdminRevenueSummary>(
          `/super-admin/revenue-summary?${query.toString()}`,
          {
            token: accessToken,
          },
        ),
        apiRequest<SuperAdminProfileSummary>(
          `/super-admin/profile-summary?${query.toString()}`,
          {
            token: accessToken,
          },
        ),
      ]);

      setRevenueReport(nextRevenue);
      setProfileReport(nextProfiles);
      setFeedback(
        localeText(locale, "Custom super admin reports loaded.", "কাস্টম সুপার অ্যাডমিন রিপোর্ট লোড হয়েছে।"),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  async function saveCommercialSettings() {
    setBusyKey("commercial-settings");
    resetMessages();

    try {
      await apiRequest("/super-admin/commercial-settings", {
        method: "PATCH",
        token: accessToken,
        body: {
          amarpayEnabled: commercialForm.amarpayEnabled,
          paypalEnabled: commercialForm.paypalEnabled,
          officeEnabled: commercialForm.officeEnabled,
          manualEnabled: commercialForm.manualEnabled,
          adsEnabled: commercialForm.adsEnabled,
          adsMode: commercialForm.adsMode,
          adsClientId: commercialForm.adsClientId || undefined,
          homeHeroSlotId: commercialForm.homeHeroSlotId || undefined,
          vendorsSlotId: commercialForm.vendorsSlotId || undefined,
          weddingSlotId: commercialForm.weddingSlotId || undefined,
          profilesSlotId: commercialForm.profilesSlotId || undefined,
          showAdsOnHome: commercialForm.showAdsOnHome,
          showAdsOnVendors: commercialForm.showAdsOnVendors,
          showAdsOnWedding: commercialForm.showAdsOnWedding,
          showAdsOnProfiles: commercialForm.showAdsOnProfiles,
        },
      });

      await refreshAfter(
        localeText(
          locale,
          "Commercial settings updated.",
          "কমার্শিয়াল সেটিংস আপডেট হয়েছে।",
        ),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              {localeText(locale, "Super Admin Console", "সুপার অ্যাডমিন কনসোল")}
            </p>
            <h2>
              {localeText(
                locale,
                "Platform operations, pricing, and growth controls",
                "প্ল্যাটফর্ম অপারেশন, মূল্য নির্ধারণ, এবং গ্রোথ নিয়ন্ত্রণ",
              )}
            </h2>
          </div>
          <div className="tag-list">
            <span className="tag">
              {activeAdmins} {localeText(locale, "active admins", "সক্রিয় অ্যাডমিন")}
            </span>
            <span className="tag">
              {overview.catalog.membershipPlans} {localeText(locale, "plans", "প্ল্যান")}
            </span>
            <span className="tag">
              {overview.catalog.activeCoupons}{" "}
              {localeText(locale, "active coupons", "সক্রিয় কুপন")}
            </span>
          </div>
        </div>

        {feedback ? <div className="success-banner dashboard-banner">{feedback}</div> : null}
        {error ? <div className="error-banner dashboard-banner">{error}</div> : null}

        <div className="dashboard-stats">
          <article className="stat-card">
            <strong>{overview.people.members}</strong>
            <span>{localeText(locale, "Members", "মেম্বার")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.people.vendors}</strong>
            <span>{localeText(locale, "Vendors", "ভেন্ডর")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.people.ghotoks}</strong>
            <span>{localeText(locale, "Ghotoks", "ঘটক")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.queues.pendingProfiles}</strong>
            <span>{localeText(locale, "Pending profiles", "অপেক্ষমাণ প্রোফাইল")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.queues.pendingVendors}</strong>
            <span>{localeText(locale, "Pending vendors", "অপেক্ষমাণ ভেন্ডর")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.queues.manualPayments}</strong>
            <span>{localeText(locale, "Manual payments", "ম্যানুয়াল পেমেন্ট")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.revenue.monthCollected}</strong>
            <span>{localeText(locale, "Month revenue", "মাসিক আয়")}</span>
          </article>
          <article className="stat-card">
            <strong>{overview.revenue.yearCollected}</strong>
            <span>{localeText(locale, "Year revenue", "বার্ষিক আয়")}</span>
          </article>
        </div>
      </article>

      <div className="dashboard-grid">
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">
                {localeText(locale, "Product Signals", "প্রোডাক্ট সিগন্যাল")}
              </p>
              <h3>
                {localeText(
                  locale,
                  "First-party analytics for the last 30 days",
                  "গত ৩০ দিনের ফার্স্ট-পার্টি অ্যানালিটিক্স",
                )}
              </h3>
            </div>
          </div>

          <div className="dashboard-stats">
            <article className="stat-card">
              <strong>{analyticsSummary.totals.events}</strong>
              <span>{localeText(locale, "Tracked events", "ট্র্যাক করা ইভেন্ট")}</span>
            </article>
            <article className="stat-card">
              <strong>{analyticsSummary.keyEvents.pageViews}</strong>
              <span>{localeText(locale, "Page views", "পেজ ভিউ")}</span>
            </article>
            <article className="stat-card">
              <strong>{analyticsSummary.keyEvents.memberSignups}</strong>
              <span>{localeText(locale, "Member signups", "মেম্বার সাইনআপ")}</span>
            </article>
            <article className="stat-card">
              <strong>{analyticsSummary.keyEvents.vendorLeads}</strong>
              <span>{localeText(locale, "Vendor leads", "ভেন্ডর লিড")}</span>
            </article>
            <article className="stat-card">
              <strong>{analyticsSummary.keyEvents.checkoutStarts}</strong>
              <span>{localeText(locale, "Checkout starts", "চেকআউট শুরু")}</span>
            </article>
            <article className="stat-card">
              <strong>{analyticsSummary.keyEvents.paymentCompletions}</strong>
              <span>{localeText(locale, "Payment completions", "পেমেন্ট সম্পন্ন")}</span>
            </article>
          </div>

          <div className="detail-columns">
            <div>
              <p className="section-kicker">
                {localeText(locale, "By platform", "প্ল্যাটফর্ম অনুযায়ী")}
              </p>
              <div className="stack-list">
                {analyticsSummary.byPlatform.map((item) => (
                  <article key={item.platform} className="mini-card mini-card-horizontal">
                    <div className="mini-card-body">
                      <strong>{item.platform}</strong>
                      <p className="mini-text">{item.count}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="section-kicker">
                {localeText(locale, "Top events", "শীর্ষ ইভেন্ট")}
              </p>
              <div className="stack-list">
                {analyticsSummary.topEvents.map((item) => (
                  <article key={item.eventName} className="mini-card mini-card-horizontal">
                    <div className="mini-card-body">
                      <strong>{translateEventName(item.eventName, locale)}</strong>
                      <p className="mini-text">{item.count}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="tag-list">
            <span className="tag">
              {analyticsSummary.totals.signedInUsers}{" "}
              {localeText(locale, "signed-in users", "সাইন-ইন ইউজার")}
            </span>
            <span className="tag">
              {analyticsSummary.totals.anonymousVisitors}{" "}
              {localeText(locale, "anonymous visitors", "অ্যানোনিমাস ভিজিটর")}
            </span>
            {analyticsSummary.byLocale.map((item) => (
              <span key={item.locale} className="tag tag-light">
                {item.locale} • {item.count}
              </span>
            ))}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">{localeText(locale, "Reporting", "রিপোর্টিং")}</p>
              <h3>
                {localeText(
                  locale,
                  "Revenue and profile range report",
                  "আয় এবং প্রোফাইল রেঞ্জ রিপোর্ট",
                )}
              </h3>
            </div>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "From", "শুরু")}</span>
              <input
                type="date"
                value={reportRange.from}
                onChange={(event) =>
                  setReportRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "To", "শেষ")}</span>
              <input
                type="date"
                value={reportRange.to}
                onChange={(event) =>
                  setReportRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="inline-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => void runReports()}
              disabled={busyKey === "reports"}
            >
              {busyKey === "reports"
                ? localeText(locale, "Loading...", "লোড হচ্ছে...")
                : localeText(locale, "Run Report", "রিপোর্ট চালান")}
            </button>
          </div>

          <div className="stack-list">
            <div className="summary-card">
              <div className="summary-row">
                <span>{localeText(locale, "Range", "রেঞ্জ")}</span>
                <strong>
                  {formatDate(revenueReport.range.from, locale)}{" "}
                  {localeText(locale, "to", "থেকে")}{" "}
                  {formatDate(revenueReport.range.to, locale)}
                </strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Collected amount", "সংগৃহীত পরিমাণ")}</span>
                <strong>{revenueReport.totals.amount}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Paid orders", "পরিশোধিত অর্ডার")}</span>
                <strong>{revenueReport.totals.count}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-row">
                <span>{localeText(locale, "Profiles created", "তৈরি হওয়া প্রোফাইল")}</span>
                <strong>{profileReport.totals.created}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Pending approval", "অপেক্ষমাণ অনুমোদন")}</span>
                <strong>{profileReport.totals.pendingApproval}</strong>
              </div>
              <div className="summary-row">
                <span>{localeText(locale, "Active", "সক্রিয়")}</span>
                <strong>{profileReport.totals.active}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">{localeText(locale, "Breakdown", "বিস্তারিত ভাগ")}</p>
              <h3>
                {localeText(
                  locale,
                  "Gateway and admin contribution",
                  "গেটওয়ে এবং অ্যাডমিন অবদান",
                )}
              </h3>
            </div>
          </div>

          <div className="detail-columns">
            <div>
              <p className="section-kicker">{localeText(locale, "By gateway", "গেটওয়ে অনুযায়ী")}</p>
              <div className="stack-list">
                {revenueReport.byGateway.map((item) => (
                  <article key={item.gateway} className="mini-card mini-card-horizontal">
                    <div className="mini-card-body">
                      <strong>{item.gateway}</strong>
                      <p className="mini-text">
                        {item.count}{" "}
                        {localeText(
                          locale,
                          item.count === 1 ? "payment" : "payments",
                          "পেমেন্ট",
                        )}
                      </p>
                      <p className="mini-text">{item.amount}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="section-kicker">{localeText(locale, "By admin", "অ্যাডমিন অনুযায়ী")}</p>
              <div className="stack-list">
                {revenueReport.byAdmin.map((item) => (
                  <article
                    key={`${item.adminUserId ?? "system"}-${item.displayName}`}
                    className="mini-card mini-card-horizontal"
                  >
                    <div className="mini-card-body">
                      <strong>{item.displayName}</strong>
                      <p className="mini-text">
                        {item.email ??
                          localeText(
                            locale,
                            "Automated gateway approval",
                            "স্বয়ংক্রিয় গেটওয়ে অনুমোদন",
                          )}
                      </p>
                      <p className="mini-text">
                        {item.count}{" "}
                        {localeText(
                          locale,
                          item.count === 1 ? "payment" : "payments",
                          "পেমেন্ট",
                        )}{" "}
                        • {item.amount}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              {localeText(locale, "Commercial Controls", "কমার্শিয়াল নিয়ন্ত্রণ")}
            </p>
            <h3>
              {localeText(
                locale,
                "Payments, sponsored inventory, and AdSense-safe placement rules",
                "পেমেন্ট, স্পন্সরড ইনভেন্টরি, এবং AdSense-safe প্লেসমেন্ট নিয়ম",
              )}
            </h3>
          </div>
          <div className="tag-list">
            {commercialForm.amarpayEnabled ? <span className="tag">AmarPay</span> : null}
            {commercialForm.paypalEnabled ? <span className="tag">PayPal</span> : null}
            {commercialForm.officeEnabled ? (
              <span className="tag">{localeText(locale, "Office", "অফিস")}</span>
            ) : null}
            {commercialForm.manualEnabled ? (
              <span className="tag">{localeText(locale, "Manual", "ম্যানুয়াল")}</span>
            ) : null}
            <span className="tag tag-light">
              {commercialForm.adsMode === "ADSENSE"
                ? localeText(locale, "AdSense mode", "AdSense মোড")
                : localeText(locale, "Test mode", "টেস্ট মোড")}
            </span>
          </div>
        </div>

        <div className="detail-columns">
          <div className="summary-card">
            <p className="section-kicker">
              {localeText(locale, "Payment Methods", "পেমেন্ট মেথড")}
            </p>
            <h4>
              {localeText(
                locale,
                "Control which payment rails stay visible in web and app checkout.",
                "ওয়েব ও অ্যাপ চেকআউটে কোন পেমেন্ট রেলগুলো দৃশ্যমান থাকবে তা নিয়ন্ত্রণ করুন।",
              )}
            </h4>
            <div className="stack-list">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={commercialForm.amarpayEnabled}
                  onChange={(event) =>
                    setCommercialForm((current) => ({
                      ...current,
                      amarpayEnabled: event.target.checked,
                    }))
                  }
                />
                <span>AmarPay</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={commercialForm.paypalEnabled}
                  onChange={(event) =>
                    setCommercialForm((current) => ({
                      ...current,
                      paypalEnabled: event.target.checked,
                    }))
                  }
                />
                <span>PayPal</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={commercialForm.officeEnabled}
                  onChange={(event) =>
                    setCommercialForm((current) => ({
                      ...current,
                      officeEnabled: event.target.checked,
                    }))
                  }
                />
                <span>{localeText(locale, "Office payment", "অফিস পেমেন্ট")}</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={commercialForm.manualEnabled}
                  onChange={(event) =>
                    setCommercialForm((current) => ({
                      ...current,
                      manualEnabled: event.target.checked,
                    }))
                  }
                />
                <span>{localeText(locale, "Manual review", "ম্যানুয়াল রিভিউ")}</span>
              </label>
            </div>
            <p className="hint">
              {localeText(
                locale,
                "Office and manual orders still activate only after admin approval, which matches the current business rule.",
                "অফিস ও ম্যানুয়াল অর্ডার এখনো অ্যাডমিন অনুমোদনের পরই সক্রিয় হবে, যা বর্তমান ব্যবসায়িক নিয়মের সাথে মিলে যায়।",
              )}
            </p>
          </div>

          <div className="summary-card">
            <p className="section-kicker">
              {localeText(locale, "Sponsored Inventory", "স্পন্সরড ইনভেন্টরি")}
            </p>
            <h4>
              {localeText(
                locale,
                "Keep monetization on public discovery pages and away from trust-sensitive flows.",
                "মনিটাইজেশনকে পাবলিক ডিসকভারি পেজে রাখুন এবং আস্থা-সংবেদনশীল ফ্লো থেকে দূরে রাখুন।",
              )}
            </h4>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={commercialForm.adsEnabled}
                onChange={(event) =>
                  setCommercialForm((current) => ({
                    ...current,
                    adsEnabled: event.target.checked,
                  }))
                }
              />
              <span>
                {localeText(
                  locale,
                  "Enable public sponsored placements",
                  "পাবলিক স্পন্সরড প্লেসমেন্ট চালু করুন",
                )}
              </span>
            </label>
            <label className="field">
              <span>{localeText(locale, "Ad mode", "অ্যাড মোড")}</span>
              <select
                value={commercialForm.adsMode}
                onChange={(event) =>
                  setCommercialForm((current) => ({
                    ...current,
                    adsMode: event.target.value === "ADSENSE" ? "ADSENSE" : "TEST",
                  }))
                }
              >
                <option value="TEST">
                  {localeText(locale, "Test placeholder", "টেস্ট প্লেসহোল্ডার")}
                </option>
                <option value="ADSENSE">AdSense</option>
              </select>
            </label>
            <label className="field">
              <span>{localeText(locale, "AdSense client ID", "AdSense ক্লায়েন্ট আইডি")}</span>
              <input
                type="text"
                value={commercialForm.adsClientId}
                onChange={(event) =>
                  setCommercialForm((current) => ({
                    ...current,
                    adsClientId: event.target.value,
                  }))
                }
                placeholder="ca-pub-xxxxxxxxxxxx"
              />
            </label>
            <p className="hint">
              {localeText(
                locale,
                "Recommended public-only placements: home, vendors, wedding planning, and optionally privacy-limited profile pages.",
                "প্রস্তাবিত পাবলিক-শুধু প্লেসমেন্ট: হোম, ভেন্ডর, ওয়েডিং প্ল্যানিং, এবং প্রয়োজন হলে গোপনীয়তাসীমিত প্রোফাইল পেজ।",
              )}
            </p>
          </div>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Home slot ID", "হোম স্লট আইডি")}</span>
            <input
              type="text"
              value={commercialForm.homeHeroSlotId}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  homeHeroSlotId: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Vendors slot ID", "ভেন্ডর স্লট আইডি")}</span>
            <input
              type="text"
              value={commercialForm.vendorsSlotId}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  vendorsSlotId: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Wedding slot ID", "ওয়েডিং স্লট আইডি")}</span>
            <input
              type="text"
              value={commercialForm.weddingSlotId}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  weddingSlotId: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Profiles slot ID", "প্রোফাইল স্লট আইডি")}</span>
            <input
              type="text"
              value={commercialForm.profilesSlotId}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  profilesSlotId: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="tag-list">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={commercialForm.showAdsOnHome}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  showAdsOnHome: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Show on home", "হোমে দেখান")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={commercialForm.showAdsOnVendors}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  showAdsOnVendors: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Show on vendors", "ভেন্ডরে দেখান")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={commercialForm.showAdsOnWedding}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  showAdsOnWedding: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Show on wedding", "ওয়েডিংয়ে দেখান")}</span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={commercialForm.showAdsOnProfiles}
              onChange={(event) =>
                setCommercialForm((current) => ({
                  ...current,
                  showAdsOnProfiles: event.target.checked,
                }))
              }
            />
            <span>{localeText(locale, "Show on profiles", "প্রোফাইলে দেখান")}</span>
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void saveCommercialSettings()}
            disabled={busyKey === "commercial-settings"}
          >
            {busyKey === "commercial-settings"
              ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
              : localeText(
                  locale,
                  "Save commercial settings",
                  "কমার্শিয়াল সেটিংস সেভ করুন",
                )}
          </button>
        </div>
      </article>

      <SuperAdminMailingPanel
        accessToken={accessToken}
        locale={locale}
        matchMail={matchMail}
        campaigns={campaigns}
        onRefresh={onRefresh}
      />

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Admin Team", "অ্যাডমিন টিম")}</p>
            <h3>
              {localeText(locale, "Create admins and manage access", "অ্যাডমিন তৈরি করুন এবং প্রবেশাধিকার পরিচালনা করুন")}
            </h3>
          </div>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Display name", "ডিসপ্লে নাম")}</span>
            <input
              type="text"
              value={createAdminForm.displayName}
              onChange={(event) =>
                setCreateAdminForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Email", "ইমেইল")}</span>
            <input
              type="email"
              value={createAdminForm.email}
              onChange={(event) =>
                setCreateAdminForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Password", "পাসওয়ার্ড")}</span>
            <input
              type="password"
              value={createAdminForm.password}
              onChange={(event) =>
                setCreateAdminForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Status", "স্ট্যাটাস")}</span>
            <select
              value={createAdminForm.status}
              onChange={(event) =>
                setCreateAdminForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="ACTIVE">{localeText(locale, "Active", "সক্রিয়")}</option>
              <option value="INACTIVE">{localeText(locale, "Inactive", "নিষ্ক্রিয়")}</option>
              <option value="SUSPENDED">{localeText(locale, "Suspended", "সাসপেন্ডেড")}</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>{localeText(locale, "Permissions", "অনুমতি")}</span>
          <input
            type="text"
            value={createAdminForm.permissions}
            onChange={(event) =>
              setCreateAdminForm((current) => ({
                ...current,
                permissions: event.target.value,
              }))
            }
            placeholder={localeText(
              locale,
              "PROFILE_REVIEW, PAYMENT_APPROVAL",
              "PROFILE_REVIEW, PAYMENT_APPROVAL",
            )}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={createAdminForm.isSuperAdmin}
            onChange={(event) =>
              setCreateAdminForm((current) => ({
                ...current,
                isSuperAdmin: event.target.checked,
              }))
            }
          />
          <span>{localeText(locale, "Grant super admin access", "সুপার অ্যাডমিন অ্যাক্সেস দিন")}</span>
        </label>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void createAdmin()}
            disabled={busyKey === "create-admin"}
          >
            {busyKey === "create-admin"
              ? localeText(locale, "Creating...", "তৈরি হচ্ছে...")
              : localeText(locale, "Create Admin", "অ্যাডমিন তৈরি করুন")}
          </button>
        </div>

        <div className="stack-list">
          {admins.map((admin) => {
            const draft = adminDrafts[admin.id];

            if (!draft) {
              return null;
            }

            return (
              <article key={admin.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{admin.displayName}</strong>
                      <p className="mini-text">{admin.user.email}</p>
                    </div>
                    <div className="tag-list">
                      <span className="tag">{translateAdminStatus(admin.status, locale)}</span>
                      {admin.isSuperAdmin ? (
                        <span className="tag">
                          {localeText(locale, "Super Admin", "সুপার অ্যাডমিন")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>{localeText(locale, "Display name", "ডিসপ্লে নাম")}</span>
                      <input
                        type="text"
                        value={draft.displayName}
                        onChange={(event) =>
                          setAdminDrafts((current) => ({
                            ...current,
                            [admin.id]: {
                              ...current[admin.id],
                              displayName: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Status", "স্ট্যাটাস")}</span>
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setAdminDrafts((current) => ({
                            ...current,
                            [admin.id]: {
                              ...current[admin.id],
                              status: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="ACTIVE">{localeText(locale, "Active", "সক্রিয়")}</option>
                        <option value="INACTIVE">{localeText(locale, "Inactive", "নিষ্ক্রিয়")}</option>
                        <option value="SUSPENDED">{localeText(locale, "Suspended", "সাসপেন্ডেড")}</option>
                      </select>
                    </label>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>{localeText(locale, "Reset password", "পাসওয়ার্ড রিসেট")}</span>
                      <input
                        type="password"
                        value={draft.password}
                        onChange={(event) =>
                          setAdminDrafts((current) => ({
                            ...current,
                            [admin.id]: {
                              ...current[admin.id],
                              password: event.target.value,
                            },
                          }))
                        }
                        placeholder={localeText(
                          locale,
                          "Leave blank to keep current password",
                          "বর্তমান পাসওয়ার্ড রাখতে ফাঁকা রাখুন",
                        )}
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Permissions", "অনুমতি")}</span>
                      <input
                        type="text"
                        value={draft.permissions}
                        onChange={(event) =>
                          setAdminDrafts((current) => ({
                            ...current,
                            [admin.id]: {
                              ...current[admin.id],
                              permissions: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={draft.isSuperAdmin}
                      onChange={(event) =>
                        setAdminDrafts((current) => ({
                          ...current,
                          [admin.id]: {
                            ...current[admin.id],
                            isSuperAdmin: event.target.checked,
                          },
                        }))
                      }
                    />
                    <span>{localeText(locale, "Super admin access", "সুপার অ্যাডমিন অ্যাক্সেস")}</span>
                  </label>

                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void updateAdmin(admin.id)}
                      disabled={busyKey === `admin:${admin.id}`}
                    >
                      {busyKey === `admin:${admin.id}`
                        ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                        : localeText(locale, "Save Admin", "অ্যাডমিন সেভ করুন")}
                    </button>
                    <span className="hint">
                      {localeText(locale, "Created", "তৈরি হয়েছে")}{" "}
                      {formatDate(admin.createdAt, locale)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              {localeText(locale, "Membership Configuration", "মেম্বারশিপ কনফিগারেশন")}
            </p>
            <h3>
              {localeText(
                locale,
                "Control pricing, duration, and contact rules",
                "মূল্য, মেয়াদ, এবং কন্টাক্ট নিয়ম নিয়ন্ত্রণ করুন",
              )}
            </h3>
          </div>
        </div>

        <div className="card-grid">
          <article className="mini-card mini-card-horizontal">
            <div className="mini-card-body">
              <strong>{localeText(locale, "Create new plan", "নতুন প্ল্যান তৈরি করুন")}</strong>
              <div className="input-grid">
                <label className="field">
                  <span>{localeText(locale, "Code", "কোড")}</span>
                  <input
                    type="text"
                    value={createPlanForm.code}
                    onChange={(event) =>
                      setCreatePlanForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>{localeText(locale, "Category", "ক্যাটাগরি")}</span>
                  <select
                    value={createPlanForm.category}
                    onChange={(event) =>
                      setCreatePlanForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option value="ONLINE">{localeText(locale, "Online", "অনলাইন")}</option>
                    <option value="ASSISTED">{localeText(locale, "Assisted", "এসিস্টেড")}</option>
                  </select>
                </label>
                <label className="field">
                  <span>{localeText(locale, "Name (English)", "নাম (ইংরেজি)")}</span>
                  <input
                    type="text"
                    value={createPlanForm.nameEn}
                    onChange={(event) =>
                      setCreatePlanForm((current) => ({
                        ...current,
                        nameEn: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="input-grid">
                <label className="field">
                  <span>{localeText(locale, "BDT price", "বিডিটি মূল্য")}</span>
                  <input
                    type="number"
                    value={createPlanForm.bdtPrice}
                    onChange={(event) =>
                      setCreatePlanForm((current) => ({
                        ...current,
                        bdtPrice: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>{localeText(locale, "USD price", "ইউএসডি মূল্য")}</span>
                  <input
                    type="number"
                    value={createPlanForm.usdPrice}
                    onChange={(event) =>
                      setCreatePlanForm((current) => ({
                        ...current,
                        usdPrice: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="inline-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void createPlan()}
                  disabled={busyKey === "create-plan"}
                >
                  {busyKey === "create-plan"
                    ? localeText(locale, "Creating...", "তৈরি হচ্ছে...")
                    : localeText(locale, "Create Plan", "প্ল্যান তৈরি করুন")}
                </button>
              </div>
            </div>
          </article>
        </div>

        <div className="stack-list">
          {plans.map((plan) => {
            const draft = planDrafts[plan.id];

            if (!draft) {
              return null;
            }

            return (
              <article key={plan.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{plan.nameEn}</strong>
                      <p className="mini-text">{plan.code} &middot; {(plan.category ?? "ONLINE") === "ONLINE" ? "Online" : "Assisted"}</p>
                    </div>
                    <div className="tag-list">
                      <span className="tag">
                        {plan.isActive
                          ? localeText(locale, "Active", "সক্রিয়")
                          : localeText(locale, "Paused", "স্থগিত")}
                      </span>
                      <span className="tag">
                        {plan.durationDays} {localeText(locale, "days", "দিন")}
                      </span>
                    </div>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>{localeText(locale, "Category", "ক্যাটাগরি")}</span>
                      <select
                        value={draft.category}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              category: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="ONLINE">{localeText(locale, "Online", "অনলাইন")}</option>
                        <option value="ASSISTED">{localeText(locale, "Assisted", "এসিস্টেড")}</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Name (EN)", "নাম (EN)")}</span>
                      <input
                        type="text"
                        value={draft.nameEn}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              nameEn: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Name (BN)", "নাম (BN)")}</span>
                      <input
                        type="text"
                        value={draft.nameBn}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              nameBn: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>BDT</span>
                      <input
                        type="number"
                        value={draft.bdtPrice}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              bdtPrice: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>USD</span>
                      <input
                        type="number"
                        value={draft.usdPrice}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              usdPrice: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="input-grid">
                    <label className="field">
                      <span>{localeText(locale, "Duration", "মেয়াদ")}</span>
                      <input
                        type="number"
                        value={draft.durationDays}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              durationDays: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{localeText(locale, "Contact limit", "কন্টাক্ট সীমা")}</span>
                      <input
                        type="number"
                        value={draft.contactLimit}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              contactLimit: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="checkbox-stack">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={draft.messageEnabled}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              messageEnabled: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>{localeText(locale, "Messaging enabled", "মেসেজিং চালু")}</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={draft.contactViewEnabled}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              contactViewEnabled: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>{localeText(locale, "Contact view enabled", "কন্টাক্ট দেখা চালু")}</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={draft.highlightEnabled}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              highlightEnabled: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>{localeText(locale, "Highlighted placement", "হাইলাইটেড অবস্থান")}</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setPlanDrafts((current) => ({
                            ...current,
                            [plan.id]: {
                              ...current[plan.id],
                              isActive: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>{localeText(locale, "Plan is active", "প্ল্যান সক্রিয়")}</span>
                    </label>
                  </div>

                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void updatePlan(plan.id)}
                      disabled={busyKey === `plan:${plan.id}`}
                    >
                      {busyKey === `plan:${plan.id}`
                        ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                        : localeText(locale, "Save Plan", "প্ল্যান সেভ করুন")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Coupons", "কুপন")}</p>
            <h3>
              {localeText(
                locale,
                "Launch offers and upgrade incentives",
                "অফার চালু করুন এবং আপগ্রেডে উৎসাহ দিন",
              )}
            </h3>
          </div>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Code", "কোড")}</span>
            <input
              type="text"
              value={createCouponForm.code}
              onChange={(event) =>
                setCreateCouponForm((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Discount type", "ডিসকাউন্ট ধরন")}</span>
            <select
              value={createCouponForm.discountType}
              onChange={(event) =>
                setCreateCouponForm((current) => ({
                  ...current,
                  discountType: event.target.value,
                }))
              }
            >
              <option value="PERCENT">{localeText(locale, "Percent", "শতাংশ")}</option>
              <option value="AMOUNT">{localeText(locale, "Amount", "পরিমাণ")}</option>
            </select>
          </label>
        </div>

        <div className="input-grid">
          <label className="field">
            <span>{localeText(locale, "Percent", "শতাংশ")}</span>
            <input
              type="number"
              value={createCouponForm.percent}
              onChange={(event) =>
                setCreateCouponForm((current) => ({
                  ...current,
                  percent: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>{localeText(locale, "Amount", "পরিমাণ")}</span>
            <input
              type="number"
              value={createCouponForm.amount}
              onChange={(event) =>
                setCreateCouponForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void createCoupon()}
            disabled={busyKey === "create-coupon"}
          >
            {busyKey === "create-coupon"
              ? localeText(locale, "Creating...", "তৈরি হচ্ছে...")
              : localeText(locale, "Create Coupon", "কুপন তৈরি করুন")}
          </button>
        </div>

        <div className="stack-list">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="mini-card mini-card-horizontal">
              <div className="mini-card-body">
                <div className="panel-header">
                  <div>
                    <strong>{coupon.code}</strong>
                    <p className="mini-text">
                      {coupon.discountType === "PERCENT"
                        ? `${coupon.percent ?? 0}%`
                        : coupon.amount ?? 0}{" "}
                      {coupon.currencyScope ?? ""}
                    </p>
                  </div>
                  <div className="tag-list">
                    <span className="tag">
                      {coupon.isActive
                        ? localeText(locale, "Active", "সক্রিয়")
                        : localeText(locale, "Paused", "স্থগিত")}
                    </span>
                    <span className="tag">
                      {coupon.usageCount} {localeText(locale, "uses", "বার ব্যবহার")}
                    </span>
                  </div>
                </div>
                <p className="mini-text">
                  {localeText(locale, "Applies to", "প্রযোজ্য")} {coupon.appliesTo} •{" "}
                  {localeText(locale, "Expires", "মেয়াদ শেষ")}{" "}
                  {formatDate(coupon.expiresAt, locale)}
                </p>
                <p className="mini-text">
                  {localeText(locale, "Created by", "তৈরি করেছেন")}{" "}
                  {coupon.createdByAdmin?.email ?? localeText(locale, "Unknown", "অজানা")}{" "}
                  {localeText(locale, "on", "তারিখ")} {formatDate(coupon.createdAt, locale)}
                </p>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="button button-soft"
                    onClick={() => void toggleCoupon(coupon.id, !coupon.isActive)}
                    disabled={busyKey === `coupon:${coupon.id}`}
                  >
                    {busyKey === `coupon:${coupon.id}`
                      ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                      : coupon.isActive
                        ? localeText(locale, "Pause Coupon", "কুপন স্থগিত করুন")
                        : localeText(locale, "Activate Coupon", "কুপন চালু করুন")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>

      {/* ── Ghotok Management ────────────────────────────────────────────────── */}
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Ghotok Management", "ঘটক ব্যবস্থাপনা")}</p>
            <h3>{localeText(locale, "Review and manage matchmakers", "ঘটকদের পর্যালোচনা ও ব্যবস্থাপনা")}</h3>
          </div>
          <div className="tag-list">
            <span className="tag">{pendingGhotoks.length} {localeText(locale, "pending", "অপেক্ষমান")}</span>
            <span className="tag">{allGhotoks.filter((g) => g.status === "ACTIVE").length} {localeText(locale, "active", "সক্রিয়")}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          {(["PENDING_REVIEW", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`button button-soft${ghotokTab === tab ? " button-active" : ""}`}
              style={{ fontSize: "0.82rem", padding: "3px 12px", fontWeight: ghotokTab === tab ? 600 : 400 }}
              onClick={() => setGhotokTab(tab)}
            >
              {tab === "PENDING_REVIEW" ? localeText(locale, "Pending", "অপেক্ষমান")
                : tab === "ACTIVE" ? localeText(locale, "Active", "সক্রিয়")
                : localeText(locale, "Suspended", "সাসপেন্ডেড")}
            </button>
          ))}
        </div>

        {/* Pending tab — approve/reject */}
        {ghotokTab === "PENDING_REVIEW" && (
          pendingGhotoks.length === 0 ? (
            <p className="empty-state">{localeText(locale, "No pending ghotok registrations.", "কোনো অপেক্ষমান ঘটক নিবন্ধন নেই।")}</p>
          ) : (
            <div className="review-list">
              {pendingGhotoks.map((ghotok) => (
                <div key={ghotok.id} className="review-item">
                  <div className="review-item-header">
                    <div>
                      <strong>{ghotok.displayName}</strong>
                      {ghotok.gender && <Badge>{ghotok.gender}</Badge>}
                    </div>
                    <span className="mini-text">{new Date(ghotok.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mini-text">
                    {localeText(locale, "Email", "ইমেইল")}: {ghotok.user?.email ?? ghotok.email ?? "—"} •{" "}
                    {localeText(locale, "Phone", "ফোন")}: {ghotok.phone ?? "—"}
                  </p>
                  {ghotok.bioEn && (
                    <p className="mini-text">{ghotok.bioEn.slice(0, 120)}{ghotok.bioEn.length > 120 ? "…" : ""}</p>
                  )}
                  <label className="field" style={{ marginTop: "0.5rem" }}>
                    <span>{localeText(locale, "Notes (optional)", "নোট (ঐচ্ছিক)")}</span>
                    <input
                      type="text"
                      value={ghotokNotes[ghotok.id] ?? ""}
                      onChange={(e) => setGhotokNotes((prev) => ({ ...prev, [ghotok.id]: e.target.value }))}
                    />
                  </label>
                  <div className="inline-actions" style={{ marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === `ghotok:approve:${ghotok.id}`}
                      onClick={() => void moderateGhotok(ghotok.id, "approve")}
                    >
                      {busyKey === `ghotok:approve:${ghotok.id}` ? localeText(locale, "Approving…", "অনুমোদন হচ্ছে…") : localeText(locale, "Approve", "অনুমোদন করুন")}
                    </button>
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={busyKey === `ghotok:reject:${ghotok.id}`}
                      onClick={() => void moderateGhotok(ghotok.id, "reject")}
                    >
                      {busyKey === `ghotok:reject:${ghotok.id}` ? localeText(locale, "Rejecting…", "প্রত্যাখ্যান হচ্ছে…") : localeText(locale, "Reject", "প্রত্যাখ্যান করুন")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Active / Suspended tabs — credit top-up + status change */}
        {(ghotokTab === "ACTIVE" || ghotokTab === "SUSPENDED") && (() => {
          const filtered = allGhotoks.filter((g) => g.status === ghotokTab);
          if (filtered.length === 0) {
            return <p className="empty-state">{localeText(locale, "No ghotoks in this state.", "এই অবস্থায় কোনো ঘটক নেই।")}</p>;
          }
          return (
            <div className="review-list">
              {filtered.map((ghotok) => (
                <div key={ghotok.id} className="review-item">
                  <div className="review-item-header">
                    <div>
                      <strong>{ghotok.displayName}</strong>
                      {ghotok.gender && <Badge>{ghotok.gender}</Badge>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="mini-text">{ghotok.managedMemberCount} members</span>
                      <span className="mini-text">{new Date(ghotok.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="mini-text">
                    {localeText(locale, "Email", "ইমেইল")}: {ghotok.user?.email ?? ghotok.email ?? "—"} •{" "}
                    {localeText(locale, "Credits", "ক্রেডিট")}: <strong>{ghotok.creditBalance}</strong>
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <label className="field" style={{ flex: "0 0 120px", marginBottom: 0 }}>
                      <span style={{ fontSize: "0.75rem" }}>{localeText(locale, "Add credits", "ক্রেডিট যোগ করুন")}</span>
                      <input
                        type="number"
                        min={1}
                        value={ghotokCredits[ghotok.id] ?? ""}
                        onChange={(e) => setGhotokCredits((prev) => ({ ...prev, [ghotok.id]: e.target.value }))}
                        style={{ padding: "4px 8px" }}
                      />
                    </label>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busyKey === `ghotok:credits:${ghotok.id}` || !ghotokCredits[ghotok.id]}
                      onClick={() => void addGhotokCredits(ghotok.id)}
                      style={{ padding: "5px 14px", fontSize: "0.82rem" }}
                    >
                      {busyKey === `ghotok:credits:${ghotok.id}` ? localeText(locale, "Adding…", "যোগ হচ্ছে…") : localeText(locale, "Add", "যোগ করুন")}
                    </button>
                    {ghotokTab === "ACTIVE" && (
                      <button
                        type="button"
                        className="button button-danger"
                        disabled={busyKey === `ghotok:status:${ghotok.id}`}
                        onClick={() => void changeGhotokStatus(ghotok.id, "SUSPENDED")}
                        style={{ padding: "5px 14px", fontSize: "0.82rem" }}
                      >
                        {localeText(locale, "Suspend", "সাসপেন্ড করুন")}
                      </button>
                    )}
                    {ghotokTab === "SUSPENDED" && (
                      <button
                        type="button"
                        className="button button-soft"
                        disabled={busyKey === `ghotok:status:${ghotok.id}`}
                        onClick={() => void changeGhotokStatus(ghotok.id, "ACTIVE")}
                        style={{ padding: "5px 14px", fontSize: "0.82rem" }}
                      >
                        {localeText(locale, "Reinstate", "পুনর্বহাল করুন")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </article>

      {/* ── Vendor Management ────────────────────────────────────────────────── */}
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Vendor Management", "ভেন্ডর ব্যবস্থাপনা")}</p>
            <h3>{localeText(locale, "Review and manage vendors", "ভেন্ডরদের পর্যালোচনা ও ব্যবস্থাপনা")}</h3>
          </div>
          <div className="tag-list">
            <span className="tag">{pendingVendors.length} {localeText(locale, "pending", "অপেক্ষমান")}</span>
            <span className="tag">{allVendors.filter((v) => v.status === "ACTIVE").length} {localeText(locale, "active", "সক্রিয়")}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
          {(["PENDING_REVIEW", "ACTIVE", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`button button-soft${vendorTab === tab ? " button-active" : ""}`}
              style={{ fontSize: "0.82rem", padding: "3px 12px", fontWeight: vendorTab === tab ? 600 : 400 }}
              onClick={() => setVendorTab(tab)}
            >
              {tab === "PENDING_REVIEW" ? localeText(locale, "Pending", "অপেক্ষমান")
                : tab === "ACTIVE" ? localeText(locale, "Active", "সক্রিয়")
                : localeText(locale, "Rejected", "প্রত্যাখ্যাত")}
            </button>
          ))}
        </div>

        {vendorTab === "PENDING_REVIEW" && (
          pendingVendors.length === 0 ? (
            <p className="empty-state">{localeText(locale, "No pending vendor registrations.", "কোনো অপেক্ষমান ভেন্ডর নিবন্ধন নেই।")}</p>
          ) : (
            <div className="review-list">
              {pendingVendors.map((vendor) => (
                <div key={vendor.id} className="review-item">
                  <div className="review-item-header">
                    <div>
                      <strong>{vendor.businessName}</strong>
                      {vendor.categoryName && <Badge>{vendor.categoryName}</Badge>}
                    </div>
                    <span className="mini-text">{new Date(vendor.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mini-text">
                    {localeText(locale, "Contact", "যোগাযোগ")}: {vendor.contactPerson ?? "—"} •{" "}
                    {localeText(locale, "Phone", "ফোন")}: {vendor.phone ?? "—"} •{" "}
                    {localeText(locale, "Email", "ইমেইল")}: {vendor.user?.email ?? vendor.email ?? "—"}
                  </p>
                  {(vendor.division || vendor.district) && (
                    <p className="mini-text">{[vendor.division, vendor.district].filter(Boolean).join(", ")}</p>
                  )}
                  <label className="field" style={{ marginTop: "0.5rem" }}>
                    <span>{localeText(locale, "Notes (optional)", "নোট (ঐচ্ছিক)")}</span>
                    <input type="text" value={vendorNotes[vendor.id] ?? ""} onChange={(e) => setVendorNotes((prev) => ({ ...prev, [vendor.id]: e.target.value }))} />
                  </label>
                  <div className="inline-actions" style={{ marginTop: "0.5rem" }}>
                    <button type="button" className="button button-primary" disabled={busyKey === `vendor:approve:${vendor.id}`} onClick={() => void moderateVendor(vendor.id, "approve")}>
                      {busyKey === `vendor:approve:${vendor.id}` ? localeText(locale, "Approving…", "অনুমোদন হচ্ছে…") : localeText(locale, "Approve", "অনুমোদন করুন")}
                    </button>
                    <button type="button" className="button button-danger" disabled={busyKey === `vendor:reject:${vendor.id}`} onClick={() => void moderateVendor(vendor.id, "reject")}>
                      {busyKey === `vendor:reject:${vendor.id}` ? localeText(locale, "Rejecting…", "প্রত্যাখ্যান হচ্ছে…") : localeText(locale, "Reject", "প্রত্যাখ্যান করুন")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {(vendorTab === "ACTIVE" || vendorTab === "REJECTED") && (() => {
          const filtered = allVendors.filter((v) => v.status === vendorTab);
          if (filtered.length === 0) return <p className="empty-state">{localeText(locale, "No vendors in this state.", "এই অবস্থায় কোনো ভেন্ডর নেই।")}</p>;
          return (
            <div className="review-list">
              {filtered.map((vendor) => (
                <div key={vendor.id} className="review-item">
                  <div className="review-item-header">
                    <div>
                      <strong>{vendor.businessName}</strong>
                      {vendor.categoryName && <Badge>{vendor.categoryName}</Badge>}
                    </div>
                    <span className="mini-text">{new Date(vendor.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mini-text">
                    {localeText(locale, "Contact", "যোগাযোগ")}: {vendor.contactPerson ?? "—"} •{" "}
                    {localeText(locale, "Email", "ইমেইল")}: {vendor.user?.email ?? vendor.email ?? "—"}
                  </p>
                  <div className="inline-actions" style={{ marginTop: "0.5rem" }}>
                    {vendorTab === "ACTIVE" && (
                      <button type="button" className="button button-danger" disabled={busyKey === `vendor:status:${vendor.id}`} onClick={() => void changeVendorStatus(vendor.id, "REJECTED")} style={{ padding: "5px 14px", fontSize: "0.82rem" }}>
                        {localeText(locale, "Deactivate", "নিষ্ক্রিয় করুন")}
                      </button>
                    )}
                    {vendorTab === "REJECTED" && (
                      <button type="button" className="button button-soft" disabled={busyKey === `vendor:status:${vendor.id}`} onClick={() => void changeVendorStatus(vendor.id, "ACTIVE")} style={{ padding: "5px 14px", fontSize: "0.82rem" }}>
                        {localeText(locale, "Reinstate", "পুনর্বহাল করুন")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </article>
    </section>
  );
}
