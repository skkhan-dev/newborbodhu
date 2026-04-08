import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addWeddingGuest,
  approveManualPayment,
  approveProfileReview,
  createMembershipOrder,
  createGhotokManagedMember,
  createMemberMediaUploadRequest,
  createVendorPackage,
  consumeGhotokContactView,
  createDirectConversation,
  createWeddingProject,
  decidePhotoRequest,
  endGhotokImpersonation,
  getCurrentUser,
  loadConversationMessages,
  loadDashboardBundle,
  login,
  markConversationRead,
  registerMemberMedia,
  registerMember,
  rejectManualPayment,
  rejectProfileReview,
  sendConversationMessage,
  shortlistVendor,
  startGhotokImpersonation,
  submitProfileReview,
  updateMemberMedia,
  updateMemberProfile,
  updatePartnerPreferences,
  updateVendorLeadStatus,
  updateVendorProfile,
  updateVendorPackage,
} from "./src/lib/api";
import { trackMobileEvent } from "./src/lib/analytics";
import { getCopy } from "./src/lib/copy";
import { clearSession, loadSession, saveSession } from "./src/lib/session";
import type {
  AuthSession,
  DashboardBundle,
  GhotokManagedMember,
  MailboxConversation,
  MemberProfilePayload,
  MobileLocale,
  VendorDashboardResponse,
  WeddingProject,
} from "./src/lib/types";

type AuthMode = "login" | "signup";
type MemberTab = "overview" | "mailbox" | "wedding" | "vendors" | "profile";
type AdminTab = "overview" | "profiles" | "payments";
type VendorTab = "overview" | "leads" | "packages";
type GhotokTab = "overview" | "members" | "discover";
type VendorLeadFilter = "ALL" | "NEW" | "OPEN" | "RESPONDED" | "BOOKED" | "CLOSED_REJECTED";

type LoginForm = {
  email: string;
  password: string;
};

type SignupForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "MAN" | "WOMAN";
  lookingFor: "MAN" | "WOMAN";
};

type GhotokMemberForm = {
  firstName: string;
  lastName: string;
  gender: "MAN" | "WOMAN";
  lookingFor: "MAN" | "WOMAN";
  memberEmail: string;
  memberPhone: string;
  currentCountryCode: string;
};

type VendorPackageForm = {
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  priceBdt: string;
};

type VendorProfileForm = {
  businessName: string;
  categoryName: string;
  division: string;
  district: string;
  area: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  descriptionEn: string;
  descriptionBn: string;
};

type MemberProfileForm = {
  displayName: string;
  currentCity: string;
  currentCountryCode: string;
  profession: string;
  religion: string;
  guardianPhone: string;
  aboutMe: string;
  familyDetails: string;
  isProfilePublic: "yes" | "no";
};

type PreferenceForm = {
  gender: "MAN" | "WOMAN";
  ageMin: string;
  ageMax: string;
  aboutPartner: string;
};

const defaultLoginForm: LoginForm = {
  email: "member@borbodhu.local",
  password: "Password123!",
};

const defaultSignupForm: SignupForm = {
  email: "",
  password: "Password123!",
  firstName: "",
  lastName: "",
  gender: "WOMAN",
  lookingFor: "MAN",
};

const defaultMemberProfileForm: MemberProfileForm = {
  displayName: "",
  currentCity: "",
  currentCountryCode: "",
  profession: "",
  religion: "",
  guardianPhone: "",
  aboutMe: "",
  familyDetails: "",
  isProfilePublic: "yes",
};

const defaultPreferenceForm: PreferenceForm = {
  gender: "MAN",
  ageMin: "",
  ageMax: "",
  aboutPartner: "",
};

const defaultGhotokMemberForm: GhotokMemberForm = {
  firstName: "",
  lastName: "",
  gender: "WOMAN",
  lookingFor: "MAN",
  memberEmail: "",
  memberPhone: "",
  currentCountryCode: "BD",
};

const defaultVendorPackageForm: VendorPackageForm = {
  nameEn: "",
  nameBn: "",
  descriptionEn: "",
  descriptionBn: "",
  priceBdt: "",
};

const defaultVendorProfileForm: VendorProfileForm = {
  businessName: "",
  categoryName: "",
  division: "",
  district: "",
  area: "",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
  website: "",
  descriptionEn: "",
  descriptionBn: "",
};

function translateStatus(value: string, locale: MobileLocale, copy: ReturnType<typeof getCopy>) {
  switch (value) {
    case "ACTIVE":
    case "APPROVED":
      return copy.active;
    case "PENDING":
    case "PENDING_REVIEW":
    case "MANUAL_REVIEW":
      return copy.pending;
    case "NEW":
      return copy.newLabel;
    case "MANUAL_APPROVED":
      return copy.manualApproved;
    case "MANUAL_REJECTED":
      return copy.manualRejected;
    case "REJECTED":
      return copy.rejected;
    case "CANCELLED":
      return copy.cancelled;
    case "INACTIVE":
      return copy.inactive;
    case "PAID":
      return copy.paid;
    case "OPEN":
      return copy.openStatus;
    case "RESPONDED":
      return copy.responded;
    case "BOOKED":
      return copy.booked;
    case "CLOSED_REJECTED":
      return copy.closedRejected;
    case "DRAFT":
      return copy.draftStatus;
    case "ARCHIVED":
      return copy.archivedStatus;
    case "MAN":
      return copy.man;
    case "WOMAN":
      return copy.woman;
    case "PUBLIC":
      return copy.publicMedia;
    case "PRIVATE":
      return copy.privateMedia;
    case "DENIED":
      return copy.rejected;
    default:
      return locale === "bn" ? value.replaceAll("_", " ") : value.replaceAll("_", " ");
  }
}

function LocaleSwitch({
  locale,
  onChange,
}: {
  locale: MobileLocale;
  onChange: (locale: MobileLocale) => void;
}) {
  return (
    <View style={styles.segmented}>
      {(["en", "bn"] as const).map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[
            styles.segmentButton,
            locale === option ? styles.segmentButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.segmentLabel,
              locale === option ? styles.segmentLabelActive : null,
            ]}
          >
            {option === "en" ? "EN" : "বাংলা"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ChoiceSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[
            styles.segmentButton,
            value === option.value ? styles.segmentButtonActive : null,
          ]}
        >
          <Text
            style={[
              styles.segmentLabel,
              value === option.value ? styles.segmentLabelActive : null,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AuthField({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = "none",
  multiline = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        editable={editable}
        style={[
          styles.input,
          multiline ? styles.textarea : null,
          !editable ? styles.inputReadonly : null,
        ]}
        placeholderTextColor="#85695f"
      />
    </View>
  );
}

function DashboardCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{title}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

function StatusPill({
  label,
  tone = "soft",
}: {
  label: string;
  tone?: "soft" | "warm" | "accent";
}) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "warm" ? styles.statusPillWarm : null,
        tone === "accent" ? styles.statusPillAccent : null,
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          tone === "warm" ? styles.statusPillTextWarm : null,
          tone === "accent" ? styles.statusPillTextAccent : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function formatDate(value: string | null | undefined, locale: MobileLocale) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: number, locale: MobileLocale, currency = "BDT") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getLeadActions(status: string) {
  switch (status) {
    case "NEW":
      return ["OPEN", "CLOSED_REJECTED"] as const;
    case "OPEN":
      return ["RESPONDED", "CLOSED_REJECTED"] as const;
    case "RESPONDED":
      return ["BOOKED", "CLOSED_REJECTED"] as const;
    default:
      return [] as const;
  }
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildMemberProfileForm(profile: MemberProfilePayload): MemberProfileForm {
  return {
    displayName: profile.displayName ?? "",
    currentCity: profile.currentCity ?? "",
    currentCountryCode: profile.currentCountryCode ?? "",
    profession: profile.profession ?? "",
    religion: profile.religion ?? "",
    guardianPhone: profile.guardianPhone ?? "",
    aboutMe: profile.aboutMe ?? "",
    familyDetails: profile.familyDetails ?? "",
    isProfilePublic: profile.isProfilePublic ? "yes" : "no",
  };
}

function buildPreferenceForm(profile: MemberProfilePayload): PreferenceForm {
  return {
    gender: profile.partnerPreference?.gender === "WOMAN" ? "WOMAN" : "MAN",
    ageMin: profile.partnerPreference?.ageMin ? String(profile.partnerPreference.ageMin) : "",
    ageMax: profile.partnerPreference?.ageMax ? String(profile.partnerPreference.ageMax) : "",
    aboutPartner: profile.partnerPreference?.aboutPartner ?? "",
  };
}

function buildVendorProfileForm(vendor: VendorDashboardResponse): VendorProfileForm {
  return {
    businessName: vendor.profile.businessName ?? "",
    categoryName: vendor.profile.categoryName ?? "",
    division: vendor.profile.division ?? "",
    district: vendor.profile.district ?? "",
    area: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    website: "",
    descriptionEn: "",
    descriptionBn: "",
  };
}

function buildVendorPackageForm(
  vendorPackage: VendorDashboardResponse["packages"][number],
): VendorPackageForm {
  return {
    nameEn: vendorPackage.nameEn,
    nameBn: vendorPackage.nameBn ?? "",
    descriptionEn: vendorPackage.descriptionEn ?? "",
    descriptionBn: vendorPackage.descriptionBn ?? "",
    priceBdt: String(vendorPackage.priceBdt),
  };
}

export default function App() {
  const [locale, setLocale] = useState<MobileLocale>("en");
  const [mode, setMode] = useState<AuthMode>("login");
  const [memberTab, setMemberTab] = useState<MemberTab>("overview");
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [vendorTab, setVendorTab] = useState<VendorTab>("overview");
  const [ghotokTab, setGhotokTab] = useState<GhotokTab>("overview");
  const [loginForm, setLoginForm] = useState<LoginForm>(defaultLoginForm);
  const [signupForm, setSignupForm] = useState<SignupForm>(defaultSignupForm);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [dashboard, setDashboard] = useState<DashboardBundle | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, string[]>>({});
  const [messageDraft, setMessageDraft] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [guestDrafts, setGuestDrafts] = useState<Record<string, string>>({});
  const [profileForm, setProfileForm] = useState<MemberProfileForm>(defaultMemberProfileForm);
  const [preferenceForm, setPreferenceForm] = useState<PreferenceForm>(defaultPreferenceForm);
  const [ghotokMemberForm, setGhotokMemberForm] = useState<GhotokMemberForm>(
    defaultGhotokMemberForm,
  );
  const [vendorPackageForm, setVendorPackageForm] = useState<VendorPackageForm>(
    defaultVendorPackageForm,
  );
  const [vendorProfileForm, setVendorProfileForm] = useState<VendorProfileForm>(
    defaultVendorProfileForm,
  );
  const [vendorLeadFilter, setVendorLeadFilter] = useState<VendorLeadFilter>("ALL");
  const [editingVendorPackageId, setEditingVendorPackageId] = useState<string | null>(null);
  const [ghotokUnlockedContacts, setGhotokUnlockedContacts] = useState<
    Record<
      string,
      {
        displayId: string;
        guardianPhone: string | null;
        guardianEmail: string | null;
      }
    >
  >({});

  const copy = useMemo(() => getCopy(locale), [locale]);
  const selectedConversation = useMemo(() => {
    return dashboard?.member?.conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? null;
  }, [dashboard?.member?.conversations, selectedConversationId]);

  useEffect(() => {
    if (!dashboard?.member?.profile) {
      return;
    }

    setProfileForm(buildMemberProfileForm(dashboard.member.profile));
    setPreferenceForm(buildPreferenceForm(dashboard.member.profile));
  }, [dashboard?.member?.profile]);

  useEffect(() => {
    if (!dashboard?.vendor) {
      return;
    }

    setVendorProfileForm(buildVendorProfileForm(dashboard.vendor));
  }, [dashboard?.vendor]);

  async function hydrateDashboard(nextSession: AuthSession) {
    const freshUser = await getCurrentUser(nextSession.accessToken);
    const freshSession = {
      ...nextSession,
      user: freshUser,
    };
    const bundle = await loadDashboardBundle(nextSession.accessToken, freshUser);
    await saveSession(freshSession);
    setSession(freshSession);
    setDashboard(bundle);
  }

  async function runSessionAction(
    nextActionKey: string,
    action: () => Promise<void>,
    successNotice?: string,
  ) {
    setActionKey(nextActionKey);
    setError(null);
    setNotice(null);

    try {
      await action();
      if (successNotice) {
        setNotice(successNotice);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : copy.errorTitle);
    } finally {
      setActionKey(null);
    }
  }

  async function refreshDashboard(currentSession = session) {
    if (!currentSession) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setNotice(null);

    try {
      await hydrateDashboard(currentSession);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : copy.errorTitle);
    } finally {
      setIsBusy(false);
    }
  }

  async function openConversation(
    conversation: Pick<MailboxConversation, "id">,
    currentSession = session,
  ) {
    if (!currentSession) {
      return;
    }

    const payload = await loadConversationMessages(currentSession.accessToken, conversation.id);
    await markConversationRead(currentSession.accessToken, conversation.id);

    setSelectedConversationId(conversation.id);
    setConversationMessages((current) => ({
      ...current,
      [conversation.id]: payload.messages.map((message) =>
        `${message.senderUserId === currentSession.user.id ? "ME" : "THEM"}::${message.body}`,
      ),
    }));
    setMemberTab("mailbox");
  }

  useEffect(() => {
    async function boot() {
      try {
        const storedSession = await loadSession();

        if (storedSession) {
          await hydrateDashboard(storedSession);
        }
      } catch (bootError) {
        setError(bootError instanceof Error ? bootError.message : "Unable to boot app.");
        await clearSession();
      } finally {
        setIsBooting(false);
      }
    }

    void boot();
  }, []);

  async function handleLogin() {
    setIsBusy(true);
    setError(null);
    setNotice(null);

    try {
      const nextSession = await login(loginForm.email.trim(), loginForm.password);
      await hydrateDashboard(nextSession);
      void trackMobileEvent({
        eventName: "LOGIN_SUCCEEDED",
        accessToken: nextSession.accessToken,
        locale,
        screenName: "AUTH_LOGIN",
        pagePath: "/mobile/login",
        metadataJson: {
          roles: nextSession.user.roles,
        },
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : copy.errorTitle);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignup() {
    setIsBusy(true);
    setError(null);
    setNotice(null);

    try {
      const nextSession = await registerMember({
        email: signupForm.email.trim(),
        password: signupForm.password,
        firstName: signupForm.firstName.trim(),
        lastName: signupForm.lastName.trim(),
        gender: signupForm.gender,
        lookingFor: signupForm.lookingFor,
        preferredLocale: locale === "bn" ? "BN" : "EN",
      });
      await hydrateDashboard(nextSession);
      void trackMobileEvent({
        eventName: "MEMBER_SIGNUP_COMPLETED",
        accessToken: nextSession.accessToken,
        locale,
        screenName: "AUTH_SIGNUP",
        pagePath: "/mobile/signup",
        metadataJson: {
          gender: signupForm.gender,
          lookingFor: signupForm.lookingFor,
        },
      });
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : copy.errorTitle);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignOut() {
    await clearSession();
    setSession(null);
    setDashboard(null);
    setSelectedConversationId(null);
    setConversationMessages({});
    setError(null);
    setNotice(null);
  }

  async function handleStartChat(targetMemberProfileId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(
      `chat:${targetMemberProfileId}`,
      async () => {
        const conversation = await createDirectConversation(
          session.accessToken,
          targetMemberProfileId,
        );
        await refreshDashboard(session);
        await openConversation(conversation, session);
      },
      copy.conversationStarted,
    );
  }

  async function handleSendMessage() {
    if (!session || !selectedConversationId || !messageDraft.trim()) {
      return;
    }

    const nextBody = messageDraft.trim();

    await runSessionAction("send-message", async () => {
      await sendConversationMessage(session.accessToken, selectedConversationId, nextBody);
      const payload = await loadConversationMessages(session.accessToken, selectedConversationId);
      setConversationMessages((current) => ({
        ...current,
        [selectedConversationId]: payload.messages.map((message) =>
          `${message.senderUserId === session.user.id ? "ME" : "THEM"}::${message.body}`,
        ),
      }));
      setMessageDraft("");
      await refreshDashboard(session);
    }, copy.messageSent);
  }

  async function handleCreateProject() {
    if (!session || !projectTitle.trim()) {
      return;
    }

    await runSessionAction("create-project", async () => {
      await createWeddingProject(session.accessToken, {
        title: projectTitle.trim(),
      });
      setProjectTitle("");
      await refreshDashboard(session);
      setMemberTab("wedding");
    }, copy.projectCreated);
  }

  async function handleAddGuest(project: WeddingProject) {
    if (!session) {
      return;
    }

    const guestName = guestDrafts[project.id]?.trim();
    if (!guestName) {
      return;
    }

    await runSessionAction(`guest:${project.id}`, async () => {
      await addWeddingGuest(session.accessToken, project.id, {
        guestName,
      });
      setGuestDrafts((current) => ({
        ...current,
        [project.id]: "",
      }));
      await refreshDashboard(session);
    }, copy.guestAdded);
  }

  async function handleShortlistVendor(vendorProfileId: string) {
    if (!session || !dashboard?.member?.weddingProjects.length) {
      return;
    }

    const primaryProject = dashboard.member.weddingProjects[0];

    await runSessionAction(`shortlist:${vendorProfileId}`, async () => {
      await shortlistVendor(session.accessToken, primaryProject.id, {
        vendorProfileId,
      });
      await refreshDashboard(session);
      setMemberTab("wedding");
    }, copy.vendorShortlistedSuccess);
  }

  async function handleSaveProfile() {
    if (!session) {
      return;
    }

    await runSessionAction("save-profile", async () => {
      await updateMemberProfile(session.accessToken, {
        displayName: optionalText(profileForm.displayName),
        currentCity: optionalText(profileForm.currentCity),
        currentCountryCode: optionalText(profileForm.currentCountryCode),
        profession: optionalText(profileForm.profession),
        religion: optionalText(profileForm.religion),
        guardianPhone: optionalText(profileForm.guardianPhone),
        aboutMe: optionalText(profileForm.aboutMe),
        familyDetails: optionalText(profileForm.familyDetails),
        isProfilePublic: profileForm.isProfilePublic === "yes",
      });
      await refreshDashboard(session);
    }, copy.saveSuccessProfile);
  }

  async function handleSavePreferences() {
    if (!session) {
      return;
    }

    await runSessionAction("save-preferences", async () => {
      await updatePartnerPreferences(session.accessToken, {
        gender: preferenceForm.gender,
        ageMin: optionalNumber(preferenceForm.ageMin),
        ageMax: optionalNumber(preferenceForm.ageMax),
        aboutPartner: optionalText(preferenceForm.aboutPartner),
      });
      await refreshDashboard(session);
    }, copy.saveSuccessPreference);
  }

  async function handleSubmitReview() {
    if (!session) {
      return;
    }

    await runSessionAction("submit-review", async () => {
      await submitProfileReview(session.accessToken);
      await refreshDashboard(session);
    }, copy.submittedForReview);
  }

  async function handlePhotoDecision(
    photoRequestId: string,
    decision: "approve" | "deny",
  ) {
    if (!session) {
      return;
    }

    await runSessionAction(`photo-request:${photoRequestId}:${decision}`, async () => {
      await decidePhotoRequest(session.accessToken, photoRequestId, decision);
      await refreshDashboard(session);
    }, decision === "approve" ? copy.photoRequestApproved : copy.photoRequestDenied);
  }

  async function handleMediaVisibility(
    mediaId: string,
    privacyMode: "PUBLIC" | "PRIVATE",
  ) {
    if (!session) {
      return;
    }

    await runSessionAction(`media:${mediaId}:${privacyMode}`, async () => {
      await updateMemberMedia(session.accessToken, mediaId, {
        privacyMode,
      });
      await refreshDashboard(session);
    }, copy.mediaUpdated);
  }

  async function handleMakePrimary(mediaId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`media-primary:${mediaId}`, async () => {
      await updateMemberMedia(session.accessToken, mediaId, {
        isPrimary: true,
      });
      await refreshDashboard(session);
    }, copy.mediaUpdated);
  }

  async function handleCreateMembership(
    membershipPlanId: string,
    gateway: "AMARPAY" | "PAYPAL" | "OFFICE" | "MANUAL",
  ) {
    if (!session) {
      return;
    }

    await runSessionAction(`membership:${membershipPlanId}:${gateway}`, async () => {
      const result = await createMembershipOrder(session.accessToken, {
        membershipPlanId,
        gateway,
      });
      void trackMobileEvent({
        eventName: "MEMBERSHIP_CHECKOUT_STARTED",
        accessToken: session.accessToken,
        locale,
        screenName: "MEMBER_PROFILE",
        pagePath: "/mobile/member/profile",
        entityType: "PAYMENT",
        entityId: result.payment.id,
        metadataJson: {
          gateway,
          membershipPlanId,
          nextAction: result.nextAction,
        },
      });
      await refreshDashboard(session);
      if (result.nextAction === "redirect_to_gateway" && result.checkout?.checkoutUrl) {
        void trackMobileEvent({
          eventName: "PAYMENT_REDIRECT_STARTED",
          accessToken: session.accessToken,
          locale,
          screenName: "MEMBER_PROFILE",
          pagePath: "/mobile/member/profile",
          entityType: "PAYMENT",
          entityId: result.payment.id,
          metadataJson: {
            gateway,
            checkoutUrl: result.checkout.checkoutUrl,
          },
        });
        await Linking.openURL(result.checkout.checkoutUrl);
        setNotice(copy.paymentGatewayPending);
        return;
      }

      setNotice(copy.paymentManualPending);
    });
  }

  async function handleUploadPhoto(source: "library" | "camera") {
    if (!session) {
      return;
    }

    await runSessionAction(`upload-photo:${source}`, async () => {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error(copy.uploadPermissionError);
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsMultipleSelection: false,
              quality: 0.85,
            });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType?.startsWith("image/")
        ? asset.mimeType
        : "image/jpeg";
      const extension = mimeType === "image/png" ? ".png" : ".jpg";
      const fileName = asset.fileName ?? `mobile-photo-${Date.now()}${extension}`;

      const uploadRequest = await createMemberMediaUploadRequest(session.accessToken, {
        mediaType: "PROFILE_PHOTO",
        fileName,
        mimeType,
        privacyMode: "PUBLIC",
      });

      const localFileResponse = await fetch(asset.uri);
      const fileBlob = await localFileResponse.blob();
      const uploadResponse = await fetch(uploadRequest.uploadUrl, {
        method: uploadRequest.method,
        headers: uploadRequest.headers,
        body: fileBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to media storage failed.");
      }

      await registerMemberMedia(session.accessToken, {
        mediaType: "PROFILE_PHOTO",
        storagePath: uploadRequest.storagePath,
        mimeType,
        privacyMode: "PUBLIC",
        isPrimary: (dashboard?.member?.media.length ?? 0) === 0,
      });

      await refreshDashboard(session);
      setMemberTab("profile");
    }, copy.uploadSuccessPhoto);
  }

  async function handleCreateManagedMember() {
    if (!session) {
      return;
    }

    if (!ghotokMemberForm.firstName.trim()) {
      return;
    }

    await runSessionAction("ghotok-create-member", async () => {
      await createGhotokManagedMember(session.accessToken, {
        firstName: ghotokMemberForm.firstName.trim(),
        lastName: optionalText(ghotokMemberForm.lastName),
        gender: ghotokMemberForm.gender,
        lookingFor: ghotokMemberForm.lookingFor,
        memberEmail: optionalText(ghotokMemberForm.memberEmail),
        memberPhone: optionalText(ghotokMemberForm.memberPhone),
        currentCountryCode: optionalText(ghotokMemberForm.currentCountryCode)?.toUpperCase(),
      });
      setGhotokMemberForm(defaultGhotokMemberForm);
      await refreshDashboard(session);
      setGhotokTab("members");
    }, copy.managedMemberCreated);
  }

  async function handleStartImpersonation(memberProfileId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`ghotok-impersonate:${memberProfileId}`, async () => {
      await startGhotokImpersonation(session.accessToken, memberProfileId);
      await refreshDashboard(session);
    }, copy.impersonationStarted);
  }

  async function handleEndImpersonation() {
    if (!session || !dashboard?.ghotok?.activeImpersonation) {
      return;
    }

    await runSessionAction("ghotok-end-impersonation", async () => {
      await endGhotokImpersonation(
        session.accessToken,
        dashboard.ghotok!.activeImpersonation!.id,
      );
      await refreshDashboard(session);
    }, copy.impersonationEnded);
  }

  async function handleGhotokContactView(targetMemberProfileId: string) {
    if (!session || !dashboard?.ghotok?.activeImpersonation) {
      setError(copy.activeImpersonationNeeded);
      return;
    }

    await runSessionAction(`ghotok-contact:${targetMemberProfileId}`, async () => {
      const result = await consumeGhotokContactView(
        session.accessToken,
        dashboard.ghotok!.activeImpersonation!.id,
        targetMemberProfileId,
      );
      setGhotokUnlockedContacts((current) => ({
        ...current,
        [targetMemberProfileId]: result.contact,
      }));
      await refreshDashboard(session);
    }, copy.contactUnlocked);
  }

  async function handleApproveProfile(memberProfileId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`approve-profile:${memberProfileId}`, async () => {
      await approveProfileReview(session.accessToken, memberProfileId);
      await refreshDashboard(session);
    }, copy.profileApprovedNotice);
  }

  async function handleRejectProfile(memberProfileId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`reject-profile:${memberProfileId}`, async () => {
      await rejectProfileReview(session.accessToken, memberProfileId);
      await refreshDashboard(session);
    }, copy.profileRejectedNotice);
  }

  async function handleApprovePayment(paymentId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`approve-payment:${paymentId}`, async () => {
      await approveManualPayment(session.accessToken, paymentId);
      await refreshDashboard(session);
    }, copy.paymentApprovedNotice);
  }

  async function handleRejectPayment(paymentId: string) {
    if (!session) {
      return;
    }

    await runSessionAction(`reject-payment:${paymentId}`, async () => {
      await rejectManualPayment(session.accessToken, paymentId);
      await refreshDashboard(session);
    }, copy.paymentRejectedNotice);
  }

  async function handleVendorLeadStatus(
    leadId: string,
    status: "OPEN" | "RESPONDED" | "BOOKED" | "CLOSED_REJECTED",
  ) {
    if (!session) {
      return;
    }

    await runSessionAction(`lead:${leadId}:${status}`, async () => {
      const nextVendor = await updateVendorLeadStatus(session.accessToken, leadId, status);
      setDashboard((current) =>
        current
          ? {
              ...current,
              vendor: nextVendor,
            }
          : current,
      );
    }, copy.leadUpdatedNotice);
  }

  async function handleSaveVendorProfile() {
    if (!session) {
      return;
    }

    await runSessionAction("vendor-save-profile", async () => {
      const nextVendor = await updateVendorProfile(session.accessToken, {
        businessName: optionalText(vendorProfileForm.businessName),
        categoryName: optionalText(vendorProfileForm.categoryName),
        division: optionalText(vendorProfileForm.division),
        district: optionalText(vendorProfileForm.district),
        area: optionalText(vendorProfileForm.area),
        address: optionalText(vendorProfileForm.address),
        contactPerson: optionalText(vendorProfileForm.contactPerson),
        phone: optionalText(vendorProfileForm.phone),
        email: optionalText(vendorProfileForm.email),
        website: optionalText(vendorProfileForm.website),
        descriptionEn: optionalText(vendorProfileForm.descriptionEn),
        descriptionBn: optionalText(vendorProfileForm.descriptionBn),
      });
      setDashboard((current) =>
        current
          ? {
              ...current,
              vendor: nextVendor,
            }
          : current,
      );
    }, copy.vendorProfileUpdated);
  }

  function handleEditVendorPackage(
    vendorPackage: VendorDashboardResponse["packages"][number],
  ) {
    setEditingVendorPackageId(vendorPackage.id);
    setVendorPackageForm(buildVendorPackageForm(vendorPackage));
    setNotice(copy.packageLoadedForEdit);
    setError(null);
  }

  async function handleCreateVendorPackage() {
    if (!session) {
      return;
    }

    if (!vendorPackageForm.nameEn.trim() || !vendorPackageForm.priceBdt.trim()) {
      return;
    }

    await runSessionAction(
      editingVendorPackageId ? `vendor-update-package:${editingVendorPackageId}` : "vendor-create-package",
      async () => {
        const payload = {
          nameEn: vendorPackageForm.nameEn.trim(),
          nameBn: optionalText(vendorPackageForm.nameBn),
          descriptionEn: optionalText(vendorPackageForm.descriptionEn),
          descriptionBn: optionalText(vendorPackageForm.descriptionBn),
          priceBdt: Number(vendorPackageForm.priceBdt),
          isActive: true,
        };
        const nextVendor = editingVendorPackageId
          ? await updateVendorPackage(
              session.accessToken,
              editingVendorPackageId,
              payload,
            )
          : await createVendorPackage(session.accessToken, payload);
        
        setVendorPackageForm(defaultVendorPackageForm);
        setEditingVendorPackageId(null);
        setDashboard((current) =>
          current
            ? {
                ...current,
                vendor: nextVendor,
              }
            : current,
        );
      },
      editingVendorPackageId ? copy.packageStatusUpdated : copy.packageCreatedNotice,
    );
  }

  async function handleToggleVendorPackage(
    vendorPackage: VendorDashboardResponse["packages"][number],
  ) {
    if (!session) {
      return;
    }

    await runSessionAction(`vendor-package:${vendorPackage.id}`, async () => {
      const nextVendor = await updateVendorPackage(session.accessToken, vendorPackage.id, {
        nameEn: vendorPackage.nameEn,
        nameBn: vendorPackage.nameBn ?? undefined,
        descriptionEn: undefined,
        descriptionBn: undefined,
        priceBdt: vendorPackage.priceBdt,
        isActive: !vendorPackage.isActive,
      });
      setDashboard((current) =>
        current
          ? {
              ...current,
              vendor: nextVendor,
            }
          : current,
      );
    }, copy.packageStatusUpdated);
  }

  function renderMemberSection() {
    if (!dashboard?.member || !session) {
      return null;
    }

    const member = dashboard.member;
    const currentMessages = selectedConversationId
      ? conversationMessages[selectedConversationId] ?? []
      : [];
    const primaryProject = member.weddingProjects[0] ?? null;

    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{copy.memberOverview}</Text>
        <ChoiceSwitch
          value={memberTab}
          onChange={setMemberTab}
          options={[
            { label: copy.overviewTab, value: "overview" },
            { label: copy.mailbox, value: "mailbox" },
            { label: copy.wedding, value: "wedding" },
            { label: copy.vendorsDirectory, value: "vendors" },
            { label: copy.profileTab, value: "profile" },
          ]}
        />

        {memberTab === "overview" ? (
          <>
            <Text style={styles.sectionHint}>
              {copy.profileStatus}:{" "}
              {translateStatus(member.dashboard.profile.status, locale, copy)} •{" "}
              {copy.approvalStatus}:{" "}
              {translateStatus(member.dashboard.profile.approvalStatus, locale, copy)}
            </Text>
            <View style={styles.metricGrid}>
              <DashboardCard
                title={copy.profileComplete}
                value={`${member.dashboard.profile.profileCompletionPct}%`}
              />
              <DashboardCard
                title={copy.profileVisits}
                value={member.dashboard.activity.profileVisits}
              />
              <DashboardCard
                title={copy.interests}
                value={member.dashboard.activity.receivedInterests}
              />
              <DashboardCard
                title={copy.photoRequests}
                value={member.dashboard.activity.pendingPhotoRequests}
              />
            </View>
            <Text style={styles.listTitle}>{copy.recentMatches}</Text>
            {member.discovery?.results.length ? (
              member.discovery.results.slice(0, 5).map((profile) => (
                <View key={profile.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>{profile.displayName}</Text>
                    <StatusPill
                      label={translateStatus(profile.gender, locale, copy)}
                      tone="warm"
                    />
                  </View>
                  <Text style={styles.listCardBody}>
                    {(profile.currentCity ?? copy.cityPending) +
                      (profile.currentCountryCode ? `, ${profile.currentCountryCode}` : "")}
                  </Text>
                  <Text style={styles.listCardBody}>
                    {[profile.religion, profile.profession].filter(Boolean).join(" • ") ||
                      copy.freeMember}
                  </Text>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => void handleStartChat(profile.id)}
                      style={styles.inlineAction}
                      disabled={actionKey === `chat:${profile.id}`}
                    >
                      <Text style={styles.inlineActionLabel}>{copy.startChat}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noMatches}</Text>
            )}
          </>
        ) : null}

        {memberTab === "mailbox" ? (
          <>
            <Text style={styles.listTitle}>{copy.conversations}</Text>
            {member.conversations.length ? (
              member.conversations.map((conversation) => (
                <Pressable
                  key={conversation.id}
                  onPress={() => void openConversation(conversation)}
                  style={[
                    styles.listCard,
                    selectedConversationId === conversation.id ? styles.listCardActive : null,
                  ]}
                >
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>
                      {conversation.counterpart?.memberProfile?.displayName ??
                        conversation.counterpart?.email ??
                        copy.mailbox}
                    </Text>
                    <Text style={styles.metaText}>
                      {formatDate(conversation.updatedAt, locale)}
                    </Text>
                  </View>
                  <Text style={styles.listCardBody}>
                    {conversation.lastMessage?.body ?? copy.noMessages}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noConversations}</Text>
            )}

            {selectedConversation ? (
              <>
                <Text style={styles.listTitle}>{copy.messages}</Text>
                {currentMessages.length ? (
                  currentMessages.map((message, index) => {
                    const [author, body] = message.split("::");
                    const isSelf = author === "ME";
                    return (
                      <View
                        key={`${selectedConversation.id}:${index}`}
                        style={[
                          styles.messageBubble,
                          isSelf ? styles.messageBubbleSelf : styles.messageBubbleOther,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            isSelf ? styles.messageTextSelf : null,
                          ]}
                        >
                          {body}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>{copy.noMessages}</Text>
                )}
                <AuthField
                  label={copy.typeMessage}
                  value={messageDraft}
                  onChangeText={setMessageDraft}
                  autoCapitalize="sentences"
                  multiline
                />
                <Pressable
                  onPress={() => void handleSendMessage()}
                  style={[
                    styles.primaryButton,
                    !messageDraft.trim() || actionKey === "send-message"
                      ? styles.buttonDisabled
                      : null,
                  ]}
                  disabled={!messageDraft.trim() || actionKey === "send-message"}
                >
                  <Text style={styles.primaryButtonLabel}>{copy.sendMessage}</Text>
                </Pressable>
              </>
            ) : null}
          </>
        ) : null}

        {memberTab === "wedding" ? (
          <>
            <Text style={styles.listTitle}>{copy.weddingProjects}</Text>
            <AuthField
              label={copy.projectTitle}
              value={projectTitle}
              onChangeText={setProjectTitle}
              autoCapitalize="words"
            />
            <Pressable
              onPress={() => void handleCreateProject()}
              style={[
                styles.primaryButton,
                !projectTitle.trim() || actionKey === "create-project"
                  ? styles.buttonDisabled
                  : null,
              ]}
              disabled={!projectTitle.trim() || actionKey === "create-project"}
            >
              <Text style={styles.primaryButtonLabel}>{copy.createProject}</Text>
            </Pressable>

            {member.weddingProjects.length ? (
              member.weddingProjects.map((project) => (
                <View key={project.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>{project.title}</Text>
                    <StatusPill
                      label={translateStatus(project.status, locale, copy)}
                      tone="accent"
                    />
                  </View>
                  <Text style={styles.listCardBody}>
                    {copy.weddingDateLabel}: {formatDate(project.weddingDate, locale)}
                  </Text>
                  <Text style={styles.listCardBody}>
                    {project.city ?? copy.cityPending}
                    {project.budgetBand ? ` • ${copy.budget}: ${project.budgetBand}` : ""}
                  </Text>
                  <View style={styles.metricGrid}>
                    <DashboardCard
                      title={copy.guestCount}
                      value={project.guestEntries.length}
                    />
                    <DashboardCard
                      title={copy.shortlistCount}
                      value={project.shortlists.length}
                    />
                  </View>
                  <AuthField
                    label={copy.guestName}
                    value={guestDrafts[project.id] ?? ""}
                    onChangeText={(value) =>
                      setGuestDrafts((current) => ({
                        ...current,
                        [project.id]: value,
                      }))
                    }
                    autoCapitalize="words"
                  />
                  <Pressable
                    onPress={() => void handleAddGuest(project)}
                    style={[
                      styles.secondaryButton,
                      !guestDrafts[project.id]?.trim() || actionKey === `guest:${project.id}`
                        ? styles.buttonDisabled
                        : null,
                    ]}
                    disabled={
                      !guestDrafts[project.id]?.trim() || actionKey === `guest:${project.id}`
                    }
                  >
                    <Text style={styles.secondaryButtonLabel}>{copy.addGuest}</Text>
                  </Pressable>

                  {project.shortlists.length ? (
                    <>
                      <Text style={styles.listTitle}>{copy.vendorShortlists}</Text>
                      {project.shortlists.map((shortlist) => (
                        <View key={shortlist.id} style={styles.innerCard}>
                          <Text style={styles.listCardTitle}>
                            {shortlist.vendorProfile.businessName}
                          </Text>
                          <Text style={styles.listCardBody}>
                            {shortlist.vendorProfile.categoryName ?? copy.vendorsDirectory}
                          </Text>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noProjects}</Text>
            )}

            {primaryProject ? (
              <Text style={styles.sectionHint}>
                {copy.shortlistVendor}: {primaryProject.title}
              </Text>
            ) : null}
          </>
        ) : null}

        {memberTab === "vendors" ? (
          <>
            <Text style={styles.listTitle}>{copy.vendorsDirectory}</Text>
            {member.vendors.length ? (
              member.vendors.slice(0, 8).map((vendor) => (
                <View key={vendor.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>{vendor.businessName}</Text>
                    <StatusPill
                      label={vendor.categoryName ?? copy.vendorsDirectory}
                      tone="warm"
                    />
                  </View>
                  <Text style={styles.listCardBody}>
                    {[vendor.area, vendor.district, vendor.division].filter(Boolean).join(", ") ||
                      copy.cityPending}
                  </Text>
                  <Text style={styles.listCardBody}>
                    {(locale === "bn" ? vendor.descriptionBn : vendor.descriptionEn) ??
                      vendor.descriptionEn ??
                      vendor.descriptionBn ??
                      copy.vendorsDirectory}
                  </Text>
                  <Text style={styles.metaText}>
                    {copy.packageCount}: {vendor.packages.length}
                  </Text>
                  {primaryProject ? (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => void handleShortlistVendor(vendor.id)}
                        style={styles.inlineAction}
                        disabled={actionKey === `shortlist:${vendor.id}`}
                      >
                        <Text style={styles.inlineActionLabel}>{copy.shortlistVendor}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noVendors}</Text>
            )}
          </>
        ) : null}

        {memberTab === "profile" ? (
          <>
            <Text style={styles.listTitle}>{copy.profileSettings}</Text>
            <Text style={styles.sectionHint}>{member.profile.user.email}</Text>
            <AuthField
              label={copy.firstName}
              value={member.profile.firstName}
              onChangeText={() => undefined}
              editable={false}
            />
            <AuthField
              label={copy.lastName}
              value={member.profile.lastName ?? ""}
              onChangeText={() => undefined}
              editable={false}
            />
            <AuthField
              label={copy.displayNameLabel}
              value={profileForm.displayName}
              onChangeText={(value) =>
                setProfileForm((current) => ({ ...current, displayName: value }))
              }
              autoCapitalize="words"
            />
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.locationLabel}
                  value={profileForm.currentCity}
                  onChangeText={(value) =>
                    setProfileForm((current) => ({ ...current, currentCity: value }))
                  }
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.countryCode}
                  value={profileForm.currentCountryCode}
                  onChangeText={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      currentCountryCode: value.toUpperCase(),
                    }))
                  }
                />
              </View>
            </View>
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.professionLabel}
                  value={profileForm.profession}
                  onChangeText={(value) =>
                    setProfileForm((current) => ({ ...current, profession: value }))
                  }
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.religionLabel}
                  value={profileForm.religion}
                  onChangeText={(value) =>
                    setProfileForm((current) => ({ ...current, religion: value }))
                  }
                  autoCapitalize="words"
                />
              </View>
            </View>
            <AuthField
              label={copy.guardianPhone}
              value={profileForm.guardianPhone}
              onChangeText={(value) =>
                setProfileForm((current) => ({ ...current, guardianPhone: value }))
              }
            />
            <AuthField
              label={copy.aboutMeLabel}
              value={profileForm.aboutMe}
              onChangeText={(value) =>
                setProfileForm((current) => ({ ...current, aboutMe: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <AuthField
              label={copy.familyDetailsLabel}
              value={profileForm.familyDetails}
              onChangeText={(value) =>
                setProfileForm((current) => ({ ...current, familyDetails: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{copy.publicProfile}</Text>
              <ChoiceSwitch
                value={profileForm.isProfilePublic}
                onChange={(value) =>
                  setProfileForm((current) => ({ ...current, isProfilePublic: value }))
                }
                options={[
                  { label: copy.publicMedia, value: "yes" },
                  { label: copy.privateMedia, value: "no" },
                ]}
              />
            </View>
            <Pressable
              onPress={() => void handleSaveProfile()}
              style={[
                styles.primaryButton,
                actionKey === "save-profile" ? styles.buttonDisabled : null,
              ]}
              disabled={actionKey === "save-profile"}
            >
              <Text style={styles.primaryButtonLabel}>{copy.saveProfile}</Text>
            </Pressable>

            <Text style={styles.listTitle}>{copy.partnerPreferences}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{copy.lookingFor}</Text>
              <ChoiceSwitch
                value={preferenceForm.gender}
                onChange={(value) =>
                  setPreferenceForm((current) => ({ ...current, gender: value }))
                }
                options={[
                  { label: copy.man, value: "MAN" },
                  { label: copy.woman, value: "WOMAN" },
                ]}
              />
            </View>
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <AuthField
                  label={`${copy.ageRange} Min`}
                  value={preferenceForm.ageMin}
                  onChangeText={(value) =>
                    setPreferenceForm((current) => ({ ...current, ageMin: value }))
                  }
                />
              </View>
              <View style={styles.flexField}>
                <AuthField
                  label={`${copy.ageRange} Max`}
                  value={preferenceForm.ageMax}
                  onChangeText={(value) =>
                    setPreferenceForm((current) => ({ ...current, ageMax: value }))
                  }
                />
              </View>
            </View>
            <AuthField
              label={copy.aboutPartnerLabel}
              value={preferenceForm.aboutPartner}
              onChangeText={(value) =>
                setPreferenceForm((current) => ({ ...current, aboutPartner: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <Pressable
              onPress={() => void handleSavePreferences()}
              style={[
                styles.secondaryButton,
                actionKey === "save-preferences" ? styles.buttonDisabled : null,
              ]}
              disabled={actionKey === "save-preferences"}
            >
              <Text style={styles.secondaryButtonLabel}>{copy.savePreferences}</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleSubmitReview()}
              style={[
                styles.secondaryButton,
                actionKey === "submit-review" ? styles.buttonDisabled : null,
              ]}
              disabled={actionKey === "submit-review"}
            >
              <Text style={styles.secondaryButtonLabel}>{copy.submitReview}</Text>
            </Pressable>

            <Text style={styles.listTitle}>{copy.mediaLibrary}</Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => void handleUploadPhoto("library")}
                style={[
                  styles.inlineAction,
                  actionKey === "upload-photo:library" ? styles.buttonDisabled : null,
                ]}
                disabled={actionKey === "upload-photo:library"}
              >
                <Text style={styles.inlineActionLabel}>{copy.photoFromPhone}</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleUploadPhoto("camera")}
                style={[
                  styles.inlineAction,
                  actionKey === "upload-photo:camera" ? styles.buttonDisabled : null,
                ]}
                disabled={actionKey === "upload-photo:camera"}
              >
                <Text style={styles.inlineActionLabel}>{copy.photoFromCamera}</Text>
              </Pressable>
            </View>
            {member.media.length ? (
              member.media.map((media) => (
                <View key={media.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>{media.mediaType}</Text>
                    <StatusPill
                      label={translateStatus(media.approvalStatus, locale, copy)}
                      tone="warm"
                    />
                  </View>
                  <Text style={styles.listCardBody}>
                    {translateStatus(media.privacyMode ?? "PUBLIC", locale, copy)}
                    {media.isPrimary ? ` • ${copy.makePrimary}` : ""}
                  </Text>
                  <Text style={styles.metaText}>{formatDate(media.createdAt, locale)}</Text>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => void handleMediaVisibility(media.id, "PUBLIC")}
                      style={styles.inlineAction}
                      disabled={actionKey === `media:${media.id}:PUBLIC`}
                    >
                      <Text style={styles.inlineActionLabel}>{copy.publicMedia}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleMediaVisibility(media.id, "PRIVATE")}
                      style={styles.inlineAction}
                      disabled={actionKey === `media:${media.id}:PRIVATE`}
                    >
                      <Text style={styles.inlineActionLabel}>{copy.privateMedia}</Text>
                    </Pressable>
                    {!media.isPrimary ? (
                      <Pressable
                        onPress={() => void handleMakePrimary(media.id)}
                        style={styles.inlineAction}
                        disabled={actionKey === `media-primary:${media.id}`}
                      >
                        <Text style={styles.inlineActionLabel}>{copy.makePrimary}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noMedia}</Text>
            )}

            <Text style={styles.listTitle}>{copy.photoRequestsLabel}</Text>
            {member.photoRequests.incoming.length || member.photoRequests.outgoing.length ? (
              <>
                <Text style={styles.metaText}>{copy.incoming}</Text>
                {member.photoRequests.incoming.length ? (
                  member.photoRequests.incoming.map((request) => (
                    <View key={request.id} style={styles.listCard}>
                      <View style={styles.listHeaderRow}>
                        <Text style={styles.listCardTitle}>
                          {request.requesterMemberProfile.displayName ??
                            request.requesterMemberProfile.firstName}
                        </Text>
                        <StatusPill
                          label={translateStatus(request.status, locale, copy)}
                          tone="accent"
                        />
                      </View>
                      <Text style={styles.metaText}>
                        {formatDate(request.createdAt, locale)}
                      </Text>
                      {request.status === "PENDING" ? (
                        <View style={styles.actionRow}>
                          <Pressable
                            onPress={() => void handlePhotoDecision(request.id, "approve")}
                            style={styles.inlineAction}
                            disabled={actionKey === `photo-request:${request.id}:approve`}
                          >
                            <Text style={styles.inlineActionLabel}>{copy.approve}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => void handlePhotoDecision(request.id, "deny")}
                            style={[styles.inlineAction, styles.inlineActionDanger]}
                            disabled={actionKey === `photo-request:${request.id}:deny`}
                          >
                            <Text
                              style={[
                                styles.inlineActionLabel,
                                styles.inlineActionLabelDanger,
                              ]}
                            >
                              {copy.reject}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>{copy.noPhotoRequests}</Text>
                )}
                <Text style={styles.metaText}>{copy.outgoing}</Text>
                {member.photoRequests.outgoing.length ? (
                  member.photoRequests.outgoing.map((request) => (
                    <View key={request.id} style={styles.listCard}>
                      <View style={styles.listHeaderRow}>
                        <Text style={styles.listCardTitle}>
                          {request.ownerMemberProfile.displayName ??
                            request.ownerMemberProfile.firstName}
                        </Text>
                        <StatusPill
                          label={translateStatus(request.status, locale, copy)}
                          tone="warm"
                        />
                      </View>
                      <Text style={styles.metaText}>
                        {formatDate(request.createdAt, locale)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>{copy.noPhotoRequests}</Text>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>{copy.noPhotoRequests}</Text>
            )}

            <Text style={styles.listTitle}>{copy.membershipPlans}</Text>
            {member.plans.map((plan) => (
              <View key={plan.id} style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCardTitle}>
                    {locale === "bn" ? plan.nameBn ?? plan.nameEn : plan.nameEn}
                  </Text>
                  <StatusPill
                    label={`${plan.durationDays}d`}
                    tone="accent"
                  />
                </View>
                <Text style={styles.listCardBody}>
                  {formatMoney(plan.bdtPrice, locale)} • {plan.contactLimit} contacts
                </Text>
                <Text style={styles.listCardBody}>
                  {plan.messageEnabled ? copy.messages : copy.freeMember} •{" "}
                  {plan.contactViewEnabled ? copy.open : copy.manualReview}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => void handleCreateMembership(plan.id, "AMARPAY")}
                    style={styles.inlineAction}
                    disabled={actionKey === `membership:${plan.id}:AMARPAY`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.buyWithAmarPay}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleCreateMembership(plan.id, "PAYPAL")}
                    style={styles.inlineAction}
                    disabled={actionKey === `membership:${plan.id}:PAYPAL`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.buyWithPaypal}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleCreateMembership(plan.id, "OFFICE")}
                    style={styles.inlineAction}
                    disabled={actionKey === `membership:${plan.id}:OFFICE`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.buyWithOffice}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleCreateMembership(plan.id, "MANUAL")}
                    style={styles.inlineAction}
                    disabled={actionKey === `membership:${plan.id}:MANUAL`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.buyWithManual}</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Text style={styles.listTitle}>{copy.orderHistory}</Text>
            {member.orders.length ? (
              member.orders.map((order) => (
                <View key={order.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>
                      {formatMoney(order.finalAmount, locale, order.currency)}
                    </Text>
                    <StatusPill
                      label={translateStatus(order.status, locale, copy)}
                      tone="warm"
                    />
                  </View>
                  <Text style={styles.listCardBody}>{order.gateway}</Text>
                  <Text style={styles.metaText}>
                    {copy.createdOn}: {formatDate(order.createdAt, locale)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noOrders}</Text>
            )}
          </>
        ) : null}
      </View>
    );
  }

  function renderAdminSection() {
    if (!dashboard?.admin) {
      return null;
    }

    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{copy.adminOverview}</Text>
        <ChoiceSwitch
          value={adminTab}
          onChange={setAdminTab}
          options={[
            { label: copy.overviewTab, value: "overview" },
            { label: copy.reviewQueue, value: "profiles" },
            { label: copy.manualPaymentsLabel, value: "payments" },
          ]}
        />

        {adminTab === "overview" ? (
          <View style={styles.metricGrid}>
            <DashboardCard
              title={copy.pendingProfiles}
              value={dashboard.admin.overview.profiles.pending}
            />
            <DashboardCard
              title={copy.manualReview}
              value={dashboard.admin.overview.payments.pendingManualReview}
            />
            <DashboardCard
              title={copy.collectedAmount}
              value={formatMoney(dashboard.admin.overview.payments.collectedAmount, locale)}
            />
          </View>
        ) : null}

        {adminTab === "profiles" ? (
          dashboard.admin.profileReviews.items.length ? (
            dashboard.admin.profileReviews.items.map((profile) => (
              <View key={profile.id} style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCardTitle}>{profile.displayName}</Text>
                  <StatusPill
                    label={translateStatus(profile.approvalStatus, locale, copy)}
                    tone="accent"
                  />
                </View>
                <Text style={styles.listCardBody}>{profile.user.email}</Text>
                <Text style={styles.listCardBody}>
                  {[profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ") ||
                    copy.cityPending}
                </Text>
                <Text style={styles.listCardBody}>
                  {copy.profileComplete}: {profile.profileCompletionPct}%
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => void handleApproveProfile(profile.id)}
                    style={styles.inlineAction}
                    disabled={actionKey === `approve-profile:${profile.id}`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.approve}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleRejectProfile(profile.id)}
                    style={[styles.inlineAction, styles.inlineActionDanger]}
                    disabled={actionKey === `reject-profile:${profile.id}`}
                  >
                    <Text style={[styles.inlineActionLabel, styles.inlineActionLabelDanger]}>
                      {copy.reject}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{copy.noReviews}</Text>
          )
        ) : null}

        {adminTab === "payments" ? (
          dashboard.admin.manualPayments.length ? (
            dashboard.admin.manualPayments.map((payment) => (
              <View key={payment.id} style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCardTitle}>
                    {formatMoney(payment.finalAmount, locale, payment.currency)}
                  </Text>
                  <StatusPill
                    label={translateStatus(payment.status, locale, copy)}
                    tone="warm"
                  />
                </View>
                <Text style={styles.listCardBody}>
                  {payment.user?.email ?? copy.manualPaymentsLabel}
                </Text>
                <Text style={styles.listCardBody}>
                  {payment.gateway} • {copy.createdOn}: {formatDate(payment.createdAt, locale)}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => void handleApprovePayment(payment.id)}
                    style={styles.inlineAction}
                    disabled={actionKey === `approve-payment:${payment.id}`}
                  >
                    <Text style={styles.inlineActionLabel}>{copy.approve}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleRejectPayment(payment.id)}
                    style={[styles.inlineAction, styles.inlineActionDanger]}
                    disabled={actionKey === `reject-payment:${payment.id}`}
                  >
                    <Text style={[styles.inlineActionLabel, styles.inlineActionLabelDanger]}>
                      {copy.reject}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{copy.noPayments}</Text>
          )
        ) : null}
      </View>
    );
  }

  function renderSuperAdminSection() {
    if (!dashboard?.superAdmin) {
      return null;
    }

    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{copy.superAdminOverview}</Text>
        <View style={styles.metricGrid}>
          <DashboardCard title={copy.members} value={dashboard.superAdmin.people.members} />
          <DashboardCard title={copy.vendors} value={dashboard.superAdmin.people.vendors} />
          <DashboardCard
            title={copy.plans}
            value={dashboard.superAdmin.catalog.membershipPlans}
          />
          <DashboardCard
            title={copy.revenue}
            value={formatMoney(dashboard.superAdmin.revenue.monthCollected, locale)}
          />
        </View>
      </View>
    );
  }

  function renderVendorSection() {
    if (!dashboard?.vendor) {
      return null;
    }

    const vendor: VendorDashboardResponse = dashboard.vendor;
    const filteredLeads =
      vendorLeadFilter === "ALL"
        ? vendor.recentLeads
        : vendor.recentLeads.filter((lead) => lead.status === vendorLeadFilter);

    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{copy.vendorOverview}</Text>
        <ChoiceSwitch
          value={vendorTab}
          onChange={setVendorTab}
          options={[
            { label: copy.overviewTab, value: "overview" },
            { label: copy.leadsTab, value: "leads" },
            { label: copy.packagesLabel, value: "packages" },
          ]}
        />

        {vendorTab === "overview" ? (
          <>
            <Text style={styles.sectionHint}>
              {copy.billingStatus}:{" "}
              {translateStatus(vendor.profile.billingStatus, locale, copy)}
            </Text>
            <View style={styles.metricGrid}>
              <DashboardCard
                title={copy.vendors}
                value={vendor.profile.categoryName ?? vendor.profile.businessName}
                detail={
                  [vendor.profile.district, vendor.profile.division]
                    .filter(Boolean)
                    .join(" • ") || copy.cityPending
                }
              />
              <DashboardCard title={copy.recentLeads} value={vendor.recentLeads.length} />
              <DashboardCard title={copy.packagesLabel} value={vendor.packages.length} />
            </View>
            <Text style={styles.listTitle}>{copy.vendorProfileLabel}</Text>
            <AuthField
              label={copy.vendorOverview}
              value={vendorProfileForm.businessName}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, businessName: value }))
              }
              autoCapitalize="words"
            />
            <AuthField
              label={copy.vendorsDirectory}
              value={vendorProfileForm.categoryName}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, categoryName: value }))
              }
              autoCapitalize="words"
            />
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.locationLabel}
                  value={vendorProfileForm.district}
                  onChangeText={(value) =>
                    setVendorProfileForm((current) => ({ ...current, district: value }))
                  }
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.countryCodeLabel}
                  value={vendorProfileForm.division}
                  onChangeText={(value) =>
                    setVendorProfileForm((current) => ({ ...current, division: value }))
                  }
                  autoCapitalize="words"
                />
              </View>
            </View>
            <AuthField
              label={copy.memberPhoneLabel}
              value={vendorProfileForm.phone}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, phone: value }))
              }
            />
            <AuthField
              label={copy.email}
              value={vendorProfileForm.email}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, email: value }))
              }
            />
            <AuthField
              label={copy.packageDescEn}
              value={vendorProfileForm.descriptionEn}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, descriptionEn: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <AuthField
              label={copy.packageDescBn}
              value={vendorProfileForm.descriptionBn}
              onChangeText={(value) =>
                setVendorProfileForm((current) => ({ ...current, descriptionBn: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <Pressable
              onPress={() => void handleSaveVendorProfile()}
              style={[
                styles.primaryButton,
                actionKey === "vendor-save-profile" ? styles.buttonDisabled : null,
              ]}
              disabled={actionKey === "vendor-save-profile"}
            >
              <Text style={styles.primaryButtonLabel}>{copy.saveVendorProfile}</Text>
            </Pressable>
          </>
        ) : null}

        {vendorTab === "leads" ? (
          <>
            <View style={styles.actionRow}>
              {(
                [
                  ["ALL", copy.allLabel],
                  ["NEW", copy.newLabel],
                  ["OPEN", copy.openStatus],
                  ["RESPONDED", copy.responded],
                  ["BOOKED", copy.booked],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() => setVendorLeadFilter(value)}
                  style={[
                    styles.inlineAction,
                    vendorLeadFilter === value ? styles.inlineActionSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.inlineActionLabel,
                      vendorLeadFilter === value ? styles.inlineActionLabelSelected : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filteredLeads.length ? (
              filteredLeads.map((lead) => (
              <View key={lead.id} style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCardTitle}>
                    {lead.requesterName ?? lead.requesterEmail ?? copy.vendorOverview}
                  </Text>
                  <StatusPill
                    label={translateStatus(lead.status, locale, copy)}
                    tone="warm"
                  />
                </View>
                <Text style={styles.listCardBody}>
                  {[lead.requesterEmail, lead.requesterPhone].filter(Boolean).join(" • ")}
                </Text>
                {lead.weddingProject?.title ? (
                  <Text style={styles.listCardBody}>{lead.weddingProject.title}</Text>
                ) : null}
                {lead.message ? <Text style={styles.listCardBody}>{lead.message}</Text> : null}
                <Text style={styles.metaText}>
                  {copy.leadSource}: {lead.source ?? "DIRECT"} • {formatDate(lead.createdAt, locale)}
                </Text>
                <View style={styles.actionRow}>
                  {getLeadActions(lead.status).map((status) => (
                    <Pressable
                      key={`${lead.id}:${status}`}
                      onPress={() => void handleVendorLeadStatus(lead.id, status)}
                      style={[
                        styles.inlineAction,
                        status === "CLOSED_REJECTED" ? styles.inlineActionDanger : null,
                      ]}
                      disabled={actionKey === `lead:${lead.id}:${status}`}
                    >
                      <Text
                        style={[
                          styles.inlineActionLabel,
                          status === "CLOSED_REJECTED"
                            ? styles.inlineActionLabelDanger
                            : null,
                        ]}
                      >
                        {translateStatus(status, locale, copy)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noLeads}</Text>
            )}
          </>
        ) : null}

        {vendorTab === "packages" ? (
          <>
            <AuthField
              label={copy.packageNameEn}
              value={vendorPackageForm.nameEn}
              onChangeText={(value) =>
                setVendorPackageForm((current) => ({ ...current, nameEn: value }))
              }
              autoCapitalize="words"
            />
            <AuthField
              label={copy.packageNameBn}
              value={vendorPackageForm.nameBn}
              onChangeText={(value) =>
                setVendorPackageForm((current) => ({ ...current, nameBn: value }))
              }
              autoCapitalize="words"
            />
            <AuthField
              label={copy.packageDescEn}
              value={vendorPackageForm.descriptionEn}
              onChangeText={(value) =>
                setVendorPackageForm((current) => ({ ...current, descriptionEn: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <AuthField
              label={copy.packageDescBn}
              value={vendorPackageForm.descriptionBn}
              onChangeText={(value) =>
                setVendorPackageForm((current) => ({ ...current, descriptionBn: value }))
              }
              autoCapitalize="sentences"
              multiline
            />
            <AuthField
              label={copy.packagePriceBdt}
              value={vendorPackageForm.priceBdt}
              onChangeText={(value) =>
                setVendorPackageForm((current) => ({ ...current, priceBdt: value }))
              }
            />
            <Pressable
              onPress={() => void handleCreateVendorPackage()}
              style={[
                styles.primaryButton,
                !vendorPackageForm.nameEn.trim() ||
                !vendorPackageForm.priceBdt.trim() ||
                actionKey === "vendor-create-package"
                  ? styles.buttonDisabled
                  : null,
              ]}
              disabled={
                !vendorPackageForm.nameEn.trim() ||
                !vendorPackageForm.priceBdt.trim() ||
                actionKey === "vendor-create-package"
              }
            >
              <Text style={styles.primaryButtonLabel}>
                {editingVendorPackageId ? copy.updatePackage : copy.createPackage}
              </Text>
            </Pressable>

            {vendor.packages.length ? (
              vendor.packages.map((pkg) => (
                <View key={pkg.id} style={styles.listCard}>
                  <View style={styles.listHeaderRow}>
                    <Text style={styles.listCardTitle}>
                      {locale === "bn" ? pkg.nameBn ?? pkg.nameEn : pkg.nameEn}
                    </Text>
                    <StatusPill
                      label={pkg.isActive ? copy.active : copy.inactive}
                      tone="accent"
                    />
                  </View>
                  <Text style={styles.listCardBody}>{formatMoney(pkg.priceBdt, locale)}</Text>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleEditVendorPackage(pkg)}
                      style={styles.inlineAction}
                    >
                      <Text style={styles.inlineActionLabel}>{copy.editPackage}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleToggleVendorPackage(pkg)}
                      style={[
                        styles.inlineAction,
                        actionKey === `vendor-package:${pkg.id}` ? styles.buttonDisabled : null,
                      ]}
                      disabled={actionKey === `vendor-package:${pkg.id}`}
                    >
                      <Text style={styles.inlineActionLabel}>
                        {pkg.isActive ? copy.inactive : copy.active}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{copy.noPackages}</Text>
            )}
          </>
        ) : null}
      </View>
    );
  }

  function renderGhotokManagedMember(
    member: GhotokManagedMember,
    activeMemberProfileId?: string | null,
  ) {
    const isActive = activeMemberProfileId === member.id;

    return (
      <View key={member.id} style={styles.listCard}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listCardTitle}>{member.displayName}</Text>
          <StatusPill label={translateStatus(member.status, locale, copy)} tone="accent" />
        </View>
        <Text style={styles.listCardBody}>
          {translateStatus(member.gender, locale, copy)} •{" "}
          {translateStatus(member.lookingFor, locale, copy)}
        </Text>
        <Text style={styles.metaText}>
          {copy.createdOn}: {formatDate(member.createdAt, locale)}
        </Text>
        <View style={styles.actionRow}>
          <Pressable
            onPress={() =>
              void (isActive
                ? handleEndImpersonation()
                : handleStartImpersonation(member.id))
            }
            style={[
              styles.inlineAction,
              isActive ? styles.inlineActionDanger : null,
            ]}
            disabled={
              actionKey === `ghotok-impersonate:${member.id}` ||
              actionKey === "ghotok-end-impersonation"
            }
          >
            <Text
              style={[
                styles.inlineActionLabel,
                isActive ? styles.inlineActionLabelDanger : null,
              ]}
            >
              {isActive ? copy.endImpersonation : copy.startImpersonation}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderGhotokSection() {
    if (!dashboard?.ghotok) {
      return null;
    }

    const ghotok = dashboard.ghotok;

    return (
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{copy.ghotokOverview}</Text>
        <ChoiceSwitch
          value={ghotokTab}
          onChange={setGhotokTab}
          options={[
            { label: copy.overviewTab, value: "overview" },
            { label: copy.managedList, value: "members" },
            { label: copy.ghotokDiscover, value: "discover" },
          ]}
        />

        {ghotokTab === "overview" ? (
          <>
            <View style={styles.metricGrid}>
              <DashboardCard
                title={copy.creditBalance}
                value={ghotok.dashboard.wallet.balance}
              />
              <DashboardCard
                title={copy.managedMembers}
                value={ghotok.managedMembers.length}
              />
            </View>
            {ghotok.activeImpersonation ? (
              <View style={styles.listCard}>
                <Text style={styles.listCardTitle}>{copy.activeImpersonation}</Text>
                <Text style={styles.listCardBody}>
                  {ghotok.activeImpersonation.memberProfile?.displayName ??
                    ghotok.activeImpersonation.memberProfile?.firstName ??
                    ghotok.activeImpersonation.memberProfileId}
                </Text>
                <Text style={styles.metaText}>
                  {formatDate(ghotok.activeImpersonation.startedAt, locale)}
                </Text>
                <Pressable
                  onPress={() => void handleEndImpersonation()}
                  style={[
                    styles.inlineAction,
                    styles.inlineActionDanger,
                    actionKey === "ghotok-end-impersonation" ? styles.buttonDisabled : null,
                  ]}
                  disabled={actionKey === "ghotok-end-impersonation"}
                >
                  <Text style={[styles.inlineActionLabel, styles.inlineActionLabelDanger]}>
                    {copy.endImpersonation}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.sectionHint}>{copy.noImpersonation}</Text>
            )}
          </>
        ) : null}

        {ghotokTab === "members" ? (
          <>
            <Text style={styles.listTitle}>{copy.ghotokCreateMember}</Text>
            <AuthField
              label={copy.firstName}
              value={ghotokMemberForm.firstName}
              onChangeText={(value) =>
                setGhotokMemberForm((current) => ({ ...current, firstName: value }))
              }
              autoCapitalize="words"
            />
            <AuthField
              label={copy.lastName}
              value={ghotokMemberForm.lastName}
              onChangeText={(value) =>
                setGhotokMemberForm((current) => ({ ...current, lastName: value }))
              }
              autoCapitalize="words"
            />
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <Text style={styles.fieldLabel}>{copy.gender}</Text>
                <ChoiceSwitch
                  value={ghotokMemberForm.gender}
                  onChange={(value) =>
                    setGhotokMemberForm((current) => ({ ...current, gender: value }))
                  }
                  options={[
                    { label: copy.man, value: "MAN" },
                    { label: copy.woman, value: "WOMAN" },
                  ]}
                />
              </View>
              <View style={styles.flexField}>
                <Text style={styles.fieldLabel}>{copy.lookingFor}</Text>
                <ChoiceSwitch
                  value={ghotokMemberForm.lookingFor}
                  onChange={(value) =>
                    setGhotokMemberForm((current) => ({ ...current, lookingFor: value }))
                  }
                  options={[
                    { label: copy.man, value: "MAN" },
                    { label: copy.woman, value: "WOMAN" },
                  ]}
                />
              </View>
            </View>
            <AuthField
              label={copy.memberEmailLabel}
              value={ghotokMemberForm.memberEmail}
              onChangeText={(value) =>
                setGhotokMemberForm((current) => ({ ...current, memberEmail: value }))
              }
            />
            <View style={styles.inlineRow}>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.memberPhoneLabel}
                  value={ghotokMemberForm.memberPhone}
                  onChangeText={(value) =>
                    setGhotokMemberForm((current) => ({ ...current, memberPhone: value }))
                  }
                />
              </View>
              <View style={styles.flexField}>
                <AuthField
                  label={copy.countryCodeLabel}
                  value={ghotokMemberForm.currentCountryCode}
                  onChangeText={(value) =>
                    setGhotokMemberForm((current) => ({
                      ...current,
                      currentCountryCode: value.toUpperCase(),
                    }))
                  }
                />
              </View>
            </View>
            <Pressable
              onPress={() => void handleCreateManagedMember()}
              style={[
                styles.primaryButton,
                !ghotokMemberForm.firstName.trim() || actionKey === "ghotok-create-member"
                  ? styles.buttonDisabled
                  : null,
              ]}
              disabled={
                !ghotokMemberForm.firstName.trim() ||
                actionKey === "ghotok-create-member"
              }
            >
              <Text style={styles.primaryButtonLabel}>{copy.ghotokCreateMember}</Text>
            </Pressable>

            {ghotok.managedMembers.length ? (
              ghotok.managedMembers.map((member) =>
                renderGhotokManagedMember(
                  member,
                  ghotok.activeImpersonation?.memberProfileId ?? null,
                ),
              )
            ) : (
              <Text style={styles.emptyText}>{copy.noManagedMembers}</Text>
            )}
          </>
        ) : null}

        {ghotokTab === "discover" ? (
          <>
            {ghotok.activeImpersonation ? (
              <Text style={styles.sectionHint}>
                {copy.activeImpersonation}:{" "}
                {ghotok.activeImpersonation.memberProfile?.displayName ??
                  ghotok.activeImpersonation.memberProfile?.firstName ??
                  ghotok.activeImpersonation.memberProfileId}
              </Text>
            ) : (
              <Text style={styles.sectionHint}>{copy.activeImpersonationNeeded}</Text>
            )}

            {ghotok.publicProfiles.results.length ? (
              ghotok.publicProfiles.results.map((profile) => {
                const unlockedContact = ghotokUnlockedContacts[profile.id];

                return (
                  <View key={profile.id} style={styles.listCard}>
                    <View style={styles.listHeaderRow}>
                      <Text style={styles.listCardTitle}>{profile.publicName}</Text>
                      <StatusPill
                        label={translateStatus(profile.gender, locale, copy)}
                        tone="warm"
                      />
                    </View>
                    <Text style={styles.listCardBody}>
                      {[profile.currentCity, profile.currentCountryCode]
                        .filter(Boolean)
                        .join(", ") || copy.cityPending}
                    </Text>
                    <Text style={styles.listCardBody}>
                      {[profile.religion, profile.profession].filter(Boolean).join(" • ") ||
                        copy.freeMember}
                    </Text>
                    <Text style={styles.metaText}>
                      {profile.publicHeadline}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => void handleGhotokContactView(profile.id)}
                        style={styles.inlineAction}
                        disabled={actionKey === `ghotok-contact:${profile.id}`}
                      >
                        <Text style={styles.inlineActionLabel}>{copy.viewContact}</Text>
                      </Pressable>
                    </View>
                    {unlockedContact ? (
                      <View style={styles.innerCard}>
                        <Text style={styles.listCardBody}>
                          {copy.guardianPhoneLabel}:{" "}
                          {unlockedContact.guardianPhone ?? "—"}
                        </Text>
                        <Text style={styles.listCardBody}>
                          {copy.guardianEmailLabel}:{" "}
                          {unlockedContact.guardianEmail ?? "—"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>{copy.noPublicProfiles}</Text>
            )}
          </>
        ) : null}
      </View>
    );
  }

  if (isBooting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#8d4f39" />
          <Text style={styles.stateText}>{copy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{copy.welcomeEyebrow}</Text>
          <Text style={styles.heroTitle}>{copy.appName}</Text>
          <Text style={styles.heroSubtitle}>{copy.appSubtitle}</Text>
          <Text style={styles.heroBody}>{copy.welcomeBody}</Text>
          <LocaleSwitch locale={locale} onChange={setLocale} />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{copy.errorTitle}</Text>
            <Text style={styles.errorBody}>{error}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>{copy.liveApiNote}</Text>
            <Text style={styles.noticeBody}>{notice}</Text>
          </View>
        ) : null}

        {!session || !dashboard ? (
          <View style={styles.panel}>
            <View style={styles.inlineRow}>
              <Pressable
                onPress={() => setMode("login")}
                style={[styles.tabButton, mode === "login" ? styles.tabButtonActive : null]}
              >
                <Text
                  style={[styles.tabLabel, mode === "login" ? styles.tabLabelActive : null]}
                >
                  {copy.login}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("signup")}
                style={[styles.tabButton, mode === "signup" ? styles.tabButtonActive : null]}
              >
                <Text
                  style={[styles.tabLabel, mode === "signup" ? styles.tabLabelActive : null]}
                >
                  {copy.signup}
                </Text>
              </Pressable>
            </View>

            {mode === "login" ? (
              <>
                <Text style={styles.sectionTitle}>{copy.login}</Text>
                <Text style={styles.sectionHint}>{copy.loginHint}</Text>
                <AuthField
                  label={copy.email}
                  value={loginForm.email}
                  onChangeText={(value) =>
                    setLoginForm((current) => ({ ...current, email: value }))
                  }
                />
                <AuthField
                  label={copy.password}
                  value={loginForm.password}
                  secureTextEntry
                  onChangeText={(value) =>
                    setLoginForm((current) => ({ ...current, password: value }))
                  }
                />
                <Pressable
                  onPress={() => void handleLogin()}
                  style={[styles.primaryButton, isBusy ? styles.buttonDisabled : null]}
                  disabled={isBusy}
                >
                  <Text style={styles.primaryButtonLabel}>
                    {isBusy ? copy.loggingIn : copy.login}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{copy.signup}</Text>
                <Text style={styles.sectionHint}>{copy.signupHint}</Text>
                <AuthField
                  label={copy.firstName}
                  value={signupForm.firstName}
                  autoCapitalize="words"
                  onChangeText={(value) =>
                    setSignupForm((current) => ({ ...current, firstName: value }))
                  }
                />
                <AuthField
                  label={copy.lastName}
                  value={signupForm.lastName}
                  autoCapitalize="words"
                  onChangeText={(value) =>
                    setSignupForm((current) => ({ ...current, lastName: value }))
                  }
                />
                <AuthField
                  label={copy.email}
                  value={signupForm.email}
                  onChangeText={(value) =>
                    setSignupForm((current) => ({ ...current, email: value }))
                  }
                />
                <AuthField
                  label={copy.password}
                  value={signupForm.password}
                  secureTextEntry
                  onChangeText={(value) =>
                    setSignupForm((current) => ({ ...current, password: value }))
                  }
                />
                <View style={styles.inlineRow}>
                  <View style={styles.flexField}>
                    <Text style={styles.fieldLabel}>{copy.gender}</Text>
                    <ChoiceSwitch
                      value={signupForm.gender}
                      onChange={(value) =>
                        setSignupForm((current) => ({ ...current, gender: value }))
                      }
                      options={[
                        { label: copy.man, value: "MAN" },
                        { label: copy.woman, value: "WOMAN" },
                      ]}
                    />
                  </View>
                  <View style={styles.flexField}>
                    <Text style={styles.fieldLabel}>{copy.lookingFor}</Text>
                    <ChoiceSwitch
                      value={signupForm.lookingFor}
                      onChange={(value) =>
                        setSignupForm((current) => ({ ...current, lookingFor: value }))
                      }
                      options={[
                        { label: copy.man, value: "MAN" },
                        { label: copy.woman, value: "WOMAN" },
                      ]}
                    />
                  </View>
                </View>
                <Pressable
                  onPress={() => void handleSignup()}
                  style={[styles.primaryButton, isBusy ? styles.buttonDisabled : null]}
                  disabled={isBusy}
                >
                  <Text style={styles.primaryButtonLabel}>
                    {isBusy ? copy.signingUp : copy.signup}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.eyebrow}>{copy.roleDashboard}</Text>
              <Text style={styles.sectionTitle}>{session.user.email}</Text>
              <Text style={styles.sectionHint}>{session.user.roles.join(" • ")}</Text>
              <View style={styles.inlineRow}>
                <Pressable
                  onPress={() => void refreshDashboard()}
                  style={[styles.secondaryButton, isBusy ? styles.buttonDisabled : null]}
                  disabled={isBusy}
                >
                  <Text style={styles.secondaryButtonLabel}>{copy.reload}</Text>
                </Pressable>
                <Pressable onPress={() => void handleSignOut()} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonLabel}>{copy.signout}</Text>
                </Pressable>
              </View>
            </View>

            {renderMemberSection()}
            {renderAdminSection()}
            {renderSuperAdminSection()}
            {renderVendorSection()}
            {renderGhotokSection()}

            <View style={styles.panel}>
              <Text style={styles.eyebrow}>{copy.liveApiNote}</Text>
              <Text style={styles.sectionHint}>{copy.mobileNext}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e8",
  },
  page: {
    padding: 20,
    gap: 18,
  },
  hero: {
    backgroundColor: "#fff9f0",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ead9c8",
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#8d4f39",
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 32,
    color: "#2f241f",
    fontWeight: "800",
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#5f4438",
    fontWeight: "600",
  },
  heroBody: {
    fontSize: 15,
    color: "#6f584d",
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ead9c8",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 24,
    color: "#2f241f",
    fontWeight: "800",
  },
  sectionHint: {
    fontSize: 14,
    color: "#785f53",
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  flexField: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#704a3a",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8c1b4",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2f241f",
  },
  inputReadonly: {
    backgroundColor: "#f5ede5",
    color: "#6f584d",
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f2e2d1",
    borderRadius: 16,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#8d4f39",
  },
  segmentLabel: {
    color: "#6b4b3e",
    fontWeight: "700",
    fontSize: 12,
  },
  segmentLabelActive: {
    color: "#fffaf6",
  },
  inlineRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#f2e2d1",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#8d4f39",
  },
  tabLabel: {
    color: "#6b4b3e",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#fffaf6",
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: "#8d4f39",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: "#fffaf6",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#f2e2d1",
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonLabel: {
    color: "#6b4b3e",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  errorBox: {
    borderRadius: 18,
    backgroundColor: "#fff0ec",
    borderWidth: 1,
    borderColor: "#e6b9ac",
    padding: 16,
    gap: 6,
  },
  errorTitle: {
    color: "#9d3d28",
    fontWeight: "800",
    fontSize: 15,
  },
  errorBody: {
    color: "#8b5143",
    lineHeight: 20,
  },
  noticeBox: {
    borderRadius: 18,
    backgroundColor: "#eef8f2",
    borderWidth: 1,
    borderColor: "#bfd9c8",
    padding: 16,
    gap: 6,
  },
  noticeTitle: {
    color: "#2e6b4e",
    fontWeight: "800",
    fontSize: 15,
  },
  noticeBody: {
    color: "#45685a",
    lineHeight: 20,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 24,
  },
  stateText: {
    fontSize: 16,
    color: "#6b4b3e",
    textAlign: "center",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    borderRadius: 18,
    backgroundColor: "#fff8f2",
    borderWidth: 1,
    borderColor: "#ecdacc",
    padding: 14,
    gap: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2f241f",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7a5b50",
  },
  metricDetail: {
    fontSize: 12,
    color: "#896a5f",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3d302a",
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ecdacc",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  listCardActive: {
    borderColor: "#8d4f39",
    backgroundColor: "#fff5ee",
  },
  innerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0dfd0",
    padding: 12,
    backgroundColor: "#fffdf9",
    gap: 4,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2f241f",
    flex: 1,
  },
  listCardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#7a6155",
  },
  metaText: {
    color: "#8a6a5d",
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: "#7a6155",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inlineAction: {
    borderRadius: 999,
    backgroundColor: "#f2e2d1",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inlineActionSelected: {
    backgroundColor: "#8d4f39",
  },
  inlineActionDanger: {
    backgroundColor: "#fde4de",
  },
  inlineActionLabel: {
    color: "#6b4b3e",
    fontWeight: "700",
    fontSize: 13,
  },
  inlineActionLabelSelected: {
    color: "#fffaf6",
  },
  inlineActionLabelDanger: {
    color: "#a3442c",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#f2e2d1",
  },
  statusPillWarm: {
    backgroundColor: "#f9ead6",
  },
  statusPillAccent: {
    backgroundColor: "#eee3d5",
  },
  statusPillText: {
    color: "#704a3a",
    fontSize: 11,
    fontWeight: "700",
  },
  statusPillTextWarm: {
    color: "#8a5c2f",
  },
  statusPillTextAccent: {
    color: "#5b4b40",
  },
  messageBubble: {
    maxWidth: "86%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageBubbleSelf: {
    alignSelf: "flex-end",
    backgroundColor: "#8d4f39",
  },
  messageBubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#f4e5d7",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b392f",
  },
  messageTextSelf: {
    color: "#fffaf6",
  },
});
