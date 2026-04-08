/**
 * Backfill missing profile fields from legacy TSV data.
 * Usage: DATABASE_URL="..." node scripts/backfill-profile-fields.js
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();
const TSV_PATH = "data/legacy_snapshot_20260322_160735/tbl_user.tsv";

function isBlank(v) {
  if (!v) return true;
  const t = v.trim();
  return t === "" || t === "NULL" || t === "0" || t === "Select";
}

function parseIntSafe(v) {
  if (isBlank(v)) return null;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? null : n;
}

async function processBatch(batch) {
  let updated = 0;
  let notFound = 0;
  const promises = batch.map(async ({ legacyId, data }) => {
    try {
      await prisma.memberProfile.update({ where: { legacyId }, data });
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

async function main() {
  const raw = fs.readFileSync(TSV_PATH, "utf-8");
  const lines = raw.split("\n");
  const headers = lines[0].split("\t").map((h) => h.trim());

  const col = (name) => headers.indexOf(name);
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

  let updated = 0, skipped = 0, notFound = 0;
  const batchSize = 200;
  let batch = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const legacyId = parseInt(cols[idIdx], 10);
    if (isNaN(legacyId)) continue;

    const data = {};

    const mstatus = cols[mstatusIdx];
    const children = cols[childrenIdx];
    const height = cols[heightIdx];
    const bodytype = cols[bodytypeIdx];
    const complexion = cols[complexionIdx];
    const bloodgroup = cols[bloodgroupIdx];
    const father = cols[fatherIdx];
    const mother = cols[motherIdx];
    const sisters = cols[sistersIdx];
    const brothers = cols[brothersIdx];

    if (!isBlank(mstatus)) data.maritalStatus = mstatus.trim();
    if (!isBlank(children)) data.childrenStatus = children.trim();
    if (!isBlank(height)) {
      const h = parseInt(height.trim(), 10);
      if (!isNaN(h) && h > 100 && h < 250) data.heightCm = h;
    }
    if (!isBlank(bodytype)) data.bodyType = bodytype.trim();
    if (!isBlank(complexion)) data.complexion = complexion.trim();
    if (!isBlank(bloodgroup)) data.bloodGroup = bloodgroup.trim();
    if (!isBlank(father)) data.fatherStatus = father.trim();
    if (!isBlank(mother)) data.motherStatus = mother.trim();
    const sn = parseIntSafe(sisters);
    if (sn !== null && sn >= 0 && sn <= 20) data.sistersCount = sn;
    const bn = parseIntSafe(brothers);
    if (bn !== null && bn >= 0 && bn <= 20) data.brothersCount = bn;

    if (Object.keys(data).length === 0) { skipped++; continue; }

    batch.push({ legacyId, data });

    if (batch.length >= batchSize) {
      const r = await processBatch(batch);
      updated += r.updated;
      notFound += r.notFound;
      if (updated % 5000 < batchSize) {
        console.log(`Progress: ${updated} updated, ${notFound} not found, ${skipped} skipped (row ${i}/${lines.length})`);
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    const r = await processBatch(batch);
    updated += r.updated;
    notFound += r.notFound;
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Skipped (no data): ${skipped}`);
  await prisma.$disconnect();
}

main().catch(console.error);
