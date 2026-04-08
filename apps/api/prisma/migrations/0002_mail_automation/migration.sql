CREATE TYPE "MailCampaignStatus" AS ENUM (
  'DRAFT',
  'QUEUED',
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "PlatformSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "bodyJson" JSONB NOT NULL,
  "audienceFiltersJson" JSONB NOT NULL,
  "status" "MailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3),
  "queuedAt" TIMESTAMP(3),
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");
CREATE INDEX "MailCampaign_status_scheduledAt_idx" ON "MailCampaign"("status", "scheduledAt");
CREATE INDEX "MailCampaign_createdAt_idx" ON "MailCampaign"("createdAt");

ALTER TABLE "PlatformSetting"
ADD CONSTRAINT "PlatformSetting_updatedByUserId_fkey"
FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MailCampaign"
ADD CONSTRAINT "MailCampaign_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
