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
  batchSize: number;
  metrics: {
    memberDuplicateEmails: number;
    memberInvalidEmails: number;
    ghotokMergedUsers: number;
    adminMergedUsers: number;
    mailboxConversations: number;
  };
  steps: Record<string, StepSummary>;
};

type PasswordState = {
  passwordHash?: string;
  legacyHash?: string;
  legacyHashType?: string;
  loginReady: boolean;
};

type MemberRef = {
  legacyId: number;
  userId: string;
  memberProfileId: string;
  email: string;
};

type GhotokRef = {
  legacyId: number;
  userId: string;
  ghotokProfileId: string;
};

type AdminRef = {
  legacyId: number;
  userId: string;
  adminUserId: string;
};

type VendorRef = {
  legacyId: number;
  vendorProfileId: string;
};

type ConversationRef = {
  id: string;
  firstLegacyId: number;
  secondLegacyId: number;
  firstUserId: string;
  secondUserId: string;
  firstMemberProfileId: string;
  secondMemberProfileId: string;
  createdAt: Date;
};

const prisma = new PrismaClient();
const DEFAULT_BATCH_SIZE = Number.parseInt(process.env.LEGACY_BATCH_SIZE ?? "500", 10);
const BATCH_SIZE = Number.isFinite(DEFAULT_BATCH_SIZE) && DEFAULT_BATCH_SIZE > 0
  ? DEFAULT_BATCH_SIZE
  : 500;

function createStepSummary(): StepSummary {
  return {
    processed: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    warnings: [],
  };
}

function note(step: StepSummary, message: string) {
  if (step.warnings.length < 25) {
    step.warnings.push(message);
  }
}

function maybeLogProgress(stepName: string, processed: number, extra?: Record<string, unknown>) {
  if (processed > 0 && processed % 5000 === 0) {
    console.log(
      JSON.stringify({
        step: stepName,
        processed,
        ...extra,
      }),
    );
  }
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

function normalizeLegacyStoragePath(value: string | null, defaultFolder: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\\/g, "/").replace(/^\.?\//, "");

  if (!trimmed.length || trimmed.toLowerCase() === "null") {
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

function normalizeEmailCandidate(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function extractFirstValidEmail(value: string | null) {
  if (!value) {
    return null;
  }

  for (const candidate of value.split(/[,\s;]+/g)) {
    const normalized = normalizeEmailCandidate(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function makeImportEmail(prefix: string, legacyId: number) {
  return `${prefix}-${legacyId}@import.borbodhu.local`;
}

function resolveMemberEmail(
  rawEmail: string | null,
  legacyId: number,
  usedEmails: Set<string>,
  step: StepSummary,
  report: LoadReport,
) {
  const normalized = normalizeEmailCandidate(rawEmail);

  if (!normalized) {
    report.metrics.memberInvalidEmails += 1;
    const fallback = makeImportEmail("legacy-member", legacyId);
    usedEmails.add(fallback);
    return fallback;
  }

  if (usedEmails.has(normalized)) {
    report.metrics.memberDuplicateEmails += 1;
    note(step, `Member legacy id ${legacyId} reused email ${normalized}; assigned import alias.`);
    const fallback = makeImportEmail("legacy-member", legacyId);
    usedEmails.add(fallback);
    return fallback;
  }

  usedEmails.add(normalized);
  return normalized;
}

function resolveSharedActorEmail(
  rawEmail: string | null,
  legacyId: number,
  prefix: string,
  usedEmails: Set<string>,
) {
  const normalized = normalizeEmailCandidate(rawEmail);

  if (normalized) {
    return normalized;
  }

  const fallback = makeImportEmail(prefix, legacyId);
  usedEmails.add(fallback);
  return fallback;
}

const MAX_DECIMAL_10_2 = 99_999_999.99;

function normalizeCurrencyAmount(
  value: number | null,
  step: StepSummary,
  legacyId: number,
  fieldName: string,
) {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  const rounded = Number(value.toFixed(2));

  if (Math.abs(rounded) > MAX_DECIMAL_10_2) {
    note(
      step,
      `Payment ${legacyId} ${fieldName}=${rounded} exceeded Decimal(10,2); clamped to ${MAX_DECIMAL_10_2}.`,
    );
    return Math.sign(rounded) * MAX_DECIMAL_10_2;
  }

  return rounded;
}

function memberUserId(legacyId: number) {
  return `legacy-user-member-${legacyId}`;
}

function memberProfileId(legacyId: number) {
  return `legacy-member-profile-${legacyId}`;
}

function memberDisplayId(legacyId: number) {
  return `m-${legacyId}`;
}

function userRoleId(userId: string, role: RoleKey) {
  return `legacy-user-role-${userId}-${role.toLowerCase()}`;
}

function vendorProfileId(legacyId: number) {
  return `legacy-vendor-profile-${legacyId}`;
}

function ghotokUserId(legacyId: number) {
  return `legacy-user-ghotok-${legacyId}`;
}

function ghotokProfileId(legacyId: number) {
  return `legacy-ghotok-profile-${legacyId}`;
}

function ghotokWalletId(legacyId: number) {
  return `legacy-ghotok-wallet-${legacyId}`;
}

function ghotokLedgerId(legacyId: number) {
  return `legacy-ghotok-ledger-${legacyId}`;
}

function adminUserAccountId(legacyId: number) {
  return `legacy-user-admin-${legacyId}`;
}

function adminProfileId(legacyId: number) {
  return `legacy-admin-profile-${legacyId}`;
}

function paymentId(legacyId: number) {
  return `legacy-payment-${legacyId}`;
}

function messageId(legacyId: bigint) {
  return `legacy-message-${legacyId.toString()}`;
}

function partnerPreferenceId(legacyId: number | null, memberLegacyId: number) {
  return legacyId ? `legacy-partner-preference-${legacyId}` : `legacy-partner-preference-member-${memberLegacyId}`;
}

function profileMediaId(legacyId: bigint) {
  return `legacy-profile-media-${legacyId.toString()}`;
}

function vendorSlug(name: string, legacyId: number) {
  return `${slugify(name) || "vendor"}-${legacyId}`;
}

function chunked<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function flushCreateMany<T>(
  items: T[],
  handler: (payload: T[]) => Promise<void>,
) {
  if (!items.length) {
    return;
  }

  const batch = items.splice(0, items.length);
  await handler(batch);
}

async function main() {
  const sourceDirArg = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!sourceDirArg) {
    throw new Error("Usage: tsx src/migration/legacy-bulk-load.ts <sourceDir> [outputPath]");
  }

  const sourceDir = path.resolve(sourceDirArg);
  const outputPath = outputPathArg
    ? path.resolve(outputPathArg)
    : path.join(sourceDir, "legacy-bulk-load-report.json");

  const report: LoadReport = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    outputPath,
    batchSize: BATCH_SIZE,
    metrics: {
      memberDuplicateEmails: 0,
      memberInvalidEmails: 0,
      ghotokMergedUsers: 0,
      adminMergedUsers: 0,
      mailboxConversations: 0,
    },
    steps: {},
  };

  const usedEmails = new Set<string>();
  const userIdByEmail = new Map<string, string>();
  const memberRefs = new Map<number, MemberRef>();
  const ghotokRefs = new Map<number, GhotokRef>();
  const adminRefs = new Map<number, AdminRef>();
  const vendorRefs = new Map<number, VendorRef>();
  const startAt = process.env.LEGACY_START_AT?.trim() ?? "";
  let hasStarted = startAt.length === 0;

  async function runStep(stepName: string, handler: (step: StepSummary) => Promise<void>) {
    const step = createStepSummary();
    report.steps[stepName] = step;

    if (!hasStarted) {
      if (stepName === startAt) {
        hasStarted = true;
      } else {
        note(step, `Skipped because LEGACY_START_AT=${startAt}.`);
        return;
      }
    }

    await handler(step);
  }

  async function hydrateReferenceMaps() {
    const members = await prisma.memberProfile.findMany({
      where: {
        legacyId: {
          not: null,
        },
      },
      select: {
        legacyId: true,
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    for (const member of members) {
      if (!member.legacyId) {
        continue;
      }

      memberRefs.set(member.legacyId, {
        legacyId: member.legacyId,
        userId: member.userId,
        memberProfileId: member.id,
        email: member.user.email,
      });
      userIdByEmail.set(member.user.email, member.userId);
      usedEmails.add(member.user.email);
    }

    const ghotoks = await prisma.ghotokProfile.findMany({
      where: {
        legacyId: {
          not: null,
        },
      },
      select: {
        legacyId: true,
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    for (const ghotok of ghotoks) {
      if (!ghotok.legacyId) {
        continue;
      }

      ghotokRefs.set(ghotok.legacyId, {
        legacyId: ghotok.legacyId,
        userId: ghotok.userId,
        ghotokProfileId: ghotok.id,
      });
      userIdByEmail.set(ghotok.user.email, ghotok.userId);
      usedEmails.add(ghotok.user.email);
    }

    const admins = await prisma.adminUser.findMany({
      where: {
        legacyId: {
          not: null,
        },
      },
      select: {
        legacyId: true,
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    for (const admin of admins) {
      if (!admin.legacyId) {
        continue;
      }

      adminRefs.set(admin.legacyId, {
        legacyId: admin.legacyId,
        userId: admin.userId,
        adminUserId: admin.id,
      });
      userIdByEmail.set(admin.user.email, admin.userId);
      usedEmails.add(admin.user.email);
    }

    const vendors = await prisma.vendorProfile.findMany({
      where: {
        legacyId: {
          not: null,
        },
      },
      select: {
        legacyId: true,
        id: true,
      },
    });

    for (const vendor of vendors) {
      if (!vendor.legacyId) {
        continue;
      }

      vendorRefs.set(vendor.legacyId, {
        legacyId: vendor.legacyId,
        vendorProfileId: vendor.id,
      });
    }
  }

  if (startAt.length > 0) {
    await hydrateReferenceMaps();
  }

  await runStep("membership_plans", async (step) => {
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
            sortOrder: legacyId ?? step.processed,
          },
        });
        step.updated += 1;
      } else {
        await prisma.membershipPlan.create({
          data: {
            id: `legacy-membership-plan-${legacyId ?? step.processed}`,
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
            sortOrder: legacyId ?? step.processed,
          },
        });
        step.imported += 1;
      }
    }
  });

  await runStep("members", async (step) => {
    const filePath = path.join(sourceDir, "tbl_user.tsv");

    if (!(await fileExists(filePath))) {
      throw new Error("tbl_user.tsv is required for legacy bulk load.");
    }

    const users: Prisma.UserCreateManyInput[] = [];
    const roles: Prisma.UserRoleCreateManyInput[] = [];
    const profiles: Prisma.MemberProfileCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushMembers() {
      await flushCreateMany(users, async (payload) => {
        await prisma.user.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(roles, async (payload) => {
        await prisma.userRole.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(profiles, async (payload) => {
        await prisma.memberProfile.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("members", step.processed, {
        bufferedUsers: users.length,
      });

      const legacyId = parseInteger(pickValue(row, ["id", "user_id"]));

      if (!legacyId) {
        step.skipped += 1;
        note(step, "Skipped member row without a legacy user id.");
        continue;
      }

      if (seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        note(step, `Skipped duplicate member legacy id ${legacyId}.`);
        continue;
      }

      seenLegacyIds.add(legacyId);

      const rawPassword = pickValue(row, ["password", "pass", "passwd"]);
      const passwordState = detectPasswordState(rawPassword);
      const profileStatus = normalizeProfileStatus(
        pickValue(row, ["status", "active", "profile_status"]),
      );
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
        pickValue(row, ["dob", "birthdate", "date_of_birth", "birth_date", "birthday"]),
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
      const createdAt =
        parseDate(pickValue(row, ["created_at", "adddate", "regdate"])) ?? new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;
      const email = resolveMemberEmail(
        pickValue(row, ["email", "emailid", "email_id"]),
        legacyId,
        usedEmails,
        step,
        report,
      );
      const userId = memberUserId(legacyId);
      const profileId = memberProfileId(legacyId);

      users.push({
        id: userId,
        legacyId,
        email,
        preferredLocale: normalizeLocale(
          pickValue(row, ["preferred_locale", "language", "lang"]),
        ),
        status: userStatusFromProfileStatus(profileStatus, passwordState),
        passwordHash: passwordState.passwordHash,
        legacyHash: passwordState.legacyHash,
        legacyHashType: passwordState.legacyHashType,
        lastLoginAt:
          parseDate(pickValue(row, ["last_login_at", "lastlogin", "last_login"])) ??
          undefined,
        createdAt,
        updatedAt,
      });

      roles.push({
        id: userRoleId(userId, RoleKey.MEMBER),
        userId,
        role: RoleKey.MEMBER,
        assignedAt: createdAt,
      });

      profiles.push({
        id: profileId,
        legacyId,
        userId,
        displayId: memberDisplayId(legacyId),
        status: profileStatus,
        approvalStatus: approvalFromProfileStatus(profileStatus),
        profileOwnerType: ProfileOwnerType.SELF,
        firstName,
        lastName: lastName ?? undefined,
        displayName: displayName || undefined,
        gender,
        lookingFor,
        birthDate: birthDate ?? undefined,
        maritalStatus: pickValue(row, ["marital_status", "maritial_status"]) ?? undefined,
        childrenStatus: pickValue(row, ["children_status", "have_children"]) ?? undefined,
        religion: religion ?? undefined,
        religionSubgroup: pickValue(row, ["sect", "religion_subgroup"]) ?? undefined,
        motherTongue: pickValue(row, ["mother_tongue", "language_name"]) ?? undefined,
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
        profileCompletionPct:
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
          ]),
        approvedAt:
          profileStatus === ProfileStatus.ACTIVE
            ? parseDate(pickValue(row, ["approved_at", "active_date", "modified"])) ??
              undefined
            : undefined,
        createdAt,
        updatedAt,
      });

      memberRefs.set(legacyId, {
        legacyId,
        userId,
        memberProfileId: profileId,
        email,
      });
      userIdByEmail.set(email, userId);
      step.imported += 1;

      if (users.length >= BATCH_SIZE) {
        await flushMembers();
      }
    }

    await flushMembers();
  });

  await runStep("partner_preferences", async (step) => {
    const filePath = path.join(sourceDir, "tbl_partnerprofile.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_partnerprofile.tsv was not found.");
      return;
    }

    const byMemberProfileId = new Map<string, Prisma.PartnerPreferenceCreateManyInput>();

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("partner_preferences", step.processed);

      const legacyId = parseInteger(pickValue(row, ["id"]));
      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "userid", "member_id", "profile_id", "id"]),
      );

      if (!memberLegacyId) {
        step.skipped += 1;
        continue;
      }

      const memberRef = memberRefs.get(memberLegacyId);

      if (!memberRef) {
        step.skipped += 1;
        continue;
      }

      byMemberProfileId.set(memberRef.memberProfileId, {
        id: partnerPreferenceId(memberLegacyId, memberLegacyId),
        legacyId: memberLegacyId,
        memberProfileId: memberRef.memberProfileId,
        gender: normalizeGender(
          pickValue(row, ["lookgender", "gender", "looking_for", "partner_gender"]),
        ),
        ageMin: parseInteger(pickValue(row, ["lookagestart", "age_min", "min_age"])),
        ageMax: parseInteger(pickValue(row, ["lookageend", "age_max", "max_age"])),
        maritalStatuses: toJsonArray(
          splitMultiValue(pickValue(row, ["p_mstatus", "marital_status", "maritial_status"])),
        ),
        childrenPreferences: toJsonArray(
          splitMultiValue(pickValue(row, ["p_children", "children_preference"])),
        ),
        heightMinCm: parseInteger(pickValue(row, ["s_height", "height_min"])),
        heightMaxCm: parseInteger(pickValue(row, ["e_height", "height_max"])),
        religions: toJsonArray(
          splitMultiValue(pickValue(row, ["p_religion", "religion", "religions"])),
        ),
        religionSubgroups: toJsonArray(
          splitMultiValue(pickValue(row, ["p_religion_type", "religion_type"])),
        ),
        motherTongues: toJsonArray(
          splitMultiValue(pickValue(row, ["p_mothertongue", "mother_tongue", "mother_tongues"])),
        ),
        familyValues: toJsonArray(
          splitMultiValue(pickValue(row, ["p_fvalue", "family_values"])),
        ),
        educationLevels: toJsonArray(
          splitMultiValue(pickValue(row, ["p_degree", "education", "education_level"])),
        ),
        educationMajors: toJsonArray(
          splitMultiValue(pickValue(row, ["p_major", "education_major"])),
        ),
        professions: toJsonArray(
          splitMultiValue(pickValue(row, ["p_profession", "profession", "occupations"])),
        ),
        dietPreferences: toJsonArray(
          splitMultiValue(pickValue(row, ["p_diet", "diet_preference"])),
        ),
        smokePreferences: toJsonArray(
          splitMultiValue(pickValue(row, ["p_smoke", "smoke_preference"])),
        ),
        drinkPreferences: toJsonArray(
          splitMultiValue(pickValue(row, ["p_drink", "drink_preference"])),
        ),
        livingCountryCodes: toJsonArray(
          splitMultiValue(
            pickValue(row, ["p_countryliving", "living_country", "living_country_codes", "country"]),
          ).map((item) => item.toUpperCase()),
        ),
        homeCountryCodes: toJsonArray(
          splitMultiValue(
            pickValue(row, ["p_countryresidence", "home_country", "home_country_codes"]),
          ).map(
            (item) => item.toUpperCase(),
          ),
        ),
        districts: toJsonArray(
          splitMultiValue(pickValue(row, ["p_cityresidence", "district", "districts"])),
        ),
        residenceStatuses: toJsonArray(
          splitMultiValue(pickValue(row, ["p_residen_status", "residence_status"])),
        ),
        aboutPartner:
          pickValue(row, ["p_family_details", "about_partner", "partner_description"]) ?? undefined,
        updatedAt:
          parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? new Date(),
      });
    }

    const payload = [...byMemberProfileId.values()];
    for (const chunk of chunked(payload, BATCH_SIZE)) {
      await prisma.partnerPreference.createMany({ data: chunk, skipDuplicates: true });
    }

    step.imported = payload.length;
  });

  await runStep("profile_media", async (step) => {
    const filePath = path.join(sourceDir, "tbl_usersnaps.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_usersnaps.tsv was not found.");
      return;
    }

    const mediaRows: Prisma.ProfileMediaCreateManyInput[] = [];
    const seenLegacyIds = new Set<string>();

    async function flushMedia() {
      await flushCreateMany(mediaRows, async (payload) => {
        await prisma.profileMedia.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("profile_media", step.processed, {
        bufferedMedia: mediaRows.length,
      });

      const legacyId = parseBigIntValue(pickValue(row, ["id", "snap_id"]));
      const memberLegacyId = parseInteger(
        pickValue(row, ["user_id", "userid", "member_id"]),
      );
      const memberRef = memberLegacyId ? memberRefs.get(memberLegacyId) : undefined;
      const storagePath = pickValue(row, [
        "picture",
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

      const legacyKey = legacyId.toString();
      if (seenLegacyIds.has(legacyKey)) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyKey);
      const createdAt =
        parseDate(pickValue(row, ["created_at", "adddate", "uploaded_at"])) ?? new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;

      mediaRows.push({
        id: profileMediaId(legacyId),
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
          parseBoolean(pickValue(row, ["is_primary", "is_default", "default_img", "default"])) ??
          false,
        approvalStatus: normalizeMediaApproval(
          pickValue(row, ["status", "approval_status", "active"]),
        ),
        createdAt:
          parseDate(pickValue(row, ["created_at", "adddate", "uploaded_at", "ins_time"])) ??
          createdAt,
        updatedAt,
      });
      step.imported += 1;

      if (mediaRows.length >= BATCH_SIZE) {
        await flushMedia();
      }
    }

    await flushMedia();
  });

  await runStep("vendors", async (step) => {
    const filePath = path.join(sourceDir, "tbl_dir_business.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_dir_business.tsv was not found.");
      return;
    }

    const rows: Prisma.VendorProfileCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushVendors() {
      await flushCreateMany(rows, async (payload) => {
        await prisma.vendorProfile.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "business_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      if (seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyId);
      const businessName =
        pickValue(row, ["business_name", "company", "name", "title"]) ??
        `Legacy Vendor ${legacyId}`;
      const createdAt =
        parseDate(pickValue(row, ["created_at", "adddate"])) ?? new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;
      const id = vendorProfileId(legacyId);

      rows.push({
        id,
        legacyId,
        businessName,
        slug: vendorSlug(businessName, legacyId),
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
        createdAt,
        updatedAt,
      });
      vendorRefs.set(legacyId, {
        legacyId,
        vendorProfileId: id,
      });
      step.imported += 1;

      if (rows.length >= BATCH_SIZE) {
        await flushVendors();
      }
    }

    await flushVendors();
  });

  await runStep("ghotoks", async (step) => {
    const filePath = path.join(sourceDir, "tbl_ghotok.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok.tsv was not found.");
      return;
    }

    const users: Prisma.UserCreateManyInput[] = [];
    const roles: Prisma.UserRoleCreateManyInput[] = [];
    const profiles: Prisma.GhotokProfileCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushGhotoks() {
      await flushCreateMany(users, async (payload) => {
        await prisma.user.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(roles, async (payload) => {
        await prisma.userRole.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(profiles, async (payload) => {
        await prisma.ghotokProfile.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "ghotok_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      if (seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyId);
      const passwordState = detectPasswordState(
        pickValue(row, ["password", "pass", "passwd"]),
      );
      const status = normalizeGhotokStatus(pickValue(row, ["ghotok_status", "status", "active"]));
      const email = resolveSharedActorEmail(
        pickValue(row, ["email"]),
        legacyId,
        "legacy-ghotok",
        usedEmails,
      );
      let userId = userIdByEmail.get(email);
      const createdAt =
        parseDate(pickValue(row, ["created_at", "adddate"])) ?? new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;

      if (!userId) {
        userId = ghotokUserId(legacyId);
        users.push({
          id: userId,
          email,
          preferredLocale: normalizeLocale(
            pickValue(row, ["preferred_locale", "language", "lang"]) ?? "bn",
          ),
          status:
            status === GhotokStatus.ACTIVE
              ? passwordState.loginReady
                ? UserStatus.ACTIVE
                : UserStatus.RESET_REQUIRED
              : UserStatus.PENDING,
          passwordHash: passwordState.passwordHash,
          legacyHash: passwordState.legacyHash,
          legacyHashType: passwordState.legacyHashType,
          createdAt,
          updatedAt,
        });
        userIdByEmail.set(email, userId);
        usedEmails.add(email);
      } else {
        report.metrics.ghotokMergedUsers += 1;
      }

      roles.push({
        id: userRoleId(userId, RoleKey.GHOTOK),
        userId,
        role: RoleKey.GHOTOK,
        assignedAt: createdAt,
      });

      const profileId = ghotokProfileId(legacyId);
      profiles.push({
        id: profileId,
        legacyId,
        userId,
        displayName:
          pickValue(row, ["display_name", "name", "fullname"]) ?? `Ghotok ${legacyId}`,
        email,
        phone: pickValue(row, ["phone", "mobile"]) ?? undefined,
        address: pickValue(row, ["address", "location"]) ?? undefined,
        gender: normalizeGender(pickValue(row, ["gender"])),
        status,
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
        createdAt,
        updatedAt,
      });
      ghotokRefs.set(legacyId, {
        legacyId,
        userId,
        ghotokProfileId: profileId,
      });
      step.imported += 1;

      if (profiles.length >= BATCH_SIZE) {
        await flushGhotoks();
      }
    }

    await flushGhotoks();
  });

  await runStep("ghotok_links", async (step) => {
    const filePath = path.join(sourceDir, "tbl_ghotok_user.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_user.tsv was not found.");
      return;
    }

    const rows: Prisma.GhotokMemberLinkCreateManyInput[] = [];
    const memberUpdates: Array<{
      memberProfileId: string;
      ghotokProfileId: string;
    }> = [];
    const seenKeys = new Set<string>();

    async function flushLinks() {
      await flushCreateMany(rows, async (payload) => {
        await prisma.ghotokMemberLink.createMany({ data: payload, skipDuplicates: true });
      });
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

      const key = `${ghotokRef.ghotokProfileId}:${memberRef.memberProfileId}`;
      if (seenKeys.has(key)) {
        step.skipped += 1;
        continue;
      }

      seenKeys.add(key);
      rows.push({
        id: `legacy-ghotok-link-${ghotokLegacyId}-${memberLegacyId}`,
        ghotokProfileId: ghotokRef.ghotokProfileId,
        memberProfileId: memberRef.memberProfileId,
        status: GhotokLinkStatus.ACTIVE,
        createdAt: new Date(),
      });
      memberUpdates.push({
        memberProfileId: memberRef.memberProfileId,
        ghotokProfileId: ghotokRef.ghotokProfileId,
      });
      step.imported += 1;

      if (rows.length >= BATCH_SIZE) {
        await flushLinks();
      }
    }

    await flushLinks();

    for (const update of memberUpdates) {
      await prisma.memberProfile.update({
        where: {
          id: update.memberProfileId,
        },
        data: {
          managedByGhotokId: update.ghotokProfileId,
          profileOwnerType: ProfileOwnerType.GHOTOK,
          createdByActorType: RoleKey.GHOTOK,
          createdByActorId: update.ghotokProfileId,
        },
      });
    }
  });

  await runStep("ghotok_wallets", async (step) => {
    const filePath = path.join(sourceDir, "tbl_ghotok_credit_wallet.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_credit_wallet.tsv was not found.");
      return;
    }

    const rows: Prisma.GhotokCreditWalletCreateManyInput[] = [];
    const seenKeys = new Set<string>();

    async function flushWallets() {
      await flushCreateMany(rows, async (payload) => {
        await prisma.ghotokCreditWallet.createMany({ data: payload, skipDuplicates: true });
      });
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

      if (!ghotokRef || seenKeys.has(ghotokRef.ghotokProfileId)) {
        step.skipped += 1;
        continue;
      }

      seenKeys.add(ghotokRef.ghotokProfileId);
      rows.push({
        id: ghotokWalletId(ghotokLegacyId),
        ghotokProfileId: ghotokRef.ghotokProfileId,
        balance: parseInteger(pickValue(row, ["balance", "credits"])) ?? 0,
        updatedAt:
          parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ??
          new Date(),
      });
      step.imported += 1;

      if (rows.length >= BATCH_SIZE) {
        await flushWallets();
      }
    }

    await flushWallets();
  });

  await runStep("ghotok_ledger", async (step) => {
    const filePath = path.join(sourceDir, "tbl_ghotok_credit_txn.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_ghotok_credit_txn.tsv was not found.");
      return;
    }

    const rows: Prisma.GhotokCreditLedgerCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushLedger() {
      await flushCreateMany(rows, async (payload) => {
        await prisma.ghotokCreditLedger.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "txn_id"]));
      const ghotokLegacyId = parseInteger(
        pickValue(row, ["ghotok_id", "gid", "user_id"]),
      );

      if (!legacyId || !ghotokLegacyId || seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        continue;
      }

      const ghotokRef = ghotokRefs.get(ghotokLegacyId);

      if (!ghotokRef) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyId);
      rows.push({
        id: ghotokLedgerId(legacyId),
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
      });
      step.imported += 1;

      if (rows.length >= BATCH_SIZE) {
        await flushLedger();
      }
    }

    await flushLedger();
  });

  await runStep("admins", async (step) => {
    const filePath = path.join(sourceDir, "tbl_admin.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_admin.tsv was not found.");
      return;
    }

    const users: Prisma.UserCreateManyInput[] = [];
    const roles: Prisma.UserRoleCreateManyInput[] = [];
    const profiles: Prisma.AdminUserCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushAdmins() {
      await flushCreateMany(users, async (payload) => {
        await prisma.user.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(roles, async (payload) => {
        await prisma.userRole.createMany({ data: payload, skipDuplicates: true });
      });
      await flushCreateMany(profiles, async (payload) => {
        await prisma.adminUser.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      const legacyId = parseInteger(pickValue(row, ["id", "admin_id"]));

      if (!legacyId) {
        step.skipped += 1;
        continue;
      }

      if (seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyId);
      const passwordState = detectPasswordState(
        pickValue(row, ["password", "pass", "passwd"]),
      );
      const isSuperAdmin =
        parseBoolean(pickValue(row, ["is_super_admin", "superadmin", "super_admin"])) ??
        false;
      const preferredAdminEmail =
        extractFirstValidEmail(pickValue(row, ["email"])) ??
        extractFirstValidEmail(pickValue(row, ["username", "login"]));
      const email =
        preferredAdminEmail && !usedEmails.has(preferredAdminEmail)
          ? preferredAdminEmail
          : makeImportEmail("legacy-admin", legacyId);
      const userId = adminUserAccountId(legacyId);
      const createdAt =
        parseDate(pickValue(row, ["created_at", "adddate"])) ?? new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;

      users.push({
        id: userId,
        email,
        preferredLocale: LocaleKey.EN,
        status: passwordState.loginReady ? UserStatus.ACTIVE : UserStatus.RESET_REQUIRED,
        passwordHash: passwordState.passwordHash,
        legacyHash: passwordState.legacyHash,
        legacyHashType: passwordState.legacyHashType,
        createdAt,
        updatedAt,
      });
      userIdByEmail.set(email, userId);
      usedEmails.add(email);

      const role = isSuperAdmin ? RoleKey.SUPER_ADMIN : RoleKey.ADMIN;
      roles.push({
        id: userRoleId(userId, role),
        userId,
        role,
        assignedAt: createdAt,
      });

      const adminId = adminProfileId(legacyId);
      profiles.push({
        id: adminId,
        legacyId,
        userId,
        displayName:
          pickValue(row, ["display_name", "fullname", "name", "username"]) ??
          `Admin ${legacyId}`,
        isSuperAdmin,
        status: pickValue(row, ["status"]) ?? "ACTIVE",
        createdAt,
        updatedAt,
      });
      adminRefs.set(legacyId, {
        legacyId,
        userId,
        adminUserId: adminId,
      });
      step.imported += 1;

      if (profiles.length >= BATCH_SIZE) {
        await flushAdmins();
      }
    }

    await flushAdmins();
  });

  await runStep("payments", async (step) => {
    const filePath = path.join(sourceDir, "tbl_payment.tsv");

    if (!(await fileExists(filePath))) {
      note(step, "tbl_payment.tsv was not found.");
      return;
    }

    const rows: Prisma.PaymentCreateManyInput[] = [];
    const seenLegacyIds = new Set<number>();

    async function flushPayments() {
      await flushCreateMany(rows, async (payload) => {
        await prisma.payment.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("payments", step.processed, {
        bufferedPayments: rows.length,
      });

      const legacyId = parseInteger(pickValue(row, ["id", "payment_id"]));

      if (!legacyId || seenLegacyIds.has(legacyId)) {
        step.skipped += 1;
        continue;
      }

      seenLegacyIds.add(legacyId);
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
      const createdAt =
        parseDate(pickValue(row, ["created_at", "payment_date", "adddate"])) ??
        new Date();
      const updatedAt =
        parseDate(pickValue(row, ["updated_at", "modified", "modified_at"])) ?? createdAt;
      const safeSubtotalAmount = normalizeCurrencyAmount(
        subtotalAmount,
        step,
        legacyId,
        "subtotalAmount",
      );
      const safeDiscountAmount = normalizeCurrencyAmount(
        discountAmount,
        step,
        legacyId,
        "discountAmount",
      );
      const safeFinalAmount = normalizeCurrencyAmount(
        finalAmount,
        step,
        legacyId,
        "finalAmount",
      );

      rows.push({
        id: paymentId(legacyId),
        legacyId,
        userId: memberRef?.userId,
        actorType: memberRef ? RoleKey.MEMBER : undefined,
        actorId: memberRef?.memberProfileId,
        paymentForType: PaymentForType.MEMBERSHIP,
        gateway,
        gatewayReference:
          pickValue(row, ["txn_id", "transaction_id", "gateway_reference"]) ?? undefined,
        currency: currency.toUpperCase(),
        subtotalAmount: new Prisma.Decimal(safeSubtotalAmount),
        discountAmount: new Prisma.Decimal(safeDiscountAmount),
        finalAmount: new Prisma.Decimal(safeFinalAmount),
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
        createdAt,
        updatedAt,
      });
      step.imported += 1;

      if (rows.length >= BATCH_SIZE) {
        await flushPayments();
      }
    }

    await flushPayments();
  });

  await runStep("mailbox_messages", async (step) => {
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

    const conversations = new Map<string, ConversationRef>();

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("mailbox_messages:scan", step.processed, {
        conversations: conversations.size,
      });

      const senderLegacyId = parseInteger(
        pickValue(row, ["senderid", "sender_id", "from_id", "send_by", "userid"]),
      );
      const recipientLegacyId = parseInteger(
        pickValue(
          row,
          ["recipientid", "receiver_id", "to_id", "user_id", "recipient_id"],
        ),
      );

      if (!senderLegacyId || !recipientLegacyId) {
        step.skipped += 1;
        continue;
      }

      const sender = memberRefs.get(senderLegacyId);
      const recipient = memberRefs.get(recipientLegacyId);

      if (!sender || !recipient) {
        step.skipped += 1;
        continue;
      }

      const body =
        pickValue(row, ["message", "mail_message", "msg", "body"]) ??
        pickValue(row, ["subject", "mail_subject"]) ??
        "";

      if (!body.trim()) {
        step.skipped += 1;
        continue;
      }

      const firstLegacyId = Math.min(senderLegacyId, recipientLegacyId);
      const secondLegacyId = Math.max(senderLegacyId, recipientLegacyId);
      const key = `${firstLegacyId}:${secondLegacyId}`;
      const sentAt =
        parseDate(pickValue(row, ["sendtime", "sent_at", "created_at"])) ?? new Date();
      const existing = conversations.get(key);

      if (existing) {
        if (sentAt < existing.createdAt) {
          existing.createdAt = sentAt;
        }
        continue;
      }

      const firstRef = memberRefs.get(firstLegacyId)!;
      const secondRef = memberRefs.get(secondLegacyId)!;
      conversations.set(key, {
        id: `legacy-conversation-${firstLegacyId}-${secondLegacyId}`,
        firstLegacyId,
        secondLegacyId,
        firstUserId: firstRef.userId,
        secondUserId: secondRef.userId,
        firstMemberProfileId: firstRef.memberProfileId,
        secondMemberProfileId: secondRef.memberProfileId,
        createdAt: sentAt,
      });
    }

    const conversationRows: Prisma.ConversationCreateManyInput[] = [];
    const participantRows: Prisma.ConversationParticipantCreateManyInput[] = [];

    for (const conversation of conversations.values()) {
      conversationRows.push({
        id: conversation.id,
        type: ConversationType.MEMBER_TO_MEMBER,
        createdAt: conversation.createdAt,
        updatedAt: conversation.createdAt,
      });
      participantRows.push({
        id: `legacy-conversation-participant-${conversation.firstLegacyId}-${conversation.secondLegacyId}-${conversation.firstLegacyId}`,
        conversationId: conversation.id,
        userId: conversation.firstUserId,
        memberProfileId: conversation.firstMemberProfileId,
        joinedAt: conversation.createdAt,
        isActive: true,
      });
      participantRows.push({
        id: `legacy-conversation-participant-${conversation.firstLegacyId}-${conversation.secondLegacyId}-${conversation.secondLegacyId}`,
        conversationId: conversation.id,
        userId: conversation.secondUserId,
        memberProfileId: conversation.secondMemberProfileId,
        joinedAt: conversation.createdAt,
        isActive: true,
      });
    }

    report.metrics.mailboxConversations = conversations.size;

    for (const chunk of chunked(conversationRows, BATCH_SIZE)) {
      await prisma.conversation.createMany({ data: chunk, skipDuplicates: true });
    }
    for (const chunk of chunked(participantRows, BATCH_SIZE)) {
      await prisma.conversationParticipant.createMany({ data: chunk, skipDuplicates: true });
    }

    step.updated = conversations.size;
    step.imported = 0;
    step.processed = 0;

    const messageRows: Prisma.MessageCreateManyInput[] = [];
    const seenMessageIds = new Set<string>();

    async function flushMessages() {
      await flushCreateMany(messageRows, async (payload) => {
        await prisma.message.createMany({ data: payload, skipDuplicates: true });
      });
    }

    for await (const row of iterateMysqlBatchTsvRows(filePath)) {
      step.processed += 1;
      maybeLogProgress("mailbox_messages:load", step.processed, {
        bufferedMessages: messageRows.length,
      });

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

      const body =
        pickValue(row, ["message", "mail_message", "msg", "body"]) ??
        pickValue(row, ["subject", "mail_subject"]) ??
        "";

      if (!body.trim()) {
        step.skipped += 1;
        continue;
      }

      const legacyKey = legacyId.toString();
      if (seenMessageIds.has(legacyKey)) {
        step.skipped += 1;
        continue;
      }

      seenMessageIds.add(legacyKey);
      const firstLegacyId = Math.min(senderLegacyId, recipientLegacyId);
      const secondLegacyId = Math.max(senderLegacyId, recipientLegacyId);
      const conversationId = `legacy-conversation-${firstLegacyId}-${secondLegacyId}`;
      const sentAt =
        parseDate(pickValue(row, ["sendtime", "sent_at", "created_at"])) ?? new Date();
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
      let readAt =
        parseDate(pickValue(row, ["read_at", "readtime", "seen_at"])) ?? undefined;
      let deliveredAt =
        parseDate(pickValue(row, ["delivered_at", "delivertime"])) ?? undefined;

      if (!readAt && recipientRead) {
        readAt = sentAt;
      }

      if (!deliveredAt) {
        deliveredAt = sentAt;
      }

      messageRows.push({
        id: messageId(legacyId),
        legacyId,
        conversationId,
        senderUserId: sender.userId,
        senderMemberProfileId: sender.memberProfileId,
        body,
        attachmentPath: attachmentPath ?? undefined,
        sentAt,
        deliveredAt,
        readAt,
      });
      step.imported += 1;

      if (messageRows.length >= BATCH_SIZE) {
        await flushMessages();
      }
    }

    await flushMessages();
  });

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ success: true, outputPath, report }, null, 2));
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : "Legacy bulk load failed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
