import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing legacy vendor and ghotok statuses...");

  const vendorResult = await prisma.vendorProfile.updateMany({
    where: { legacyId: { not: null }, status: "PENDING_REVIEW" },
    data: { status: "ACTIVE" },
  });
  console.log("Vendors updated to ACTIVE:", vendorResult.count);

  const ghotokResult = await prisma.ghotokProfile.updateMany({
    where: { legacyId: { not: null }, status: "PENDING_REVIEW" },
    data: { status: "ACTIVE" },
  });
  console.log("Ghotoks updated to ACTIVE:", ghotokResult.count);

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
