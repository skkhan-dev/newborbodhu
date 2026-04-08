import {
  ApprovalStatus,
  ConversationType,
  GenderKey,
  GhotokLinkStatus,
  GhotokStatus,
  LocaleKey,
  MediaApprovalStatus,
  MediaPrivacyMode,
  MediaType,
  PaymentForType,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ProfileOwnerType,
  ProfileStatus,
  RoleKey,
  UserStatus,
  VendorStatus,
} from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import { iterateMysqlBatchTsvRows, type RowRecord } from "./legacy-tsv";

type StepSummary = {
  processed: number;
  imported: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type LoadReport = {
  generatedAt: string;
  sourceDir: string;
  outputPath: string;
  steps: Record<string, StepSummary>;
};

type PasswordState = {
  passwordHash?: string;
  legacyHash?: string;
  legacyHashType?: string;
  loginReady: boolean;
};

type MemberRef = {
  userId: string;
  memberProfileId: string;
  email: string;
};

type GhotokRef = {
  userId: string;
  ghotokProfileId: string;
};

type VendorRef = {
  vendorProfileId: string;
};

type AdminRef = {
  userId: string;
  adminUserId: string;
};

const prisma = new PrismaClient();

function createStepSummary(): StepSummary {
  return {
    processed: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    warnings: [],
  };
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pickValue(row: RowRecord, candidates: string[]) {
  for (const candidate of candidates) {
    const exact = row[candidate];

    if (exact !== undefined && exact !== null && String(exact).trim().length > 0) {
      return String(exact).trim();
    }

    const matchedKey = Object.keys(row).find(
      (key) => key.toLowerCase() === candidate.toLowerCase(),
    );

    if (
      matchedKey &&
      row[matchedKey] !== undefined &&
      row[matchedKey] !== null &&
      String(row[matchedKey]).trim().length > 0
    ) {
      return String(row[matchedKey]).trim();
    }
  }

  return null;
}

function parseInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBigIntValue(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function parseDecimal(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "y", "public", "active"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "private", "inactive"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  if (/^\d{10}$/.test(value)) {
    const asNumber = Number(value);
    const date = new Date(asNumber * 1000);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  if (/^\d{13}$/.test(value)) {
    const asNumber = Number(value);
    const date = new Date(asNumber);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  if (/^0{4}-0{2}-0{2}/.test(value) || value === "0000-00-00") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function normalizeLegacyStoragePath(value: string | null, defaultFolder: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\\/g, "/").replace(/^\.?\//, "");

  if (!trimmed.length) {
    return null;
  }

  const normalizedFolder = defaultFolder.replace(/^\/+|\/+$/g, "");

  if (trimmed.startsWith("legacy/")) {
    return trimmed;
  }

  if (trimmed.includes("/")) {
    return `legacy/${trimmed.replace(/^\/+/, "")}`;
  }

  return `legacy/${normalizedFolder}/${trimmed}`;
}

function inferMimeTypeFromPath(value: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".gif")) {
    return "image/gif";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }

  return undefined;
}

function splitMultiValue(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,|/]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toJsonArray(values: string[]) {
  return values.length ? (values as Prisma.InputJsonValue) : undefined;
}

function normalizeGender(value: string | null): GenderKey | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["m", "male", "man", "groom"].includes(normalized)) {
    return GenderKey.MAN;
  }

  if (["f", "female", "woman", "bride"].includes(normalized)) {
    return GenderKey.WOMAN;
  }

  return undefined;
}

function normalizeProfileStatus(value: string | null) {
  if (!value) {
    return ProfileStatus.DRAFT;
  }

  const normalized = value.trim().toLowerCase();

  if (["active", "1", "approved"].includes(normalized)) {
    return ProfileStatus.ACTIVE;
  }

  if (["approval", "pending", "incomplete"].includes(normalized)) {
    return ProfileStatus.PENDING_REVIEW;
  }

  if (["cancel", "cancelled"].includes(normalized)) {
    return ProfileStatus.CANCELLED;
  }

  if (["delete", "deleted"].includes(normalized)) {
    return ProfileStatus.DELETED;
  }

  if (["reject", "rejected"].includes(normalized)) {
    return ProfileStatus.REJECTED;
  }

  return ProfileStatus.DRAFT;
}

function approvalFromProfileStatus(status: ProfileStatus) {
  if (status === ProfileStatus.ACTIVE) {
    return ApprovalStatus.APPROVED;
  }

  if (status === ProfileStatus.REJECTED || status === ProfileStatus.DELETED) {
    return ApprovalStatus.REJECTED;
  }

  return ApprovalStatus.PENDING;
}

function userStatusFromProfileStatus(status: ProfileStatus, passwordState: PasswordState) {
  if (status === ProfileStatus.DELETED) {
    return UserStatus.DELETED;
  }

  if (status === ProfileStatus.CANCELLED || status === ProfileStatus.REJECTED) {
    return UserStatus.SUSPENDED;
  }

  if (passwordState.loginReady) {
    return status === ProfileStatus.ACTIVE ? UserStatus.ACTIVE : UserStatus.PENDING;
  }

  return status === ProfileStatus.ACTIVE ? UserStatus.RESET_REQUIRED : UserStatus.PENDING;
}

function normalizeLocale(value: string | null) {
  if (!value) {
    return LocaleKey.EN;
  }

  const normalized = value.trim().toLowerCase();

  if (["bn", "bangla", "bengali"].includes(normalized)) {
    return LocaleKey.BN;
  }

  return LocaleKey.EN;
}

function normalizeMediaPrivacy(value: string | null) {
  if (!value) {
    return MediaPrivacyMode.PUBLIC;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "private", "restricted", "hidden"].includes(normalized)) {
    return MediaPrivacyMode.PRIVATE;
  }

  if (["blur", "blurred", "public_blur"].includes(normalized)) {
    return MediaPrivacyMode.BLURRED_PUBLIC;
  }

  return MediaPrivacyMode.PUBLIC;
}

function normalizeMediaApproval(value: string | null) {
  if (!value) {
    return MediaApprovalStatus.APPROVED;
  }

  const normalized = value.trim().toLowerCase();

  if (["pending", "approval", "0"].includes(normalized)) {
    return MediaApprovalStatus.PENDING;
  }

  if (["reject", "rejected", "blocked"].includes(normalized)) {
    return MediaApprovalStatus.REJECTED;
  }

  return MediaApprovalStatus.APPROVED;
}

function normalizeVendorStatus(value: string | null) {
  if (!value) {
    return VendorStatus.PENDING_REVIEW;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "active", "approved"].includes(normalized)) {
    return VendorStatus.ACTIVE;
  }

  if (["reject", "rejected"].includes(normalized)) {
    return VendorStatus.REJECTED;
  }

  if (["inactive", "disabled"].includes(normalized)) {
    return VendorStatus.INACTIVE;
  }

  return VendorStatus.PENDING_REVIEW;
}

function normalizeGhotokStatus(value: string | null) {
  if (!value) {
    return GhotokStatus.PENDING_REVIEW;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "active", "approved"].includes(normalized)) {
    return GhotokStatus.ACTIVE;
  }

  if (["inactive", "disabled"].includes(normalized)) {
    return GhotokStatus.INACTIVE;
  }

  if (["suspended", "blocked"].includes(normalized)) {
    return GhotokStatus.SUSPENDED;
  }

  return GhotokStatus.PENDING_REVIEW;
}

function normalizePaymentGateway(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("paypal")) {
    return PaymentGateway.PAYPAL;
  }

  if (normalized.includes("office")) {
    return PaymentGateway.OFFICE;
  }

  if (
    normalized.includes("amar") ||
    normalized.includes("ssl") ||
    normalized.includes("card")
  ) {
    return PaymentGateway.AMARPAY;
  }

  if (
    normalized.includes("manual") ||
    normalized.includes("bkash") ||
    normalized.includes("bikash") ||
    normalized.includes("nagad") ||
    normalized.includes("cash")
  ) {
    return PaymentGateway.MANUAL;
  }

  return PaymentGateway.MANUAL;
}

function normalizePaymentStatus(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (["paid", "success", "successful", "approved", "complete", "completed"].includes(normalized)) {
    return PaymentStatus.PAID;
  }

  if (["failed", "declined", "error"].includes(normalized)) {
    return PaymentStatus.FAILED;
  }

  if (["refund", "refunded"].includes(normalized)) {
    return PaymentStatus.REFUNDED;
  }

  if (["manual_review", "review"].includes(normalized)) {
    return PaymentStatus.MANUAL_REVIEW;
  }

  if (["manual_approved"].includes(normalized)) {
    return PaymentStatus.MANUAL_APPROVED;
  }

  if (["manual_rejected"].includes(normalized)) {
    return PaymentStatus.MANUAL_REJECTED;
  }

  if (["expired"].includes(normalized)) {
    return PaymentStatus.EXPIRED;
  }

  return PaymentStatus.PENDING;
}

function detectPasswordState(rawValue: string | null): PasswordState {
  if (!rawValue) {
    return {
      loginReady: false,
    };
  }

  const trimmed = rawValue.trim();

  if (trimmed.startsWith("scrypt:")) {
    return {
      passwordHash: trimmed,
      loginReady: true,
    };
  }

  if (/^[a-f0-9]{32}$/i.test(trimmed)) {
    return {
      legacyHash: trimmed.toLowerCase(),
      legacyHashType: "MD5",
      loginReady: true,
    };
  }

  return {
    legacyHash: trimmed,
    legacyHashType: "UNKNOWN",
    loginReady: false,
  };
}

function normalizeEmail(value: string | null, fallbackPrefix: string, legacyId: number | null) {
  if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase())) {
    return value.trim().toLowerCase();
  }

  return `${fallbackPrefix}-${legacyId ?? Date.now()}@import.borbodhu.local`;
}

function calculateProfileCompletion(fields: Array<string | Date | number | null | undefined>) {
  const present = fields.filter((value) => {
    if (value instanceof Date) {
      return true;
    }

    if (typeof value === "number") {
      return true;
    }

    return Boolean(value);
  }).length;

  return Math.round((present / fields.length) * 100);
}

function note(step: StepSummary, message: string) {
  if (step.warnings.length < 25) {
    step.warnings.push(message);
  }
}

async function ensureUserRole(userId: string, role: RoleKey) {
  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
    update: {},
    create: {
      userId,
      role,
    },
  });
}

async function findUniqueUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      legacyId: true,
      passwordHash: true,
      legacyHash: true,
      legacyHashType: true,
      preferredLocale: true,
      status: true,
      memberProfile: { select: { id: true } },
    },
  });
}

async function ensureIdentityUser(input: {
  step: StepSummary;
  legacyUserId?: number | null;
  email: string;
  preferredLocale: LocaleKey;
  status: UserStatus;
  passwordState: PasswordState;
}) {
  const { step, legacyUserId, email, preferredLocale, status, passwordState } = input;
  let user =
    legacyUserId !== undefined && legacyUserId !== null
      ? await prisma.user.findUnique({
          where: { legacyId: legacyUserId },
          select: {
            id: true,
            email: true,
            legacyId: true,
            passwordHash: true,
            legacyHash: true,
            legacyHashType: true,
            preferredLocale: true,
            status: true,
            memberProfile: { select: { id: true } },
          },
        })
      : null;

  let mergedByEmail = false;

  if (!user) {
    user = await findUniqueUserByEmail(email);

    if (user) {
      mergedByEmail = true;
    }
  }

  const updateData: Prisma.UserUpdateInput = {
    preferredLocale,
    status,
  };

  if (user) {
    if (user.email.endsWith("@import.borbodhu.local") && !email.endsWith("@import.borbodhu.local")) {
      updateData.email = email;
    }

    if (legacyUserId !== undefined && legacyUserId !== null) {
      if (!user.legacyId) {
        updateData.legacyId = legacyUserId;
      } else if (user.legacyId !== legacyUserId) {
        note(
          step,
          `Email merge kept existing user ${user.email} with legacyId ${user.legacyId} instead of ${legacyUserId}.`,
        );
      }
    }

    if (!user.passwordHash && passwordState.passwordHash) {
      updateData.passwordHash = passwordState.passwordHash;
    }

    if (!user.legacyHash && passwordState.legacyHash) {
      updateData.legacyHash = passwordState.legacyHash;
      updateData.legacyHashType = passwordState.legacyHashType;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
      },
    });

    return {
      userId: updated.id,
      email: updated.email,
      created: false,
      mergedByEmail,
    };
  }

  const created = await prisma.user.create({
    data: {
      legacyId: legacyUserId ?? undefined,
      email,
      preferredLocale,
      status,
      passwordHash: passwordState.passwordHash,
      legacyHash: passwordState.legacyHash,
      legacyHashType: passwordState.legacyHashType,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return {
    userId: created.id,
    email: created.email,
    created: true,
    mergedByEmail: false,
  };
}

async function main() {
  const sourceDirArg = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!sourceDirArg) {
    throw new Error("Usage: tsx src/migration/legacy-load.ts <sourceDir> [outputPath]");
  }

  const sourceDir = path.resolve(sourceDirArg);
  const outputPath = outputPathArg
    ? path.resolve(outputPathArg)
    : path.join(sourceDir, "legacy-load-report.json");

  const report: LoadReport = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    outputPath,
    steps: {},
  };

  const memberRefs = new Map<number, MemberRef>();
  const ghotokRefs = new Map<number, GhotokRef>();
  const vendorRefs = new Map<number, VendorRef>();
  const adminRefs = new Map<number, AdminRef>();
  const planRefs = new Map<number, string>();
  const conversationRefs = new Map<string, string>();

  async function runStep(stepName: string, handler: (step: StepSummary) => Promise<void>) {
    const step = createStepSummary();
    report.steps[stepName] = step;
    await handler(step);
  }

  async function loadMembershipPlans(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_membership.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_membership.tsv was not found. Existing plans were left untouched.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;

      const legacyId = parseInteger(pickValue(row, ["id", "membership_id"]));
      const baseName =
        pickValue(row, ["name", "membership_name", "title"]) ??
        `Legacy Plan ${legacyId ?? step.processed}`;
      const code = slugify(baseName) || `legacy-plan-${legacyId ?? step.processed}`;
      const durationDays =
        parseInteger(pickValue(row, ["days", "duration", "duration_days", "expire_days"])) ??
        30;
      const bdtPrice =
        parseDecimal(pickValue(row, ["price", "bdt_price", "amount", "fee"])) ?? 0;
      const usdPrice =
        parseDecimal(pickValue(row, ["usd_price", "price_usd"])) ??
        Number((bdtPrice / 120).toFixed(2));
      const contactLimit =
        parseInteger(pickValue(row, ["contact_limit", "contacts", "num_contacts"])) ?? 0;

      const existing = await prisma.membershipPlan.findFirst({
        where: {
          OR: [
            legacyId
              ? {
                  legacyId,
                }
              : undefined,
            {
              code,
            },
          ].filter(Boolean) as Prisma.MembershipPlanWhereInput[],
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.membershipPlan.update({
          where: { id: existing.id },
          data: {
            legacyId: legacyId ?? undefined,
            code,
            nameEn: baseName,
            nameBn: pickValue(row, ["name_bn", "bangla_name"]) ?? undefined,
            durationDays,
            bdtPrice,
            usdPrice,
            contactLimit,
            messageEnabled: contactLimit > 0,
            contactViewEnabled: contactLimit > 0,
            isActive: parseBoolean(pickValue(row, ["active", "status"])) ?? true,
          },
        });
        step.updated += 1;
        if (legacyId) {
          planRefs.set(legacyId, existing.id);
        }
        continue;
      }

      const created = await prisma.membershipPlan.create({
        data: {
          legacyId: legacyId ?? undefined,
          code,
          nameEn: baseName,
          nameBn: pickValue(row, ["name_bn", "bangla_name"]) ?? undefined,
          durationDays,
          bdtPrice,
          usdPrice,
          contactLimit,
          messageEnabled: contactLimit > 0,
          contactViewEnabled: contactLimit > 0,
          isActive: parseBoolean(pickValue(row, ["active", "status"])) ?? true,
        },
        select: {
          id: true,
        },
      });

      step.imported += 1;
      if (legacyId) {
        planRefs.set(legacyId, created.id);
      }
    }
  }

  async function loadMembers(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_user.tsv");

    if (!(await fileExists(filePath))) {
      throw new Error("tbl_user.tsv is required for legacy load.");
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "user_id"]));

      if (!legacyId) {
        step.skipped += 1;
        note(step, "Skipped member row without a legacy user id.");
        continue;
      }

      const rawPassword = pickValue(row, ["password", "pass", "passwd"]);
      const passwordState = detectPasswordState(rawPassword);
      const profileStatus = normalizeProfileStatus(
        pickValue(row, ["status", "active", "profile_status"]),
      );
      const user = await ensureIdentityUser({
        step,
        legacyUserId: legacyId,
        email: normalizeEmail(
          pickValue(row, ["email", "emailid", "email_id"]),
          "legacy-member",
          legacyId,
        ),
        preferredLocale: normalizeLocale(
          pickValue(row, ["preferred_locale", "language", "lang"]),
        ),
        status: userStatusFromProfileStatus(profileStatus, passwordState),
        passwordState,
      });

      await ensureUserRole(user.userId, RoleKey.MEMBER);

      const firstName =
        pickValue(row, ["firstname", "first_name", "fname"]) ?? `Member ${legacyId}`;
      const lastName = pickValue(row, ["lastname", "last_name", "lname"]);
      const displayName =
        pickValue(row, ["displayname", "display_name", "username"]) ??
        [firstName, lastName].filter(Boolean).join(" ");
      const gender =
        normalizeGender(pickValue(row, ["gender", "sex", "user_gender"])) ??
        GenderKey.MAN;
      const lookingFor = normalizeGender(
        pickValue(row, ["looking_for", "lookingfor", "partner_gender"]),
      );
      const birthDate = parseDate(
        pickValue(row, ["birth_date", "dob", "birthdate", "date_of_birth", "birthday"]),
      );
      const aboutMe = pickValue(row, ["about_me", "about", "self", "description"]);
      const familyDetails = pickValue(row, ["family_details", "family", "familyinfo"]);
      const religion = pickValue(row, ["religion", "religion_name"]);
      const educationLevel = pickValue(row, ["education", "education_level", "degree"]);
      const profession = pickValue(row, ["profession", "occupation", "job_title"]);
      const currentCountryCode = pickValue(row, [
        "current_country",
        "present_country",
        "country",
      ]);
      const currentCity = pickValue(row, ["current_city", "present_city", "city"]);
      const homeCountryCode = pickValue(row, ["home_country", "permanent_country"]);
      const homeDivision = pickValue(row, ["home_division", "division"]);
      const homeDistrict = pickValue(row, ["home_district", "district"]);
      const guardianPhone = pickValue(row, ["guardian_phone", "phone", "mobile"]);
      const profileCompletionPct =
        parseInteger(pickValue(row, ["profile_completion", "completion"])) ??
        calculateProfileCompletion([
          firstName,
          gender,
          birthDate,
          religion,
          educationLevel,
          profession,
          currentCountryCode,
          currentCity,
          aboutMe,
          familyDetails,
        ]);

      const existingProfile = await prisma.memberProfile.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      const profileData = {
        legacyId,
        firstName,
        lastName: lastName ?? undefined,
        displayName: displayName || undefined,
        gender,
        lookingFor,
        birthDate: birthDate ?? undefined,
        maritalStatus: pickValue(row, ["mstatus", "marital_status", "maritial_status"]) ?? undefined,
        childrenStatus: pickValue(row, ["children", "children_status", "have_children"]) ?? undefined,
        heightCm: (() => { const h = parseInteger(pickValue(row, ["height"])); return h && h > 100 && h < 250 ? h : undefined; })(),
        bodyType: pickValue(row, ["bodytype", "body_type"]) ?? undefined,
        complexion: pickValue(row, ["complexion"]) ?? undefined,
        bloodGroup: pickValue(row, ["bloodgroup", "blood_group"]) ?? undefined,
        fatherStatus: pickValue(row, ["father", "father_status"]) ?? undefined,
        motherStatus: pickValue(row, ["mother", "mother_status"]) ?? undefined,
        sistersCount: (() => { const n = parseInteger(pickValue(row, ["sisters", "sisters_count"])); return n !== null && n >= 0 && n <= 20 ? n : undefined; })(),
        brothersCount: (() => { const n = parseInteger(pickValue(row, ["brothers", "brothers_count"])); return n !== null && n >= 0 && n <= 20 ? n : undefined; })(),
        religion: religion ?? undefined,
        religionSubgroup: pickValue(row, ["sect", "religion_subgroup"]) ?? undefined,
        motherTongue: pickValue(row, ["mothertongue", "mother_tongue", "language_name"]) ?? undefined,
        educationLevel: educationLevel ?? undefined,
        profession: profession ?? undefined,
        designation: pickValue(row, ["designation", "profession_title"]) ?? undefined,
        currentCountryCode: currentCountryCode?.toUpperCase() ?? undefined,
        currentCity: currentCity ?? undefined,
        homeCountryCode: homeCountryCode?.toUpperCase() ?? undefined,
        homeDivision: homeDivision ?? undefined,
        homeDistrict: homeDistrict ?? undefined,
        familyDetails: familyDetails ?? undefined,
        aboutMe: aboutMe ?? undefined,
        guardianName: pickValue(row, ["guardian_name", "contact_person"]) ?? undefined,
        guardianRelation:
          pickValue(row, ["guardian_relation", "contact_relation"]) ?? undefined,
        guardianPhone: guardianPhone ?? undefined,
        guardianEmail:
          pickValue(row, ["guardian_email", "contact_email"]) ?? undefined,
        familyInvolvementLevel:
          pickValue(row, ["family_involvement", "family_involvement_level"]) ?? undefined,
        isProfilePublic:
          parseBoolean(pickValue(row, ["is_public", "profile_public"])) ?? true,
        indexingMode: "PRIVACY_LIMITED",
        contactVisibilityMode: "PLAN_GATED",
        profileCompletionPct,
        status: profileStatus,
        approvalStatus: approvalFromProfileStatus(profileStatus),
        profileOwnerType: ProfileOwnerType.SELF,
        approvedAt:
          profileStatus === ProfileStatus.ACTIVE
            ? parseDate(pickValue(row, ["approved_at", "active_date", "modified"]))
            : undefined,
      } satisfies Prisma.MemberProfileUncheckedUpdateInput;

      if (existingProfile) {
        await prisma.memberProfile.update({
          where: { id: existingProfile.id },
          data: profileData,
        });
        step.updated += user.created ? 0 : 1;
        memberRefs.set(legacyId, {
          userId: user.userId,
          memberProfileId: existingProfile.id,
          email: user.email,
        });
      } else {
        const createdProfile = await prisma.memberProfile.create({
          data: {
            ...profileData,
            userId: user.userId,
          },
          select: {
            id: true,
          },
        });
        step.imported += 1;
        memberRefs.set(legacyId, {
          userId: user.userId,
          memberProfileId: createdProfile.id,
          email: user.email,
        });
      }
    }
  }

  async function loadPartnerPreferences(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_partnerprofile.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_partnerprofile.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id"]));
      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "userid", "member_id", "profile_id"]),
      );

      if (!memberLegacyId) {
        step.skipped += 1;
        note(step, "Skipped partner preference row without member reference.");
        continue;
      }

      const memberRef = memberRefs.get(memberLegacyId);

      if (!memberRef) {
        step.skipped += 1;
        note(step, `Skipped partner preference for missing member legacy id ${memberLegacyId}.`);
        continue;
      }

      const data: Prisma.PartnerPreferenceUncheckedCreateInput = {
        legacyId: legacyId ?? undefined,
        memberProfileId: memberRef.memberProfileId,
        gender: normalizeGender(
          pickValue(row, ["gender", "looking_for", "partner_gender"]),
        ),
        ageMin: parseInteger(pickValue(row, ["age_min", "min_age"])),
        ageMax: parseInteger(pickValue(row, ["age_max", "max_age"])),
        religions: toJsonArray(splitMultiValue(pickValue(row, ["religion", "religions"]))),
        motherTongues: toJsonArray(
          splitMultiValue(pickValue(row, ["mother_tongue", "mother_tongues"])),
        ),
        educationLevels: toJsonArray(
          splitMultiValue(pickValue(row, ["education", "education_level"])),
        ),
        professions: toJsonArray(
          splitMultiValue(pickValue(row, ["profession", "occupations"])),
        ),
        livingCountryCodes: toJsonArray(
          splitMultiValue(
            pickValue(row, ["living_country", "living_country_codes", "country"]),
          ).map((item) => item.toUpperCase()),
        ),
        homeCountryCodes: toJsonArray(
          splitMultiValue(pickValue(row, ["home_country", "home_country_codes"])).map(
            (item) => item.toUpperCase(),
          ),
        ),
        districts: toJsonArray(splitMultiValue(pickValue(row, ["district", "districts"]))),
        aboutPartner:
          pickValue(row, ["about_partner", "partner_description"]) ?? undefined,
      };

      const existing = await prisma.partnerPreference.findUnique({
        where: {
          memberProfileId: memberRef.memberProfileId,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        await prisma.partnerPreference.update({
          where: {
            id: existing.id,
          },
          data,
        });
        step.updated += 1;
      } else {
        await prisma.partnerPreference.create({
          data,
        });
        step.imported += 1;
      }
    }
  }

  async function loadMedia(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_usersnaps.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_usersnaps.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseBigIntValue(pickValue(row, ["id", "snap_id"]));
      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "userid", "member_id"]),
      );
      const memberRef = memberLegacyId ? memberRefs.get(memberLegacyId) : undefined;
      const storagePath = pickValue(row, [
        "image",
        "photo",
        "img",
        "userfile",
        "user_img",
        "filename",
        "snap",
      ]);

      if (!legacyId || !memberRef || !storagePath) {
        step.skipped += 1;
        continue;
      }

      const data = {
        legacyId,
        memberProfileId: memberRef.memberProfileId,
        uploadedByUserId: memberRef.userId,
        mediaType: MediaType.PROFILE_PHOTO,
        storagePath:
          normalizeLegacyStoragePath(
            pickValue(row, [
              "picture",
              "image",
              "photo",
              "img",
              "userfile",
              "user_img",
              "filename",
              "snap",
            ]) ?? storagePath,
            "uploads",
          ) ?? storagePath,
        thumbnailPath:
          normalizeLegacyStoragePath(
            pickValue(row, ["tnpicture", "thumb", "thumbnail", "thumb_path"]),
            "uploads",
          ) ?? undefined,
        mimeType:
          pickValue(row, ["mime_type", "filetype"]) ??
          inferMimeTypeFromPath(storagePath) ??
          undefined,
        privacyMode: normalizeMediaPrivacy(
          pickValue(row, ["privacy", "private", "photo_privacy", "visible_to_public"]),
        ),
        isPrimary:
          parseBoolean(pickValue(row, ["is_primary", "is_default", "default_img"])) ??
          false,
        approvalStatus: normalizeMediaApproval(
          pickValue(row, ["status", "approval_status", "active"]),
        ),
      } satisfies Prisma.ProfileMediaUncheckedCreateInput;

      const existing = await prisma.profileMedia.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      if (existing) {
        await prisma.profileMedia.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
      } else {
        await prisma.profileMedia.create({
          data,
        });
        step.imported += 1;
      }
    }
  }

  async function loadVendors(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_dir_business.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_dir_business.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "business_id"]));
      const businessName =
        pickValue(row, ["business_name", "company", "name", "title"]) ??
        `Legacy Vendor ${legacyId ?? step.processed}`;

      const slug = `${slugify(businessName) || "vendor"}-${legacyId ?? step.processed}`;
      const existing = legacyId
        ? await prisma.vendorProfile.findUnique({
            where: { legacyId },
            select: { id: true },
          })
        : null;

      const data = {
        legacyId: legacyId ?? undefined,
        businessName,
        slug,
        categoryName:
          pickValue(row, ["category_name", "category", "business_category"]) ??
          undefined,
        division: pickValue(row, ["division"]) ?? undefined,
        district: pickValue(row, ["district"]) ?? undefined,
        area: pickValue(row, ["area", "location"]) ?? undefined,
        address: pickValue(row, ["address"]) ?? undefined,
        contactPerson: pickValue(row, ["contact_person", "person_name"]) ?? undefined,
        phone: pickValue(row, ["phone", "mobile"]) ?? undefined,
        email: pickValue(row, ["email"]) ?? undefined,
        website: pickValue(row, ["website", "web"]) ?? undefined,
        descriptionEn:
          pickValue(row, ["description", "details", "summary"]) ?? undefined,
        descriptionBn: pickValue(row, ["description_bn", "details_bn"]) ?? undefined,
        logoPath:
          normalizeLegacyStoragePath(
            pickValue(row, ["logo", "image", "photo"]),
            "company_imgs",
          ) ?? undefined,
        status: normalizeVendorStatus(pickValue(row, ["status", "active", "level"])),
      } satisfies Prisma.VendorProfileUncheckedCreateInput;

      if (existing) {
        await prisma.vendorProfile.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
        vendorRefs.set(legacyId ?? step.processed, {
          vendorProfileId: existing.id,
        });
      } else {
        const created = await prisma.vendorProfile.create({
          data,
          select: { id: true },
        });
        step.imported += 1;
        vendorRefs.set(legacyId ?? step.processed, {
          vendorProfileId: created.id,
        });
      }
    }
  }

  async function loadGhotoks(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_ghotok.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "ghotok_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      const passwordState = detectPasswordState(
        pickValue(row, ["password", "pass", "passwd"]),
      );
      const ghotokStatus = normalizeGhotokStatus(pickValue(row, ["ghotok_status", "status", "active"]));
      const email = normalizeEmail(pickValue(row, ["email"]), "legacy-ghotok", legacyId);
      const user = await ensureIdentityUser({
        step,
        email,
        preferredLocale: normalizeLocale(
          pickValue(row, ["preferred_locale", "language", "lang"]) ?? "bn",
        ),
        status:
          ghotokStatus === GhotokStatus.ACTIVE
            ? passwordState.loginReady
              ? UserStatus.ACTIVE
              : UserStatus.RESET_REQUIRED
            : UserStatus.PENDING,
        passwordState,
      });

      await ensureUserRole(user.userId, RoleKey.GHOTOK);

      const existing = await prisma.ghotokProfile.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      const data = {
        legacyId,
        userId: user.userId,
        displayName:
          pickValue(row, ["display_name", "name", "fullname"]) ?? `Ghotok ${legacyId}`,
        email,
        phone: pickValue(row, ["phone", "mobile"]) ?? undefined,
        address: pickValue(row, ["address", "location"]) ?? undefined,
        gender: normalizeGender(pickValue(row, ["gender"])),
        status: ghotokStatus,
        feeCurrency:
          pickValue(row, ["fee_currency", "currency"]) ?? undefined,
        feeAmount: parseInteger(pickValue(row, ["fee_amount", "fee"])) ?? undefined,
        bioEn: pickValue(row, ["bio", "description", "summary"]) ?? undefined,
        bioBn: pickValue(row, ["bio_bn", "description_bn"]) ?? undefined,
        photoPath:
          normalizeLegacyStoragePath(
            pickValue(row, ["photo", "image", "avatar"]),
            "uploads",
          ) ?? undefined,
      } satisfies Prisma.GhotokProfileUncheckedCreateInput;

      if (existing) {
        await prisma.ghotokProfile.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
        ghotokRefs.set(legacyId, {
          userId: user.userId,
          ghotokProfileId: existing.id,
        });
      } else {
        const created = await prisma.ghotokProfile.create({
          data,
          select: { id: true },
        });
        step.imported += 1;
        ghotokRefs.set(legacyId, {
          userId: user.userId,
          ghotokProfileId: created.id,
        });
      }
    }
  }

  async function loadGhotokLinks(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_ghotok_user.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_user.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const ghotokLegacyId = parseInteger(
        pickValue(row, ["ghotok_id", "gid", "ghot_id"]),
      );
      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "member_id", "userid"]),
      );

      if (!ghotokLegacyId || !memberLegacyId) {
        step.skipped += 1;
        continue;
      }

      const ghotokRef = ghotokRefs.get(ghotokLegacyId);
      const memberRef = memberRefs.get(memberLegacyId);

      if (!ghotokRef || !memberRef) {
        step.skipped += 1;
        continue;
      }

      await prisma.ghotokMemberLink.upsert({
        where: {
          ghotokProfileId_memberProfileId: {
            ghotokProfileId: ghotokRef.ghotokProfileId,
            memberProfileId: memberRef.memberProfileId,
          },
        },
        update: {
          status: GhotokLinkStatus.ACTIVE,
        },
        create: {
          ghotokProfileId: ghotokRef.ghotokProfileId,
          memberProfileId: memberRef.memberProfileId,
          status: GhotokLinkStatus.ACTIVE,
        },
      });

      await prisma.memberProfile.update({
        where: {
          id: memberRef.memberProfileId,
        },
        data: {
          managedByGhotokId: ghotokRef.ghotokProfileId,
          profileOwnerType: ProfileOwnerType.GHOTOK,
          createdByActorType: RoleKey.GHOTOK,
          createdByActorId: ghotokRef.ghotokProfileId,
        },
      });
      step.imported += 1;
    }
  }

  async function loadGhotokWallets(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_ghotok_credit_wallet.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_credit_wallet.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const ghotokLegacyId = parseInteger(
        pickValue(row, ["ghotok_id", "gid", "user_id"]),
      );

      if (!ghotokLegacyId) {
        step.skipped += 1;
        continue;
      }

      const ghotokRef = ghotokRefs.get(ghotokLegacyId);

      if (!ghotokRef) {
        step.skipped += 1;
        continue;
      }

      await prisma.ghotokCreditWallet.upsert({
        where: {
          ghotokProfileId: ghotokRef.ghotokProfileId,
        },
        update: {
          balance: parseInteger(pickValue(row, ["balance", "credits"])) ?? 0,
        },
        create: {
          ghotokProfileId: ghotokRef.ghotokProfileId,
          balance: parseInteger(pickValue(row, ["balance", "credits"])) ?? 0,
        },
      });
      step.imported += 1;
    }
  }

  async function loadGhotokLedger(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_ghotok_credit_txn.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_credit_txn.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "txn_id"]));
      const ghotokLegacyId = parseInteger(
        pickValue(row, ["ghotok_id", "gid", "user_id"]),
      );

      if (!legacyId || !ghotokLegacyId) {
        step.skipped += 1;
        continue;
      }

      const ghotokRef = ghotokRefs.get(ghotokLegacyId);

      if (!ghotokRef) {
        step.skipped += 1;
        continue;
      }

      const existing = await prisma.ghotokCreditLedger.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      const data = {
        legacyId,
        ghotokProfileId: ghotokRef.ghotokProfileId,
        entryType: pickValue(row, ["entry_type", "type"]) ?? "ADJUSTMENT",
        amount: parseInteger(pickValue(row, ["amount", "credit"])) ?? 0,
        balanceAfter: parseInteger(pickValue(row, ["balance_after", "balance"])) ?? 0,
        referenceType: pickValue(row, ["reference_type"]) ?? undefined,
        referenceId: pickValue(row, ["reference_id"]) ?? undefined,
        notes: pickValue(row, ["notes", "comment", "description"]) ?? undefined,
        createdAt:
          parseDate(pickValue(row, ["created_at", "entry_date", "adddate"])) ??
          new Date(),
      } satisfies Prisma.GhotokCreditLedgerUncheckedCreateInput;

      if (existing) {
        await prisma.ghotokCreditLedger.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
      } else {
        await prisma.ghotokCreditLedger.create({
          data,
        });
        step.imported += 1;
      }
    }
  }

  async function loadAdmins(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_admin.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_admin.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "admin_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      const passwordState = detectPasswordState(
        pickValue(row, ["password", "pass", "passwd"]),
      );
      const isSuperAdmin =
        parseBoolean(pickValue(row, ["is_super_admin", "superadmin", "super_admin"])) ??
        false;
      const email = normalizeEmail(
        pickValue(row, ["email", "username", "login"]),
        "legacy-admin",
        legacyId,
      );
      const user = await ensureIdentityUser({
        step,
        email,
        preferredLocale: LocaleKey.EN,
        status: passwordState.loginReady ? UserStatus.ACTIVE : UserStatus.RESET_REQUIRED,
        passwordState,
      });

      await ensureUserRole(user.userId, isSuperAdmin ? RoleKey.SUPER_ADMIN : RoleKey.ADMIN);

      const existing = await prisma.adminUser.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      const data = {
        legacyId,
        userId: user.userId,
        displayName:
          pickValue(row, ["display_name", "fullname", "name", "username"]) ??
          `Admin ${legacyId}`,
        isSuperAdmin,
        status: pickValue(row, ["status"]) ?? "ACTIVE",
      } satisfies Prisma.AdminUserUncheckedCreateInput;

      if (existing) {
        await prisma.adminUser.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
        adminRefs.set(legacyId, {
          userId: user.userId,
          adminUserId: existing.id,
        });
      } else {
        const created = await prisma.adminUser.create({
          data,
          select: { id: true },
        });
        step.imported += 1;
        adminRefs.set(legacyId, {
          userId: user.userId,
          adminUserId: created.id,
        });
      }
    }
  }

  async function loadPayments(step: StepSummary) {
    const filePath = path.join(sourceDir, "tbl_payment.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_payment.tsv was not found.");
      return;
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "payment_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "userid", "member_id"]),
      );
      const memberRef = memberLegacyId ? memberRefs.get(memberLegacyId) : undefined;
      const gateway = normalizePaymentGateway(
        pickValue(row, ["gateway", "payment_method", "method"]),
      );
      const subtotalAmount =
        parseDecimal(
          pickValue(row, ["subtotal_amount", "amount", "payment_amount", "total"]),
        ) ?? 0;
      const discountAmount =
        parseDecimal(pickValue(row, ["discount_amount", "discount"])) ?? 0;
      const finalAmount =
        parseDecimal(
          pickValue(row, ["final_amount", "paid_amount", "net_amount", "amount"]),
        ) ?? subtotalAmount;
      const currency =
        pickValue(row, ["currency", "payment_currency"]) ??
        (gateway === PaymentGateway.PAYPAL ? "USD" : "BDT");

      const existing = await prisma.payment.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      const data = {
        legacyId,
        userId: memberRef?.userId,
        actorType: memberRef ? RoleKey.MEMBER : undefined,
        actorId: memberRef?.memberProfileId,
        paymentForType: PaymentForType.MEMBERSHIP,
        gateway,
        gatewayReference:
          pickValue(row, ["txn_id", "transaction_id", "gateway_reference"]) ?? undefined,
        currency: currency.toUpperCase(),
        subtotalAmount,
        discountAmount,
        finalAmount,
        status: normalizePaymentStatus(
          pickValue(row, ["status", "payment_status", "approval_status"]),
        ),
        approvedAt:
          parseDate(pickValue(row, ["approved_at", "payment_date", "created_at"])) ??
          undefined,
        metadataJson: {
          importedMembershipLegacyId: parseInteger(
            pickValue(row, ["membership_id", "plan_id"]),
          ),
          importedRawStatus: pickValue(row, ["status", "payment_status"]),
          importedRawMethod: pickValue(row, ["gateway", "payment_method", "method"]),
        } satisfies Prisma.InputJsonValue,
      } satisfies Prisma.PaymentUncheckedCreateInput;

      if (existing) {
        await prisma.payment.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
      } else {
        await prisma.payment.create({
          data,
        });
        step.imported += 1;
      }
    }
  }

  async function ensureConversationForUsers(
    left: MemberRef,
    right: MemberRef,
    sentAt: Date,
  ) {
    const key = [left.userId, right.userId].sort().join(":");
    const cached = conversationRefs.get(key);

    if (cached) {
      return cached;
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.MEMBER_TO_MEMBER,
        participants: {
          some: { userId: left.userId },
        },
        AND: [
          {
            participants: {
              some: { userId: right.userId },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const conversationId =
      existing?.id ??
      (
        await prisma.conversation.create({
          data: {
            type: ConversationType.MEMBER_TO_MEMBER,
            createdAt: sentAt,
            participants: {
              create: [
                {
                  userId: left.userId,
                  memberProfileId: left.memberProfileId,
                },
                {
                  userId: right.userId,
                  memberProfileId: right.memberProfileId,
                },
              ],
            },
          },
          select: {
            id: true,
          },
        })
      ).id;

    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: left.userId,
        },
      },
      update: {
        memberProfileId: left.memberProfileId,
      },
      create: {
        conversationId,
        userId: left.userId,
        memberProfileId: left.memberProfileId,
      },
    });

    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: right.userId,
        },
      },
      update: {
        memberProfileId: right.memberProfileId,
      },
      create: {
        conversationId,
        userId: right.userId,
        memberProfileId: right.memberProfileId,
      },
    });

    conversationRefs.set(key, conversationId);
    return conversationId;
  }

  async function loadMailbox(step: StepSummary) {
    const canonicalPath = path.join(sourceDir, "tbl_mailbox_canonical.tsv");
    const fullRawPath = path.join(sourceDir, "tbl_mailbox.tsv");
    const recentPath = path.join(sourceDir, "tbl_mailbox_recent.tsv");
    const filePath = (await fileExists(canonicalPath))
      ? canonicalPath
      : (await fileExists(fullRawPath))
        ? fullRawPath
        : recentPath;

    if (!(await fileExists(filePath))) {
      note(step, "No mailbox export was found.");
      return;
    }

    const usingCanonical = filePath === canonicalPath;

    if (usingCanonical) {
      note(step, "Using canonical mailbox export to avoid duplicate inbox/sent rows.");
    } else if (filePath === fullRawPath) {
      note(
        step,
        "Using raw full mailbox export because canonical mailbox export was not present.",
      );
    } else {
      note(step, "Using recent mailbox export.");
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseBigIntValue(
        pickValue(row, ["legacy_group_id", "id", "mail_id"]),
      );
      const senderLegacyId = parseInteger(
        pickValue(row, ["senderid", "sender_id", "from_id", "send_by", "userid"]),
      );
      const recipientLegacyId = parseInteger(
        pickValue(
          row,
          ["recipientid", "receiver_id", "to_id", "user_id", "recipient_id"],
        ),
      );

      if (!legacyId || !senderLegacyId || !recipientLegacyId) {
        step.skipped += 1;
        continue;
      }

      const sender = memberRefs.get(senderLegacyId);
      const recipient = memberRefs.get(recipientLegacyId);

      if (!sender || !recipient) {
        step.skipped += 1;
        continue;
      }

      const sentAt =
        parseDate(pickValue(row, ["sendtime", "sent_at", "created_at"])) ?? new Date();
      const body =
        pickValue(row, ["message", "mail_message", "msg", "body"]) ??
        pickValue(row, ["subject", "mail_subject"]) ??
        "";
      const attachmentPath = normalizeLegacyStoragePath(
        pickValue(row, ["orig_filename1", "attachment_path", "attachment_name"]),
        "attachment",
      );
      const recipientRead =
        parseBoolean(pickValue(row, ["recipient_read"])) ??
        parseBoolean(
          pickValue(row, ["flagread", "read_flag", "recipient_read_flag"]),
        ) ??
        false;

      if (!body.trim()) {
        step.skipped += 1;
        continue;
      }

      const conversationId = await ensureConversationForUsers(sender, recipient, sentAt);
      const existing = await prisma.message.findUnique({
        where: { legacyId },
        select: { id: true },
      });

      const data = {
        legacyId,
        conversationId,
        senderUserId: sender.userId,
        senderMemberProfileId: sender.memberProfileId,
        body,
        attachmentPath: attachmentPath ?? undefined,
        sentAt,
        readAt: parseDate(pickValue(row, ["read_at", "readtime", "seen_at"])) ?? undefined,
        deliveredAt:
          parseDate(pickValue(row, ["delivered_at", "delivertime"])) ?? undefined,
      } satisfies Prisma.MessageUncheckedCreateInput;

      if (!data.readAt && recipientRead) {
        data.readAt = sentAt;
      }

      if (!data.deliveredAt) {
        data.deliveredAt = sentAt;
      }

      if (existing) {
        await prisma.message.update({
          where: { id: existing.id },
          data,
        });
        step.updated += 1;
      } else {
        await prisma.message.create({
          data,
        });
        step.imported += 1;
      }
    }
  }

  await runStep("membership_plans", loadMembershipPlans);
  await runStep("members", loadMembers);
  await runStep("partner_preferences", loadPartnerPreferences);
  await runStep("profile_media", loadMedia);
  await runStep("vendors", loadVendors);
  await runStep("ghotoks", loadGhotoks);
  await runStep("ghotok_links", loadGhotokLinks);
  await runStep("ghotok_wallets", loadGhotokWallets);
  await runStep("ghotok_ledger", loadGhotokLedger);
  await runStep("admins", loadAdmins);
  await runStep("payments", loadPayments);
  await runStep("mailbox_recent", loadMailbox);

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        success: true,
        outputPath,
        steps: Object.fromEntries(
          Object.entries(report.steps).map(([key, value]) => [
            key,
            {
              processed: value.processed,
              imported: value.imported,
              updated: value.updated,
              skipped: value.skipped,
            },
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : "Legacy load failed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
