/**
 * Backfill displayName from firstName for profiles where displayName
 * is empty or looks like a displayId (m-XXXXX).
 * Also title-case all district values in member_profiles.
 *
 * Usage:
 *   npx tsx scripts/backfill-display-names-districts.ts
 *
 * Set DATABASE_URL in environment before running.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function titleCase(s: string): string {
  return s.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

async function main() {
  // 1. Backfill displayName from firstName
  const profilesNeedingName = await prisma.memberProfile.findMany({
    where: {
      OR: [
        { displayName: null },
        { displayName: "" },
      ],
      firstName: { not: null },
    },
    select: { id: true, firstName: true, lastName: true, displayName: true },
  });

  console.log(`Found ${profilesNeedingName.length} profiles needing displayName backfill`);

  let nameUpdated = 0;
  for (const profile of profilesNeedingName) {
    const newName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
    if (newName && newName.toUpperCase() !== "NULL") {
      await prisma.memberProfile.update({
        where: { id: profile.id },
        data: { displayName: newName },
      });
      nameUpdated++;
    }
  }
  console.log(`Updated ${nameUpdated} displayNames`);

  // 2. Title-case districts
  const profilesWithDistrict = await prisma.memberProfile.findMany({
    where: {
      homeDistrict: { not: null },
    },
    select: { id: true, homeDistrict: true },
  });

  let districtUpdated = 0;
  for (const profile of profilesWithDistrict) {
    if (profile.homeDistrict) {
      const fixed = titleCase(profile.homeDistrict);
      if (fixed !== profile.homeDistrict) {
        await prisma.memberProfile.update({
          where: { id: profile.id },
          data: { homeDistrict: fixed },
        });
        districtUpdated++;
      }
    }
  }
  console.log(`Title-cased ${districtUpdated} districts`);

  // 3. Title-case currentCity
  const profilesWithCity = await prisma.memberProfile.findMany({
    where: {
      currentCity: { not: null },
    },
    select: { id: true, currentCity: true },
  });

  let cityUpdated = 0;
  for (const profile of profilesWithCity) {
    if (profile.currentCity) {
      const fixed = titleCase(profile.currentCity);
      if (fixed !== profile.currentCity) {
        await prisma.memberProfile.update({
          where: { id: profile.id },
          data: { currentCity: fixed },
        });
        cityUpdated++;
      }
    }
  }
  console.log(`Title-cased ${cityUpdated} cities`);

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
