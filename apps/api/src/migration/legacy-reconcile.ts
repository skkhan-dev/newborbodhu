import { PrismaClient, RoleKey } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  countMysqlBatchTsvMatches,
  countMysqlBatchTsvRows,
  iterateMysqlBatchTsvRows,
  type RowRecord,
} from "./legacy-tsv";

type CountSummary = {
  source: number | null;
  target: number | null;
  delta: number | null;
};

type ReconcileReport = {
  generatedAt: string;
  sourceDir: string;
  counts: {
    members: CountSummary;
    partnerPreferences: CountSummary;
    profileMedia: CountSummary;
    payments: CountSummary;
    ghotoks: CountSummary;
    ghotokLinks: CountSummary;
    vendors: CountSummary;
    admins: CountSummary;
    mailboxMessages: CountSummary;
    mailboxAttachments: CountSummary;
  };
  notes: string[];
};

const prisma = new PrismaClient();

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countTsvRows(filePath: string) {
  return countMysqlBatchTsvRows(filePath);
}

async function countTsvMatches(filePath: string, predicate: (row: RowRecord) => boolean) {
  return countMysqlBatchTsvMatches(filePath, predicate);
}

function pickValue(row: RowRecord, candidates: string[]) {
  for (const candidate of candidates) {
    const exact = row[candidate];

    if (exact !== undefined && exact !== null) {
      const normalized = String(exact).trim();

      if (normalized.length > 0) {
        return normalized;
      }
    }

    const matchedKey = Object.keys(row).find(
      (key) => key.toLowerCase() === candidate.toLowerCase(),
    );

    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      const normalized = String(row[matchedKey]).trim();

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return null;
}

function hasUsableStorageValue(value: string | null) {
  return Boolean(value && value.trim().length > 0 && value.trim().toLowerCase() !== "null");
}

function makeCountSummary(source: number | null, target: number | null): CountSummary {
  return {
    source,
    target,
    delta: source !== null && target !== null ? target - source : null,
  };
}

async function main() {
  const sourceDirArg = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!sourceDirArg) {
    throw new Error(
      "Usage: tsx src/migration/legacy-reconcile.ts <sourceDir> [outputPath]",
    );
  }

  const sourceDir = path.resolve(sourceDirArg);
  const outputPath = outputPathArg
    ? path.resolve(outputPathArg)
    : path.join(sourceDir, "legacy-reconcile-report.json");

  const usersFile = path.join(sourceDir, "tbl_user.tsv");
  const partnerFile = path.join(sourceDir, "tbl_partnerprofile.tsv");
  const mediaFile = path.join(sourceDir, "tbl_usersnaps.tsv");
  const paymentsFile = path.join(sourceDir, "tbl_payment.tsv");
  const ghotokFile = path.join(sourceDir, "tbl_ghotok.tsv");
  const ghotokLinksFile = path.join(sourceDir, "tbl_ghotok_user.tsv");
  const vendorFile = path.join(sourceDir, "tbl_dir_business.tsv");
  const adminFile = path.join(sourceDir, "tbl_admin.tsv");
  const canonicalMailboxFile = path.join(sourceDir, "tbl_mailbox_canonical.tsv");
  const rawMailboxFile = path.join(sourceDir, "tbl_mailbox.tsv");
  const mailboxFile = (await fileExists(canonicalMailboxFile))
    ? canonicalMailboxFile
    : rawMailboxFile;

  const sourceUserIds =
    (await fileExists(usersFile))
      ? await (async () => {
          const ids = new Set<string>();

          for await (const row of iterateMysqlBatchTsvRows(usersFile)) {
            const id = pickValue(row, ["id", "user_id"]);

            if (id) {
              ids.add(id);
            }
          }

          return ids;
        })()
      : null;

  const sourceGhotokIds =
    (await fileExists(ghotokFile))
      ? await (async () => {
          const ids = new Set<string>();

          for await (const row of iterateMysqlBatchTsvRows(ghotokFile)) {
            const id = pickValue(row, ["id", "ghotok_id"]);

            if (id) {
              ids.add(id);
            }
          }

          return ids;
        })()
      : null;

  const [
    sourceMembers,
    sourcePartnerPreferences,
    sourceProfileMedia,
    sourcePayments,
    sourceGhotoks,
    sourceGhotokLinks,
    sourceVendors,
    sourceAdmins,
    sourceMailboxMessages,
    sourceMailboxAttachments,
    targetMembers,
    targetPartnerPreferences,
    targetProfileMedia,
    targetPayments,
    targetGhotoks,
    targetGhotokLinks,
    targetVendors,
    targetAdmins,
    targetMailboxMessages,
    targetMailboxAttachments,
  ] = await Promise.all([
    fileExists(usersFile).then((exists) => (exists ? countTsvRows(usersFile) : null)),
    fileExists(partnerFile).then(async (exists) => {
      if (!exists || !sourceUserIds) {
        return null;
      }

      return countTsvMatches(partnerFile, (row) => {
        const memberId = pickValue(row, ["user_id", "userid", "member_id", "profile_id", "id"]);
        return Boolean(memberId && sourceUserIds.has(memberId));
      });
    }),
    fileExists(mediaFile).then(async (exists) => {
      if (!exists || !sourceUserIds) {
        return null;
      }

      return countTsvMatches(mediaFile, (row) => {
        const memberId = pickValue(row, ["user_id", "userid", "member_id"]);
        const storage = pickValue(
          row,
          ["picture", "image", "photo", "img", "userfile", "user_img", "filename", "snap"],
        );
        return Boolean(memberId && sourceUserIds.has(memberId) && hasUsableStorageValue(storage));
      });
    }),
    fileExists(paymentsFile).then((exists) => (exists ? countTsvRows(paymentsFile) : null)),
    fileExists(ghotokFile).then((exists) => (exists ? countTsvRows(ghotokFile) : null)),
    fileExists(ghotokLinksFile).then(async (exists) => {
      if (!exists || !sourceUserIds || !sourceGhotokIds) {
        return null;
      }

      return countTsvMatches(ghotokLinksFile, (row) => {
        const memberId = pickValue(row, ["user_id", "member_id", "userid"]);
        const ghotokId = pickValue(row, ["ghotok_id", "gid", "ghot_id"]);
        return Boolean(
          memberId &&
            ghotokId &&
            sourceUserIds.has(memberId) &&
            sourceGhotokIds.has(ghotokId),
        );
      });
    }),
    fileExists(vendorFile).then((exists) => (exists ? countTsvRows(vendorFile) : null)),
    fileExists(adminFile).then((exists) => (exists ? countTsvRows(adminFile) : null)),
    fileExists(mailboxFile).then(async (exists) => {
      if (!exists || !sourceUserIds) {
        return null;
      }

      return countTsvMatches(mailboxFile, (row) => {
        const sender = pickValue(row, [
          "senderid",
          "sender_id",
          "from_id",
          "send_by",
          "userid",
        ]);
        const recipient = pickValue(row, [
          "recipientid",
          "receiver_id",
          "to_id",
          "user_id",
          "recipient_id",
        ]);
        const body =
          pickValue(row, ["message", "mail_message", "msg", "body"]) ??
          pickValue(row, ["subject", "mail_subject"]) ??
          "";

        return Boolean(
          sender &&
            recipient &&
            sourceUserIds.has(sender) &&
            sourceUserIds.has(recipient) &&
            body.trim(),
        );
      });
    }),
    fileExists(mailboxFile).then(async (exists) => {
      if (!exists || !sourceUserIds) {
        return null;
      }

      return countTsvMatches(mailboxFile, (row) => {
        const sender = pickValue(row, [
          "senderid",
          "sender_id",
          "from_id",
          "send_by",
          "userid",
        ]);
        const recipient = pickValue(row, [
          "recipientid",
          "receiver_id",
          "to_id",
          "user_id",
          "recipient_id",
        ]);
        const body =
          pickValue(row, ["message", "mail_message", "msg", "body"]) ??
          pickValue(row, ["subject", "mail_subject"]) ??
          "";
        const attachment = pickValue(row, [
          "orig_filename1",
          "attachment_path",
          "attachment_name",
        ]);

        return Boolean(
          sender &&
            recipient &&
            sourceUserIds.has(sender) &&
            sourceUserIds.has(recipient) &&
            body.trim() &&
            hasUsableStorageValue(attachment),
        );
      });
    }),
    prisma.memberProfile.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.partnerPreference.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.profileMedia.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.payment.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.ghotokProfile.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.ghotokMemberLink.count({
      where: {
        memberProfile: {
          legacyId: {
            not: null,
          },
        },
        ghotokProfile: {
          legacyId: {
            not: null,
          },
        },
      },
    }),
    prisma.vendorProfile.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.adminUser.count({
      where: {
        legacyId: {
          not: null,
        },
        user: {
          roles: {
            some: {
              role: {
                in: [RoleKey.ADMIN, RoleKey.SUPER_ADMIN],
              },
            },
          },
        },
      },
    }),
    prisma.message.count({
      where: {
        legacyId: {
          not: null,
        },
      },
    }),
    prisma.message.count({
      where: {
        legacyId: {
          not: null,
        },
        attachmentPath: {
          not: null,
        },
      },
    }),
  ]);

  const notes: string[] = [];

  if (!(await fileExists(canonicalMailboxFile)) && (await fileExists(rawMailboxFile))) {
    notes.push(
      "Canonical mailbox export was not found, so mailbox reconciliation used the raw mailbox row count.",
    );
  }

  const report: ReconcileReport = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    counts: {
      members: makeCountSummary(sourceMembers, targetMembers),
      partnerPreferences: makeCountSummary(
        sourcePartnerPreferences,
        targetPartnerPreferences,
      ),
      profileMedia: makeCountSummary(sourceProfileMedia, targetProfileMedia),
      payments: makeCountSummary(sourcePayments, targetPayments),
      ghotoks: makeCountSummary(sourceGhotoks, targetGhotoks),
      ghotokLinks: makeCountSummary(sourceGhotokLinks, targetGhotokLinks),
      vendors: makeCountSummary(sourceVendors, targetVendors),
      admins: makeCountSummary(sourceAdmins, targetAdmins),
      mailboxMessages: makeCountSummary(sourceMailboxMessages, targetMailboxMessages),
      mailboxAttachments: makeCountSummary(
        sourceMailboxAttachments,
        targetMailboxAttachments,
      ),
    },
    notes,
  };

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Legacy reconciliation failed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
