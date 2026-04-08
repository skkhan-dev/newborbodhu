/**
 * Backfill missing profile fields from legacy TSV data.
 * Fields: maritalStatus, childrenStatus, height, bodyType, complexion,
 *         bloodGroup, fatherStatus, motherStatus, sistersCount, brothersCount
 *
 * Usage: npx ts-node scripts/backfill-profile-fields.ts
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const TSV_PATH = "data/legacy_snapshot_20260322_160735/tbl_user.tsv";

function isBlank(v: string | undefined | null): boolean {
  if (!v) return true;
  const t = v.trim();
  return t === "" || t === "NULL" || t === "0" || t === "Select";
}

function parseIntSafe(v: string | undefined | null): number | null {
  if (isBlank(v)) return null;
  const n = parseInt(v!.trim(), 10);
  return isNaN(n) ? null : n;
}

async function main() {
  const raw = fs.readFileSync(TSV_PATH, "utf-8");
  const lines = raw.split("\n");
  const headers = lines[0].split("\t").map((h) => h.trim());

  // Map column names to indices
  const col = (name: string) => headers.indexOf(name);
  const idIdx = col("id");
  const mstatusIdx = col("mstatus");
  const childrenIdx = col("children");
  const heightIdx = col("height");
  const bodytypeIdx = col("bodytype");
  const complexionIdx = col("complexion");
  const bloodgroupIdx = col("bloodgroup");
  const fatherIdx = col("father");
  const motherIdx = col("mother");
  const sistersIdx = col("sisters");
  const brothersIdx = col("brothers");

  console.log("Column indices:", {
    id: idIdx, mstatus: mstatusIdx, children: childrenIdx,
    height: heightIdx, bodytype: bodytypeIdx, complexion: complexionIdx,
    bloodgroup: bloodgroupIdx, father: fatherIdx, mother: motherIdx,
    sisters: sistersIdx, brothers: brothersIdx,
  });

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const batchSize = 500;
  let batch: Array<{ legacyId: number; data: Record<string, unknown> }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const legacyId = parseInt(cols[idIdx], 10);
    if (isNaN(legacyId)) continue;

    const mstatus = cols[mstatusIdx]?.trim();
    const children = cols[childrenIdx]?.trim();
    const height = cols[heightIdx]?.trim();
    const bodytype = cols[bodytypeIdx]?.trim();
    const complexion = cols[complexionIdx]?.trim();
    const bloodgroup = cols[bloodgroupIdx]?.trim();
    const father = cols[fatherIdx]?.trim();
    const mother = cols[motherIdx]?.trim();
    const sisters = cols[sistersIdx]?.trim();
    const brothers = cols[brothersIdx]?.trim();

    const data: Record<string, unknown> = {};

    if (!isBlank(mstatus)) data.maritalStatus = mstatus;
    if (!isBlank(children)) data.childrenStatus = children;
    if (!isBlank(height)) {
      const h = parseInt(height!, 10);
      if (!isNaN(h) && h > 100 && h < 250) data.heightCm = h;
    }
    if (!isBlank(bodytype)) data.bodyType = bodytype;
    if (!isBlank(complexion)) data.complexion = complexion;
    if (!isBlank(bloodgroup)) data.bloodGroup = bloodgroup;
    if (!isBlank(father)) data.fatherStatus = father;
    if (!isBlank(mother)) data.motherStatus = mother;
    if (!isBlank(sisters)) {
      const n = parseIntSafe(sisters);
      if (n !== null && n >= 0 && n <= 20) data.sistersCount = n;
    }
    if (!isBlank(brothers)) {
      const n = parseIntSafe(brothers);
      if (n !== null && n >= 0 && n <= 20) data.brothersCount = n;
    }

    if (Object.keys(data).length === 0) {
      skipped++;
      continue;
    }

    batch.push({ legacyId, data });

    if (batch.length >= batchSize) {
      const results = await processBatch(batch);
      updated += results.updated;
      notFound += results.notFound;
      if (updated % 5000 < batchSize) {
        console.log(`Progress: ${updated} updated, ${notFound} not found, ${skipped} skipped (row ${i}/${lines.length})`);
      }
      batch = [];
    }
  }

  // Process remaining
  if (batch.length > 0) {
    const results = await processBatch(batch);
    updated += results.updated;
    notFound += results.notFound;
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Skipped (no data): ${skipped}`);
  await prisma.$disconnect();
}

async function processBatch(
  batch: Array<{ legacyId: number; data: Record<string, unknown> }>
): Promise<{ updated: number; notFound: number }> {
  let updated = 0;
  let notFound = 0;

  // Process in parallel with Promise.allSettled
  const promises = batch.map(async ({ legacyId, data }) => {
    try {
      await prisma.memberProfile.update({
        where: { legacyId },
        data,
      });
      return true;
    } catch {
      return false;
    }
  });

  const results = await Promise.allSettled(promises);
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) updated++;
    else notFound++;
  }

  return { updated, notFound };
}

main().catch(console.error);
