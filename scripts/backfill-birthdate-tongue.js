/**
 * Backfill missing birthDate and motherTongue from legacy TSV data.
 * Usage: NODE_PATH=apps/api/node_modules DATABASE_URL="..." node scripts/backfill-birthdate-tongue.js
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

function parseDate(v) {
  if (isBlank(v)) return null;
  const d = new Date(v.trim());
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 1940 || d.getFullYear() > 2010) return null;
  return d;
}

async function processBatch(batch) {
  let updated = 0, notFound = 0;
  const promises = batch.map(async ({ legacyId, data }) => {
    try {
      await prisma.memberProfile.update({ where: { legacyId }, data });
      return true;
    } catch { return false; }
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
  const birthDateIdx = col("birth_date");
  const motherTongueIdx = col("mothertongue");

  console.log("Columns:", { id: idIdx, birth_date: birthDateIdx, mothertongue: motherTongueIdx });

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
    const bd = parseDate(cols[birthDateIdx]);
    if (bd) data.birthDate = bd;

    const mt = cols[motherTongueIdx];
    if (!isBlank(mt)) data.motherTongue = mt.trim();

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

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch(console.error);
