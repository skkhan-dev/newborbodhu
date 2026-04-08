import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Running search vector migration...");

  // Step 1: Add column
  console.log("Adding search_vector column...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "MemberProfile" ADD COLUMN IF NOT EXISTS "searchVector" tsvector`,
  );

  // Step 2: Enable pg_trgm
  console.log("Enabling pg_trgm extension...");
  await prisma.$executeRawUnsafe(
    `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  );

  // Step 3: Populate search vectors in batches
  console.log("Populating search vectors...");
  const batchSize = 10000;
  let updated = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "MemberProfile" SET "searchVector" =
        setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("lastName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("displayName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("religion", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("profession", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("educationLevel", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("currentCity", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("homeDistrict", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("aboutMe", '')), 'D')
      WHERE "id" IN (
        SELECT "id" FROM "MemberProfile"
        WHERE "searchVector" IS NULL
        LIMIT ${batchSize}
      )
    `);

    updated += result;
    console.log(`  Updated ${updated} profiles so far...`);
    hasMore = result >= batchSize;
  }

  console.log(`Total profiles updated: ${updated}`);

  // Step 4: Create GIN index
  console.log("Creating GIN index on searchVector...");
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "idx_member_profile_search_vector" ON "MemberProfile" USING GIN ("searchVector")`,
  );

  // Step 5: Create trigram index on displayName
  console.log("Creating trigram index on displayName...");
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "idx_member_profile_display_name_trgm" ON "MemberProfile" USING GIN ("displayName" gin_trgm_ops)`,
  );

  // Step 6: Create trigger function
  console.log("Creating auto-update trigger function...");
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_member_profile_search_vector()
    RETURNS trigger AS $$
    BEGIN
      NEW."searchVector" :=
        setweight(to_tsvector('english', coalesce(NEW."firstName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW."lastName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW."displayName", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW."religion", '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW."profession", '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW."educationLevel", '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW."currentCity", '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW."homeDistrict", '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW."aboutMe", '')), 'D');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  // Step 7: Create trigger
  console.log("Creating trigger...");
  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS trg_member_profile_search_vector ON "MemberProfile"`,
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_member_profile_search_vector
      BEFORE INSERT OR UPDATE OF "firstName", "lastName", "displayName", "religion", "profession", "educationLevel", "currentCity", "homeDistrict", "aboutMe"
      ON "MemberProfile"
      FOR EACH ROW
      EXECUTE FUNCTION update_member_profile_search_vector()
  `);

  console.log("Search vector migration complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
