CREATE TYPE "AnalyticsPlatform" AS ENUM (
  'WEB',
  'MOBILE',
  'SERVER'
);

CREATE TABLE "ProductEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "actorRole" "RoleKey",
  "anonymousId" TEXT,
  "sessionId" TEXT,
  "platform" "AnalyticsPlatform" NOT NULL,
  "locale" "LocaleKey",
  "eventName" TEXT NOT NULL,
  "pagePath" TEXT,
  "screenName" TEXT,
  "referrerPath" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadataJson" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductEvent_eventName_occurredAt_idx" ON "ProductEvent"("eventName", "occurredAt");
CREATE INDEX "ProductEvent_platform_occurredAt_idx" ON "ProductEvent"("platform", "occurredAt");
CREATE INDEX "ProductEvent_locale_occurredAt_idx" ON "ProductEvent"("locale", "occurredAt");
CREATE INDEX "ProductEvent_userId_occurredAt_idx" ON "ProductEvent"("userId", "occurredAt");
CREATE INDEX "ProductEvent_anonymousId_occurredAt_idx" ON "ProductEvent"("anonymousId", "occurredAt");

ALTER TABLE "ProductEvent"
ADD CONSTRAINT "ProductEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
