/**
 * Cleanup orphaned ProfileMedia records.
 *
 * Problem: The photo migration created ProfileMedia DB records for all legacy
 * profiles that had photo references in the old DB. But only ~30K of those
 * files actually exist in GCS. The remaining ~22K records point to non-existent
 * files, causing the "Photo only" filter to over-count.
 *
 * Solution: Read the list of member IDs that have real files in GCS,
 * then delete ProfileMedia records for members NOT in that list.
 *
 * Usage:
 *   # Dry run (default)
 *   npx tsx scripts/cleanup-orphan-photos.ts
 *
 *   # Actually delete
 *   npx tsx scripts/cleanup-orphan-photos.ts --execute
 *
 * Requires DATABASE_URL env var.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = !process.argv.includes("--execute");

async function main() {
  console.log(`\n=== Orphaned ProfileMedia Cleanup ${DRY_RUN ? "(DRY RUN)" : "(EXECUTING)"} ===\n`);

  // Read the list of member IDs with real files in GCS
  const idsFile = "/tmp/gcs_member_ids.txt";
  if (!fs.existsSync(idsFile)) {
    console.error(`Missing ${idsFile} — run this first:`);
    console.error(`gsutil ls "gs://punorupa-borbodhu-media-test/legacy/uploads/" | grep "l[0-9]" | sed 's|.*/l\\([0-9]*\\)_.*|\\1|' | sort -u > /tmp/gcs_member_ids.txt`);
    process.exit(1);
  }

  const validMemberIds = new Set(
    fs.readFileSync(idsFile, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  console.log(`Valid member IDs with GCS files: ${validMemberIds.size}`);

  const prisma = new PrismaClient();

  try {
    // Find all legacy ProfileMedia records (storagePath starts with "legacy/")
    const legacyMedia = await prisma.profileMedia.findMany({
      where: {
        storagePath: { startsWith: "legacy/" },
      },
      select: {
        id: true,
        storagePath: true,
        memberProfileId: true,
        memberProfile: {
          select: {
            displayId: true,
          },
        },
      },
    });

    console.log(`Total legacy ProfileMedia records: ${legacyMedia.length}`);

    // Extract member number from displayId (e.g., "m-82643" -> "82643")
    const orphaned = legacyMedia.filter((media) => {
      const displayId = media.memberProfile?.displayId ?? "";
      const match = displayId.match(/m-(\d+)/);
      if (!match) return false; // skip non-legacy
      return !validMemberIds.has(match[1]);
    });

    console.log(`Orphaned records (no GCS file): ${orphaned.length}`);
    console.log(`Valid records (file exists):     ${legacyMedia.length - orphaned.length}`);

    if (orphaned.length === 0) {
      console.log("\nNo orphaned records found. Nothing to do.");
      return;
    }

    // Show sample of orphans
    console.log(`\nSample orphaned records:`);
    for (const m of orphaned.slice(0, 5)) {
      console.log(`  ${m.memberProfile?.displayId} -> ${m.storagePath}`);
    }

    if (DRY_RUN) {
      console.log(`\n[DRY RUN] Would delete ${orphaned.length} orphaned ProfileMedia records.`);
      console.log(`Run with --execute to actually delete.`);
      return;
    }

    // Delete in batches
    const batchSize = 500;
    const orphanIds = orphaned.map((m) => m.id);
    let deleted = 0;

    for (let i = 0; i < orphanIds.length; i += batchSize) {
      const batch = orphanIds.slice(i, i + batchSize);
      const result = await prisma.profileMedia.deleteMany({
        where: { id: { in: batch } },
      });
      deleted += result.count;
      if ((i / batchSize) % 10 === 0) {
        console.log(`  Deleted ${deleted}/${orphanIds.length}...`);
      }
    }

    console.log(`\n✅ Deleted ${deleted} orphaned ProfileMedia records.`);
    console.log(`Remaining valid legacy media: ${legacyMedia.length - deleted}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
