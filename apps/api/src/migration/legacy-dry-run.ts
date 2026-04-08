import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import { iterateMysqlBatchTsvRows, type RowRecord } from "./legacy-tsv";

type TableSummary = {
  file: string;
  exists: boolean;
  rowCount: number;
  columns: string[];
};

type CountMap = Map<string, number>;

type Analyzer = {
  onRow: (row: RowRecord) => void;
  toJson: () => Record<string, unknown>;
};

const expectedFiles = [
  "tbl_user.tsv",
  "tbl_partnerprofile.tsv",
  "tbl_usersnaps.tsv",
  "tbl_picture_request.tsv",
  "tbl_favourite_ignore.tsv",
  "tbl_views_winks.tsv",
  "tbl_mailbox_recent.tsv",
  "tbl_payment.tsv",
  "tbl_membership.tsv",
  "coupons.tsv",
  "coupon_redemptions.tsv",
  "tbl_ghotok.tsv",
  "tbl_ghotok_user.tsv",
  "tbl_ghotok_credit_wallet.tsv",
  "tbl_ghotok_credit_txn.tsv",
  "tbl_dir_business.tsv",
  "tbl_user_guestlist.tsv",
  "tbl_admin.tsv",
  "table_inventory.tsv",
];

function increment(counter: CountMap, key: string) {
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

function toSortedEntries(counter: CountMap, limit = 10) {
  return Array.from(counter.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
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

function normalizeGender(value: string | null) {
  if (!value) {
    return "UNKNOWN";
  }

  const normalized = value.trim().toLowerCase();

  if (["m", "male", "man", "groom"].includes(normalized)) {
    return "MAN";
  }

  if (["f", "female", "woman", "bride"].includes(normalized)) {
    return "WOMAN";
  }

  return value.trim().toUpperCase();
}

function normalizeProfileStatus(value: string | null) {
  if (!value) {
    return "UNKNOWN";
  }

  const normalized = value.trim().toLowerCase();

  if (["active", "1", "approved"].includes(normalized)) {
    return "ACTIVE";
  }

  if (["approval", "pending", "incomplete"].includes(normalized)) {
    return "PENDING_REVIEW";
  }

  if (["cancel", "cancelled"].includes(normalized)) {
    return "CANCELLED";
  }

  if (["delete", "deleted"].includes(normalized)) {
    return "DELETED";
  }

  return value.trim().toUpperCase();
}

async function analyzeTsvFile(filePath: string, analyzer?: Analyzer) {
  let rowCount = 0;
  let columns: string[] = [];

  for await (const row of iterateMysqlBatchTsvRows(filePath)) {
    if (!columns.length) {
      columns = Object.keys(row);
    }
    rowCount += 1;
    analyzer?.onRow(row);
  }

  return {
    rowCount,
    columns,
  };
}

function createUsersAnalyzer() {
  const statuses = new Map<string, number>();
  const genders = new Map<string, number>();
  const countries = new Map<string, number>();
  const missingEmailLegacyIds: string[] = [];
  const samples: Array<Record<string, unknown>> = [];
  let activeLikeCount = 0;

  return {
    onRow(row: RowRecord) {
      const legacyId = pickValue(row, ["id", "user_id"]) ?? "unknown";
      const status = normalizeProfileStatus(
        pickValue(row, ["status", "active", "profile_status"]),
      );
      const gender = normalizeGender(
        pickValue(row, ["gender", "sex", "user_gender"]),
      );
      const email = pickValue(row, ["email", "emailid", "email_id"]);
      const currentCountryCode = pickValue(row, [
        "current_country",
        "present_country",
        "country",
        "country_code",
      ]);

      increment(statuses, status);
      increment(genders, gender);

      if (currentCountryCode) {
        increment(countries, currentCountryCode.toUpperCase());
      }

      if (!email) {
        missingEmailLegacyIds.push(legacyId);
      }

      if (status === "ACTIVE") {
        activeLikeCount += 1;
      }

      if (samples.length < 5) {
        samples.push({
          legacyId,
          email,
          publicName:
            pickValue(row, ["firstname", "first_name", "fname"]) ??
            pickValue(row, ["displayname", "display_name", "username"]),
          gender,
          lookingFor: normalizeGender(
            pickValue(row, ["looking_for", "lookingfor", "partner_gender"]),
          ),
          status,
          currentCountryCode,
          religion: pickValue(row, ["religion", "religion_name"]),
          profession: pickValue(row, ["profession", "occupation"]),
        });
      }
    },
    toJson() {
      return {
        activeLikeCount,
        missingEmailCount: missingEmailLegacyIds.length,
        missingEmailSampleLegacyIds: missingEmailLegacyIds.slice(0, 20),
        statuses: toSortedEntries(statuses),
        genders: toSortedEntries(genders),
        countries: toSortedEntries(countries),
        samples,
      };
    },
  } satisfies Analyzer;
}

function createMediaAnalyzer() {
  const privacyModes = new Map<string, number>();
  const missingPaths: string[] = [];
  let primaryLikeCount = 0;

  return {
    onRow(row: RowRecord) {
      const legacyId = pickValue(row, ["id", "snap_id"]) ?? "unknown";
      const privacy = pickValue(row, [
        "privacy",
        "private",
        "photo_privacy",
        "visible_to_public",
      ]);
      const pathValue = pickValue(row, [
        "image",
        "photo",
        "img",
        "userfile",
        "user_img",
        "filename",
        "snap",
      ]);
      const isPrimary = pickValue(row, [
        "defaultpic",
        "is_primary",
        "primary_photo",
        "main_photo",
      ]);

      increment(privacyModes, privacy ? privacy.toUpperCase() : "UNKNOWN");

      if (!pathValue) {
        missingPaths.push(legacyId);
      }

      if (["1", "yes", "true"].includes((isPrimary ?? "").toLowerCase())) {
        primaryLikeCount += 1;
      }
    },
    toJson() {
      return {
        primaryLikeCount,
        missingPathCount: missingPaths.length,
        missingPathSampleLegacyIds: missingPaths.slice(0, 20),
        privacyModes: toSortedEntries(privacyModes),
      };
    },
  } satisfies Analyzer;
}

function createMailboxAnalyzer() {
  const sendersMissing = new Map<string, number>();
  let unreadLikeCount = 0;
  const samples: Array<Record<string, unknown>> = [];

  return {
    onRow(row: RowRecord) {
      const sender = pickValue(row, ["senderid", "fromid", "sendid", "from_id"]);
      const recipient = pickValue(row, ["receiverid", "toid", "recid", "to_id"]);
      const subject = pickValue(row, ["subject", "mail_subject"]);
      const body = pickValue(row, ["message", "body", "mailbody", "content"]);
      const status = pickValue(row, ["status", "readstatus", "mail_status"]);

      if (!sender || !recipient) {
        increment(
          sendersMissing,
          !sender && !recipient ? "missing_both" : !sender ? "missing_sender" : "missing_recipient",
        );
      }

      if (status && ["0", "unread", "new"].includes(status.toLowerCase())) {
        unreadLikeCount += 1;
      }

      if (samples.length < 5) {
        samples.push({
          sender,
          recipient,
          subject,
          bodyPreview: body?.slice(0, 120) ?? null,
          status,
          sendtime: pickValue(row, ["sendtime", "created_at", "timestamp"]),
        });
      }
    },
    toJson() {
      return {
        unreadLikeCount,
        participantIssues: toSortedEntries(sendersMissing),
        samples,
      };
    },
  } satisfies Analyzer;
}

function createPaymentAnalyzer() {
  const statuses = new Map<string, number>();
  const gateways = new Map<string, number>();
  let totalAmount = 0;
  let missingAmountCount = 0;

  return {
    onRow(row: RowRecord) {
      const status = pickValue(row, ["status", "payment_status"]) ?? "UNKNOWN";
      const gateway =
        pickValue(row, ["payment_method", "paymethod", "gateway", "payment_gateway"]) ??
        "UNKNOWN";
      const amountRaw = pickValue(row, [
        "amount",
        "paid_amount",
        "payment_amount",
        "total_amount",
        "membership_fee",
      ]);
      const amount = amountRaw ? Number(amountRaw) : Number.NaN;

      increment(statuses, status.toUpperCase());
      increment(gateways, gateway.toUpperCase());

      if (Number.isFinite(amount)) {
        totalAmount += amount;
      } else {
        missingAmountCount += 1;
      }
    },
    toJson() {
      return {
        totalAmount: Number(totalAmount.toFixed(2)),
        missingAmountCount,
        statuses: toSortedEntries(statuses),
        gateways: toSortedEntries(gateways),
      };
    },
  } satisfies Analyzer;
}

function createSimpleEntityAnalyzer(
  sampleFields: string[],
  label: string,
): Analyzer {
  const statuses = new Map<string, number>();
  const samples: Array<Record<string, unknown>> = [];

  return {
    onRow(row: RowRecord) {
      const status = pickValue(row, ["status", `${label}_status`]) ?? "UNKNOWN";
      increment(statuses, status.toUpperCase());

      if (samples.length < 5) {
        samples.push(
          Object.fromEntries(
            sampleFields.map((field) => [field, pickValue(row, [field])]),
          ),
        );
      }
    },
    toJson() {
      return {
        statuses: toSortedEntries(statuses),
        samples,
      };
    },
  };
}

async function readTargetSnapshot() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma = new PrismaClient();

  try {
    const [
      users,
      memberProfiles,
      partnerPreferences,
      profileMedia,
      messages,
      payments,
      ghotoks,
      vendors,
      weddingGuests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.memberProfile.count(),
      prisma.partnerPreference.count(),
      prisma.profileMedia.count(),
      prisma.message.count(),
      prisma.payment.count(),
      prisma.ghotokProfile.count(),
      prisma.vendorProfile.count(),
      prisma.weddingGuestEntry.count(),
    ]);

    return {
      users,
      memberProfiles,
      partnerPreferences,
      profileMedia,
      messages,
      payments,
      ghotoks,
      vendors,
      weddingGuests,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const sourceDir = path.resolve(process.argv[2] ?? process.env.LEGACY_EXPORT_DIR ?? "");

  if (!sourceDir) {
    console.error("Usage: npm run migration:legacy:dry-run -- <legacy-export-dir> [output-file]");
    process.exit(1);
  }

  const outputFile = path.resolve(
    process.argv[3] ??
      process.env.LEGACY_REPORT_OUTPUT ??
      path.join(sourceDir, "legacy-dry-run-report.json"),
  );

  const analyzerMap: Record<string, Analyzer> = {
    "tbl_user.tsv": createUsersAnalyzer(),
    "tbl_usersnaps.tsv": createMediaAnalyzer(),
    "tbl_mailbox_recent.tsv": createMailboxAnalyzer(),
    "tbl_payment.tsv": createPaymentAnalyzer(),
    "tbl_ghotok.tsv": createSimpleEntityAnalyzer(
      ["id", "name", "email", "phone", "status"],
      "ghotok",
    ),
    "tbl_dir_business.tsv": createSimpleEntityAnalyzer(
      ["id", "company_name", "business_name", "email", "phone", "status"],
      "vendor",
    ),
    "tbl_admin.tsv": createSimpleEntityAnalyzer(
      ["id", "username", "email", "status"],
      "admin",
    ),
  };

  const exportedTables: Record<string, TableSummary> = {};

  for (const fileName of expectedFiles) {
    const filePath = path.join(sourceDir, fileName);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      exportedTables[fileName] = {
        file: fileName,
        exists: false,
        rowCount: 0,
        columns: [],
      };
      continue;
    }

    const summary = await analyzeTsvFile(filePath, analyzerMap[fileName]);
    exportedTables[fileName] = {
      file: fileName,
      exists: true,
      rowCount: summary.rowCount,
      columns: summary.columns,
    };
  }

  const transforms = Object.fromEntries(
    Object.entries(analyzerMap).map(([fileName, analyzer]) => [
      fileName.replace(/\.tsv$/, ""),
      analyzer.toJson(),
    ]),
  );

  const targetSnapshot = await readTargetSnapshot();
  const recommendations: string[] = [];

  const userTransform = transforms.tbl_user as Record<string, unknown> | undefined;
  const mediaTransform = transforms.tbl_usersnaps as Record<string, unknown> | undefined;
  const mailboxTransform = transforms.tbl_mailbox_recent as Record<string, unknown> | undefined;
  const userMissingEmailCount = Number(userTransform?.missingEmailCount ?? 0);
  const mediaMissingPathCount = Number(mediaTransform?.missingPathCount ?? 0);

  if (userMissingEmailCount > 0) {
    recommendations.push("Prepare a password-reset and email-remediation path for legacy users missing valid email.");
  }

  if (mediaMissingPathCount > 0) {
    recommendations.push("Generate a media missing report and flag affected profiles for admin review during migration.");
  }

  if (
    Array.isArray(mailboxTransform?.participantIssues) &&
    (mailboxTransform.participantIssues as Array<{ count: number }>).some((item) => item.count > 0)
  ) {
    recommendations.push("Review mailbox rows with missing sender or recipient IDs before importing the last 6 months of messages.");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    exportedTables,
    transforms,
    targetSnapshot,
    recommendations,
  };

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify({
    outputFile,
    exportedFiles: Object.values(exportedTables).filter((item) => item.exists).length,
    recommendations: recommendations.length,
  }, null, 2));
}

void main();
