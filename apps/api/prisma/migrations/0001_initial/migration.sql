-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LocaleKey" AS ENUM ('EN', 'BN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'RESET_REQUIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('MEMBER', 'GHOTOK', 'VENDOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED', 'CANCELLED', 'DELETED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES');

-- CreateEnum
CREATE TYPE "ProfileOwnerType" AS ENUM ('SELF', 'FAMILY', 'GHOTOK', 'ADMIN');

-- CreateEnum
CREATE TYPE "GenderKey" AS ENUM ('MAN', 'WOMAN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PROFILE_PHOTO', 'BIODATA', 'DOCUMENT', 'VERIFICATION');

-- CreateEnum
CREATE TYPE "MediaPrivacyMode" AS ENUM ('PUBLIC', 'PRIVATE', 'BLURRED_PUBLIC');

-- CreateEnum
CREATE TYPE "MediaApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PhotoRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('INTEREST', 'FAVORITE', 'BLOCK');

-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('MEMBER_TO_MEMBER', 'GHOTOK_ASSISTED', 'VENDOR_INQUIRY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('AMARPAY', 'PAYPAL', 'OFFICE', 'MANUAL', 'CREDIT_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'MANUAL_REVIEW', 'MANUAL_APPROVED', 'MANUAL_REJECTED');

-- CreateEnum
CREATE TYPE "PaymentForType" AS ENUM ('MEMBERSHIP', 'GHOTOK_CREDITS', 'VENDOR_BILLING', 'FEATURED_LISTING', 'OTHER');

-- CreateEnum
CREATE TYPE "GhotokStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "GhotokLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'OPEN', 'RESPONDED', 'BOOKED', 'CLOSED_REJECTED');

-- CreateEnum
CREATE TYPE "WeddingProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BOOKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "legacyHash" TEXT,
    "legacyHashType" TEXT,
    "preferredLocale" "LocaleKey" NOT NULL DEFAULT 'EN',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleKey" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "profileOwnerType" "ProfileOwnerType" NOT NULL DEFAULT 'SELF',
    "managedByGhotokId" TEXT,
    "createdByActorType" "RoleKey",
    "createdByActorId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "displayName" TEXT,
    "gender" "GenderKey" NOT NULL,
    "lookingFor" "GenderKey",
    "birthDate" TIMESTAMP(3),
    "maritalStatus" TEXT,
    "childrenStatus" TEXT,
    "heightCm" INTEGER,
    "bodyType" TEXT,
    "complexion" TEXT,
    "bloodGroup" TEXT,
    "specialCaseNotes" TEXT,
    "religion" TEXT,
    "religionSubgroup" TEXT,
    "communityType" TEXT,
    "motherTongue" TEXT,
    "familyValues" TEXT,
    "educationLevel" TEXT,
    "educationMajor" TEXT,
    "universityName" TEXT,
    "profession" TEXT,
    "designation" TEXT,
    "annualIncomeBand" TEXT,
    "diet" TEXT,
    "smoke" TEXT,
    "drink" TEXT,
    "currentCountryCode" TEXT,
    "currentCity" TEXT,
    "currentArea" TEXT,
    "residenceStatus" TEXT,
    "homeCountryCode" TEXT,
    "homeDivision" TEXT,
    "homeDistrict" TEXT,
    "familyDetails" TEXT,
    "aboutMe" TEXT,
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "familyInvolvementLevel" TEXT,
    "mahrPreference" TEXT,
    "gotra" TEXT,
    "relocationPreference" TEXT,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
    "indexingMode" TEXT NOT NULL DEFAULT 'PRIVACY_LIMITED',
    "contactVisibilityMode" TEXT NOT NULL DEFAULT 'PLAN_GATED',
    "profileCompletionPct" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "approvedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRevision" (
    "id" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "submittedPayload" JSONB NOT NULL,
    "submittedByUserId" TEXT,
    "reviewStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByAdminId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerPreference" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "memberProfileId" TEXT NOT NULL,
    "gender" "GenderKey",
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "maritalStatuses" JSONB,
    "childrenPreferences" JSONB,
    "heightMinCm" INTEGER,
    "heightMaxCm" INTEGER,
    "religions" JSONB,
    "religionSubgroups" JSONB,
    "motherTongues" JSONB,
    "familyValues" JSONB,
    "educationLevels" JSONB,
    "educationMajors" JSONB,
    "professions" JSONB,
    "dietPreferences" JSONB,
    "smokePreferences" JSONB,
    "drinkPreferences" JSONB,
    "homeCountryCodes" JSONB,
    "livingCountryCodes" JSONB,
    "districts" JSONB,
    "residenceStatuses" JSONB,
    "relocationPreferences" JSONB,
    "familyInvolvementPrefs" JSONB,
    "aboutPartner" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileMedia" (
    "id" TEXT NOT NULL,
    "legacyId" BIGINT,
    "memberProfileId" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "mimeType" TEXT,
    "privacyMode" "MediaPrivacyMode" NOT NULL DEFAULT 'PUBLIC',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "MediaApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoAccessRequest" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "ownerMemberProfileId" TEXT NOT NULL,
    "requesterMemberProfileId" TEXT NOT NULL,
    "status" "PhotoRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestType" TEXT NOT NULL DEFAULT 'PHOTO',
    "decisionByUserId" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PhotoAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "actorMemberProfileId" TEXT NOT NULL,
    "targetMemberProfileId" TEXT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,
    "status" "InteractionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVisit" (
    "id" TEXT NOT NULL,
    "viewerMemberProfileId" TEXT NOT NULL,
    "viewedMemberProfileId" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchSave" (
    "id" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteriaJson" JSONB NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUnlock" (
    "id" TEXT NOT NULL,
    "viewerMemberProfileId" TEXT NOT NULL,
    "targetMemberProfileId" TEXT NOT NULL,
    "membershipId" TEXT,
    "unlockSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'MEMBER_TO_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberProfileId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadMessageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "legacyId" BIGINT,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderMemberProfileId" TEXT,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT NOT NULL,
    "attachmentPath" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT,
    "durationDays" INTEGER NOT NULL,
    "bdtPrice" DECIMAL(10,2) NOT NULL,
    "usdPrice" DECIMAL(10,2) NOT NULL,
    "contactLimit" INTEGER NOT NULL DEFAULT 0,
    "messageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "contactViewEnabled" BOOLEAN NOT NULL DEFAULT false,
    "highlightEnabled" BOOLEAN NOT NULL DEFAULT false,
    "supportTier" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberProfileId" TEXT,
    "membershipPlanId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sourcePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT,
    "actorType" "RoleKey",
    "actorId" TEXT,
    "paymentForType" "PaymentForType" NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "gatewayReference" TEXT,
    "currency" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "percent" DECIMAL(5,2),
    "currencyScope" TEXT,
    "appliesTo" TEXT NOT NULL DEFAULT 'UPGRADE',
    "maxTotalUses" INTEGER,
    "maxUsesPerUser" INTEGER,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "currency" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhotokProfile" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gender" "GenderKey",
    "status" "GhotokStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "feeCurrency" TEXT,
    "feeAmount" INTEGER,
    "bioEn" TEXT,
    "bioBn" TEXT,
    "photoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhotokProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhotokMemberLink" (
    "id" TEXT NOT NULL,
    "ghotokProfileId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "status" "GhotokLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhotokMemberLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhotokCreditWallet" (
    "id" TEXT NOT NULL,
    "ghotokProfileId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhotokCreditWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhotokCreditLedger" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "ghotokProfileId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhotokCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryName" TEXT,
    "division" TEXT,
    "district" TEXT,
    "area" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "descriptionEn" TEXT,
    "descriptionBn" TEXT,
    "logoPath" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "billingStatus" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPackage" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBn" TEXT,
    "descriptionEn" TEXT,
    "descriptionBn" TEXT,
    "priceBdt" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorLead" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "memberProfileId" TEXT,
    "weddingProjectId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingProject" (
    "id" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3),
    "city" TEXT,
    "budgetBand" TEXT,
    "guestTarget" INTEGER,
    "status" "WeddingProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingGuestEntry" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "weddingProjectId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestAddress" TEXT,
    "guestPhone" TEXT,
    "guestEmail" TEXT,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "invited" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingGuestEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingVendorShortlist" (
    "id" TEXT NOT NULL,
    "weddingProjectId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeddingVendorShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "permissionValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "actorUserId" TEXT,
    "actorRole" "RoleKey",
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDeviceToken" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "userId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhotokImpersonationSession" (
    "id" TEXT NOT NULL,
    "ghotokProfileId" TEXT NOT NULL,
    "memberProfileId" TEXT NOT NULL,
    "startedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "creditsSpent" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActionAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GhotokImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "templateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyJson" JSONB NOT NULL,
    "metadataJson" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_legacyId_key" ON "MemberProfile"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_userId_key" ON "MemberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_displayId_key" ON "MemberProfile"("displayId");

-- CreateIndex
CREATE INDEX "MemberProfile_status_approvalStatus_idx" ON "MemberProfile"("status", "approvalStatus");

-- CreateIndex
CREATE INDEX "MemberProfile_gender_lookingFor_idx" ON "MemberProfile"("gender", "lookingFor");

-- CreateIndex
CREATE INDEX "MemberProfile_currentCountryCode_homeCountryCode_idx" ON "MemberProfile"("currentCountryCode", "homeCountryCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRevision_memberProfileId_revisionNumber_key" ON "ProfileRevision"("memberProfileId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPreference_legacyId_key" ON "PartnerPreference"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPreference_memberProfileId_key" ON "PartnerPreference"("memberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileMedia_legacyId_key" ON "ProfileMedia"("legacyId");

-- CreateIndex
CREATE INDEX "ProfileMedia_memberProfileId_mediaType_idx" ON "ProfileMedia"("memberProfileId", "mediaType");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAccessRequest_legacyId_key" ON "PhotoAccessRequest"("legacyId");

-- CreateIndex
CREATE INDEX "PhotoAccessRequest_ownerMemberProfileId_status_idx" ON "PhotoAccessRequest"("ownerMemberProfileId", "status");

-- CreateIndex
CREATE INDEX "PhotoAccessRequest_requesterMemberProfileId_status_idx" ON "PhotoAccessRequest"("requesterMemberProfileId", "status");

-- CreateIndex
CREATE INDEX "Interaction_actorMemberProfileId_interactionType_idx" ON "Interaction"("actorMemberProfileId", "interactionType");

-- CreateIndex
CREATE INDEX "Interaction_targetMemberProfileId_interactionType_idx" ON "Interaction"("targetMemberProfileId", "interactionType");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_actorMemberProfileId_targetMemberProfileId_inte_key" ON "Interaction"("actorMemberProfileId", "targetMemberProfileId", "interactionType");

-- CreateIndex
CREATE INDEX "ProfileVisit_viewerMemberProfileId_idx" ON "ProfileVisit"("viewerMemberProfileId");

-- CreateIndex
CREATE INDEX "ProfileVisit_viewedMemberProfileId_idx" ON "ProfileVisit"("viewedMemberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactUnlock_viewerMemberProfileId_targetMemberProfileId_key" ON "ContactUnlock"("viewerMemberProfileId", "targetMemberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_legacyId_key" ON "Message"("legacyId");

-- CreateIndex
CREATE INDEX "Message_conversationId_sentAt_idx" ON "Message"("conversationId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_legacyId_key" ON "MembershipPlan"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_code_key" ON "MembershipPlan"("code");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_legacyId_key" ON "Payment"("legacyId");

-- CreateIndex
CREATE INDEX "Payment_paymentForType_status_idx" ON "Payment"("paymentForType", "status");

-- CreateIndex
CREATE INDEX "Payment_gateway_status_idx" ON "Payment"("gateway", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_legacyId_key" ON "Coupon"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_legacyId_key" ON "CouponRedemption"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "GhotokProfile_legacyId_key" ON "GhotokProfile"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "GhotokProfile_userId_key" ON "GhotokProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GhotokMemberLink_ghotokProfileId_memberProfileId_key" ON "GhotokMemberLink"("ghotokProfileId", "memberProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "GhotokCreditWallet_ghotokProfileId_key" ON "GhotokCreditWallet"("ghotokProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "GhotokCreditLedger_legacyId_key" ON "GhotokCreditLedger"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_legacyId_key" ON "VendorProfile"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "VendorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "VendorProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingGuestEntry_legacyId_key" ON "WeddingGuestEntry"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingVendorShortlist_weddingProjectId_vendorProfileId_key" ON "WeddingVendorShortlist"("weddingProjectId", "vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_legacyId_key" ON "AdminUser"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminUserId_permissionKey_key" ON "AdminPermission"("adminUserId", "permissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_legacyId_key" ON "AuditLog"("legacyId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceToken_legacyId_key" ON "UserDeviceToken"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceToken_deviceToken_key" ON "UserDeviceToken"("deviceToken");

-- CreateIndex
CREATE INDEX "UserDeviceToken_userId_platform_idx" ON "UserDeviceToken"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "GhotokImpersonationSession_ghotokProfileId_endedAt_idx" ON "GhotokImpersonationSession"("ghotokProfileId", "endedAt");

-- CreateIndex
CREATE INDEX "GhotokImpersonationSession_memberProfileId_endedAt_idx" ON "GhotokImpersonationSession"("memberProfileId", "endedAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_scheduledAt_idx" ON "NotificationOutbox"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_userId_createdAt_idx" ON "NotificationOutbox"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_managedByGhotokId_fkey" FOREIGN KEY ("managedByGhotokId") REFERENCES "GhotokProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPreference" ADD CONSTRAINT "PartnerPreference_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMedia" ADD CONSTRAINT "ProfileMedia_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMedia" ADD CONSTRAINT "ProfileMedia_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAccessRequest" ADD CONSTRAINT "PhotoAccessRequest_ownerMemberProfileId_fkey" FOREIGN KEY ("ownerMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAccessRequest" ADD CONSTRAINT "PhotoAccessRequest_requesterMemberProfileId_fkey" FOREIGN KEY ("requesterMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoAccessRequest" ADD CONSTRAINT "PhotoAccessRequest_decisionByUserId_fkey" FOREIGN KEY ("decisionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_actorMemberProfileId_fkey" FOREIGN KEY ("actorMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_targetMemberProfileId_fkey" FOREIGN KEY ("targetMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_viewerMemberProfileId_fkey" FOREIGN KEY ("viewerMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_viewedMemberProfileId_fkey" FOREIGN KEY ("viewedMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchSave" ADD CONSTRAINT "SearchSave_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_viewerMemberProfileId_fkey" FOREIGN KEY ("viewerMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_targetMemberProfileId_fkey" FOREIGN KEY ("targetMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderMemberProfileId_fkey" FOREIGN KEY ("senderMemberProfileId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_sourcePaymentId_fkey" FOREIGN KEY ("sourcePaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokProfile" ADD CONSTRAINT "GhotokProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokMemberLink" ADD CONSTRAINT "GhotokMemberLink_ghotokProfileId_fkey" FOREIGN KEY ("ghotokProfileId") REFERENCES "GhotokProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokMemberLink" ADD CONSTRAINT "GhotokMemberLink_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokCreditWallet" ADD CONSTRAINT "GhotokCreditWallet_ghotokProfileId_fkey" FOREIGN KEY ("ghotokProfileId") REFERENCES "GhotokProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokCreditLedger" ADD CONSTRAINT "GhotokCreditLedger_ghotokProfileId_fkey" FOREIGN KEY ("ghotokProfileId") REFERENCES "GhotokProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokCreditLedger" ADD CONSTRAINT "GhotokCreditLedger_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPackage" ADD CONSTRAINT "VendorPackage_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLead" ADD CONSTRAINT "VendorLead_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLead" ADD CONSTRAINT "VendorLead_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorLead" ADD CONSTRAINT "VendorLead_weddingProjectId_fkey" FOREIGN KEY ("weddingProjectId") REFERENCES "WeddingProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingProject" ADD CONSTRAINT "WeddingProject_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingGuestEntry" ADD CONSTRAINT "WeddingGuestEntry_weddingProjectId_fkey" FOREIGN KEY ("weddingProjectId") REFERENCES "WeddingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendorShortlist" ADD CONSTRAINT "WeddingVendorShortlist_weddingProjectId_fkey" FOREIGN KEY ("weddingProjectId") REFERENCES "WeddingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendorShortlist" ADD CONSTRAINT "WeddingVendorShortlist_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDeviceToken" ADD CONSTRAINT "UserDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokImpersonationSession" ADD CONSTRAINT "GhotokImpersonationSession_ghotokProfileId_fkey" FOREIGN KEY ("ghotokProfileId") REFERENCES "GhotokProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokImpersonationSession" ADD CONSTRAINT "GhotokImpersonationSession_memberProfileId_fkey" FOREIGN KEY ("memberProfileId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhotokImpersonationSession" ADD CONSTRAINT "GhotokImpersonationSession_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

