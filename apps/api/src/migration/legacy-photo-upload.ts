/**
 * Legacy Photo Upload Script
 *
 * Uploads legacy member photos from the local filesystem to GCS.
 * ProfileMedia records already exist with storagePath like "legacy/uploads/l82643_46170_1.jpg"
 * but the actual files haven't been uploaded to the GCS bucket.
 *
 * Usage:
 *   npx tsx apps/api/src/migration/legacy-photo-upload.ts --dry-run
 *   npx tsx apps/api/src/migration/legacy-photo-upload.ts
 */

import { PrismaClient, MediaApprovalStatus, MediaPrivacyMode } from "@prisma/client";
import { Storage } from "@google-cloud/storage";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const storage = new Storage();
const BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "punorupa-borbodhu-media-test";
const LOCAL_DIR = path.resolve(__dirname, "../../../../data/legacy_media_20260322");
const BATCH_SIZE = 200;
const CONCURRENCY = 20;

const dryRun = process.argv.includes("--dry-run");

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function inferContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg": case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    case ".pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

async function uploadFile(localPath: string, gcsPath: string): Promise<boolean> {
  const bucket = storage.bucket(BUCKET_NAME);
  const gcsFile = bucket.file(gcsPath);

  // Check if already uploaded
  const [exists] = await gcsFile.exists();
  if (exists) return false; // skip

  if (dryRun) {
    console.log(`  DRY RUN: ${localPath} -> gs://${BUCKET_NAME}/${gcsPath}`);
    return true;
  }

  await bucket.upload(localPath, {
    destination: gcsPath,
    metadata: { contentType: inferContentType(localPath) },
  });
  return true;
}

async function main() {
  console.log(`\n=== Legacy Photo Upload ${dryRun ? "(DRY RUN)" : ""} ===`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Local dir: ${LOCAL_DIR}\n`);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalMissing = 0;
  let totalErrors = 0;

  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.profileMedia.findMany({
      where: {
        storagePath: { startsWith: "legacy/" },
      },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      select: { id: true, storagePath: true, memberProfileId: true },
    });

    if (!batch.length) break;
    cursor = batch[batch.length - 1].id;

    // Process in parallel chunks
    const chunks = chunkArray(batch, CONCURRENCY);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (media) => {
          totalProcessed++;

          // Derive local path from storagePath
          // storagePath: "legacy/uploads/l82643_46170_1.jpg" -> local: "data/.../uploads/l82643_46170_1.jpg"
          const relativePath = media.storagePath.replace(/^legacy\//, "");
          const localPath = path.join(LOCAL_DIR, relativePath);

          try {
            await fs.access(localPath);
          } catch {
            totalMissing++;
            return;
          }

          try {
            const uploaded = await uploadFile(localPath, media.storagePath);
            if (uploaded) {
              totalUploaded++;
            } else {
              totalSkipped++;
            }
          } catch (err) {
            totalErrors++;
            console.error(`  ERROR uploading ${media.storagePath}: ${err}`);
          }
        }),
      );
    }

    console.log(
      `Progress: processed=${totalProcessed}, uploaded=${totalUploaded}, ` +
        `skipped=${totalSkipped}, missing=${totalMissing}, errors=${totalErrors}`,
    );
  }

  console.log(`\n--- Upload Complete ---`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Uploaded: ${totalUploaded}`);
  console.log(`Already in GCS: ${totalSkipped}`);
  console.log(`Missing locally: ${totalMissing}`);
  console.log(`Errors: ${totalErrors}`);

  // Phase 2: Set isPrimary and approve
  if (!dryRun) {
    console.log(`\n--- Setting isPrimary & approval status ---`);
    await setFirstPhotoPrimary();
  }

  await prisma.$disconnect();
  console.log(`\nDone.`);
}

async function setFirstPhotoPrimary() {
  // Get all distinct memberProfileIds that have media
  const members = await prisma.profileMedia.groupBy({
    by: ["memberProfileId"],
    where: { mediaType: "PROFILE_PHOTO" },
  });

  console.log(`Found ${members.length} members with photos.`);

  let updated = 0;
  const chunks = chunkArray(members, 100);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async ({ memberProfileId }) => {
        // Set first photo as primary + approved + public
        const firstPhoto = await prisma.profileMedia.findFirst({
          where: { memberProfileId, mediaType: "PROFILE_PHOTO" },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (!firstPhoto) return;

        await prisma.profileMedia.update({
          where: { id: firstPhoto.id },
          data: {
            isPrimary: true,
            approvalStatus: MediaApprovalStatus.APPROVED,
            privacyMode: MediaPrivacyMode.PUBLIC,
          },
        });
        updated++;
      }),
    );
  }

  console.log(`Set isPrimary for ${updated} members.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
