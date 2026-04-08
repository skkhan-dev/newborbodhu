import {
  ApprovalStatus,
  ConversationType,
  GhotokStatus,
  LocaleKey,
  MediaApprovalStatus,
  MediaPrivacyMode,
  MembershipStatus,
  PaymentForType,
  PaymentGateway,
  PaymentStatus,
  ProfileOwnerType,
  ProfileStatus,
  RoleKey,
  UserStatus,
  VendorStatus,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const COMMERCIAL_SETTINGS_KEY = "COMMERCIAL_SETTINGS";

function getDefaultCommercialSettings() {
  return {
    payments: {
      amarpayEnabled: true,
      paypalEnabled: true,
      officeEnabled: true,
      manualEnabled: true,
      primaryLocalGateway: "AMARPAY",
    },
    ads: {
      enabled: true,
      mode: "TEST",
      clientId: null,
      homeHeroSlotId: "TEST-HOME-HERO",
      vendorsSlotId: "TEST-VENDORS-RAIL",
      weddingSlotId: "TEST-WEDDING-RAIL",
      profilesSlotId: null,
      showOnHome: true,
      showOnVendors: true,
      showOnWedding: true,
      showOnProfiles: false,
    },
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function ensureUserRole(userId: string, role: RoleKey) {
  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId,
        role,
      },
    },
    update: {},
    create: {
      userId,
      role,
    },
  });
}

async function main() {
  const passwordHash = await hashPassword("Password123!");

  await prisma.membershipPlan.upsert({
    where: { code: "BRONZE" },
    update: {
      nameEn: "Bronze",
      nameBn: "ব্রোঞ্জ",
      durationDays: 15,
      bdtPrice: "800",
      usdPrice: "10",
      contactLimit: 10,
      messageEnabled: true,
      contactViewEnabled: true,
      category: "ONLINE",
      sortOrder: 0,
    },
    create: {
      code: "BRONZE",
      nameEn: "Bronze",
      nameBn: "ব্রোঞ্জ",
      durationDays: 15,
      bdtPrice: "800",
      usdPrice: "10",
      contactLimit: 10,
      messageEnabled: true,
      contactViewEnabled: true,
      category: "ONLINE",
      sortOrder: 0,
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: "SILVER" },
    update: {
      nameEn: "Silver",
      nameBn: "সিলভার",
      durationDays: 30,
      bdtPrice: "1800",
      usdPrice: "25",
      contactLimit: 20,
      messageEnabled: true,
      contactViewEnabled: true,
      category: "ONLINE",
      sortOrder: 1,
    },
    create: {
      code: "SILVER",
      nameEn: "Silver",
      nameBn: "সিলভার",
      durationDays: 30,
      bdtPrice: "1800",
      usdPrice: "25",
      contactLimit: 20,
      messageEnabled: true,
      contactViewEnabled: true,
      category: "ONLINE",
      sortOrder: 1,
    },
  });

  const silverPlan = await prisma.membershipPlan.findUniqueOrThrow({
    where: { code: "SILVER" },
  });

  await prisma.membershipPlan.upsert({
    where: { code: "GOLD" },
    update: {
      nameEn: "Gold",
      nameBn: "গোল্ড",
      durationDays: 60,
      bdtPrice: "3200",
      usdPrice: "45",
      contactLimit: 50,
      messageEnabled: true,
      contactViewEnabled: true,
      highlightEnabled: true,
      category: "ONLINE",
      sortOrder: 2,
    },
    create: {
      code: "GOLD",
      nameEn: "Gold",
      nameBn: "গোল্ড",
      durationDays: 60,
      bdtPrice: "3200",
      usdPrice: "45",
      contactLimit: 50,
      messageEnabled: true,
      contactViewEnabled: true,
      highlightEnabled: true,
      category: "ONLINE",
      sortOrder: 2,
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: "PLATINUM" },
    update: {
      nameEn: "Platinum",
      nameBn: "প্লাটিনাম",
      durationDays: 90,
      bdtPrice: "5200",
      usdPrice: "70",
      contactLimit: 100,
      messageEnabled: true,
      contactViewEnabled: true,
      highlightEnabled: true,
      supportTier: "priority",
      category: "ONLINE",
      sortOrder: 3,
    },
    create: {
      code: "PLATINUM",
      nameEn: "Platinum",
      nameBn: "প্লাটিনাম",
      durationDays: 90,
      bdtPrice: "5200",
      usdPrice: "70",
      contactLimit: 100,
      messageEnabled: true,
      contactViewEnabled: true,
      highlightEnabled: true,
      supportTier: "priority",
      category: "ONLINE",
      sortOrder: 3,
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: "ASSISTED_STANDARD" },
    update: {
      nameEn: "Assisted Standard",
      nameBn: "এসিস্টেড স্ট্যান্ডার্ড",
      durationDays: 180,
      bdtPrice: "15000",
      usdPrice: "180",
      contactLimit: 0,
      messageEnabled: false,
      contactViewEnabled: false,
      highlightEnabled: true,
      supportTier: "dedicated",
      category: "ASSISTED",
      sortOrder: 10,
    },
    create: {
      code: "ASSISTED_STANDARD",
      nameEn: "Assisted Standard",
      nameBn: "এসিস্টেড স্ট্যান্ডার্ড",
      durationDays: 180,
      bdtPrice: "15000",
      usdPrice: "180",
      contactLimit: 0,
      messageEnabled: false,
      contactViewEnabled: false,
      highlightEnabled: true,
      supportTier: "dedicated",
      category: "ASSISTED",
      sortOrder: 10,
    },
  });

  await prisma.membershipPlan.upsert({
    where: { code: "ASSISTED_PREMIUM" },
    update: {
      nameEn: "Assisted Premium",
      nameBn: "এসিস্টেড প্রিমিয়াম",
      durationDays: 365,
      bdtPrice: "25000",
      usdPrice: "300",
      contactLimit: 0,
      messageEnabled: false,
      contactViewEnabled: false,
      highlightEnabled: true,
      supportTier: "dedicated",
      category: "ASSISTED",
      sortOrder: 11,
    },
    create: {
      code: "ASSISTED_PREMIUM",
      nameEn: "Assisted Premium",
      nameBn: "এসিস্টেড প্রিমিয়াম",
      durationDays: 365,
      bdtPrice: "25000",
      usdPrice: "300",
      contactLimit: 0,
      messageEnabled: false,
      contactViewEnabled: false,
      highlightEnabled: true,
      supportTier: "dedicated",
      category: "ASSISTED",
      sortOrder: 11,
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: "MATCH_MAIL_SETTINGS" },
    update: {
      valueJson: {
        enabled: true,
        frequency: "WEEKLY",
        dayOfWeek: "FRIDAY",
        timeZone: "Asia/Dhaka",
        sendHourLocal: 10,
        sendMinuteLocal: 0,
        includeNewMembersDays: 7,
        minimumProfileCompletionPct: 70,
        maxMatchesPerRecipient: 6,
        membershipState: "ANY",
        recipientGender: null,
        preferredLocale: null,
        outsideBangladeshOnly: false,
      },
      updatedByUserId: null,
    },
    create: {
      key: "MATCH_MAIL_SETTINGS",
      valueJson: {
        enabled: true,
        frequency: "WEEKLY",
        dayOfWeek: "FRIDAY",
        timeZone: "Asia/Dhaka",
        sendHourLocal: 10,
        sendMinuteLocal: 0,
        includeNewMembersDays: 7,
        minimumProfileCompletionPct: 70,
        maxMatchesPerRecipient: 6,
        membershipState: "ANY",
        recipientGender: null,
        preferredLocale: null,
        outsideBangladeshOnly: false,
      },
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: COMMERCIAL_SETTINGS_KEY },
    update: {
      valueJson: getDefaultCommercialSettings(),
      updatedByUserId: null,
    },
    create: {
      key: COMMERCIAL_SETTINGS_KEY,
      valueJson: getDefaultCommercialSettings(),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "admin@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(adminUser.id, RoleKey.ADMIN);
  await ensureUserRole(adminUser.id, RoleKey.SUPER_ADMIN);

  await prisma.adminUser.upsert({
    where: { userId: adminUser.id },
    update: {
      displayName: "Borbodhu Admin",
      isSuperAdmin: true,
      status: "ACTIVE",
    },
    create: {
      userId: adminUser.id,
      displayName: "Borbodhu Admin",
      isSuperAdmin: true,
      status: "ACTIVE",
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: "member@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "member@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(memberUser.id, RoleKey.MEMBER);

  const memberProfile = await prisma.memberProfile.upsert({
    where: { userId: memberUser.id },
    update: {
      firstName: "Amina",
      lastName: "Rahman",
      displayName: "Amina Rahman",
      gender: "WOMAN",
      lookingFor: "MAN",
      religion: "Islam",
      motherTongue: "Bangla",
      educationLevel: "Masters",
      profession: "Software Engineer",
      currentCountryCode: "BD",
      currentCity: "Dhaka",
      homeCountryCode: "BD",
      homeDistrict: "Dhaka",
      aboutMe: "Diaspora-aware example profile for product review.",
      familyDetails: "Family oriented, values education and respect.",
      guardianPhone: "+8801700000000",
      profileCompletionPct: 85,
      profileOwnerType: ProfileOwnerType.SELF,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      userId: memberUser.id,
      firstName: "Amina",
      lastName: "Rahman",
      displayName: "Amina Rahman",
      gender: "WOMAN",
      lookingFor: "MAN",
      religion: "Islam",
      motherTongue: "Bangla",
      educationLevel: "Masters",
      profession: "Software Engineer",
      currentCountryCode: "BD",
      currentCity: "Dhaka",
      homeCountryCode: "BD",
      homeDistrict: "Dhaka",
      aboutMe: "Diaspora-aware example profile for product review.",
      familyDetails: "Family oriented, values education and respect.",
      guardianPhone: "+8801700000000",
      profileCompletionPct: 85,
      profileOwnerType: ProfileOwnerType.SELF,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      partnerPreference: {
        create: {
          gender: "MAN",
          ageMin: 28,
          ageMax: 38,
          religions: ["Islam"],
          motherTongues: ["Bangla"],
        },
      },
    },
  });

  const memberTwoUser = await prisma.user.upsert({
    where: { email: "member2@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "member2@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(memberTwoUser.id, RoleKey.MEMBER);

  const memberTwoProfile = await prisma.memberProfile.upsert({
    where: { userId: memberTwoUser.id },
    update: {
      firstName: "Farhan",
      lastName: "Karim",
      displayName: "Farhan Karim",
      gender: "MAN",
      lookingFor: "WOMAN",
      religion: "Islam",
      motherTongue: "Bangla",
      educationLevel: "MBA",
      profession: "Business Analyst",
      currentCountryCode: "US",
      currentCity: "New York",
      homeCountryCode: "BD",
      homeDistrict: "Chattogram",
      aboutMe: "Example diaspora profile for discovery and mailbox QA.",
      familyDetails: "Close-knit family with roots in Chattogram.",
      guardianPhone: "+17180000000",
      profileCompletionPct: 82,
      profileOwnerType: ProfileOwnerType.SELF,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      userId: memberTwoUser.id,
      firstName: "Farhan",
      lastName: "Karim",
      displayName: "Farhan Karim",
      gender: "MAN",
      lookingFor: "WOMAN",
      religion: "Islam",
      motherTongue: "Bangla",
      educationLevel: "MBA",
      profession: "Business Analyst",
      currentCountryCode: "US",
      currentCity: "New York",
      homeCountryCode: "BD",
      homeDistrict: "Chattogram",
      aboutMe: "Example diaspora profile for discovery and mailbox QA.",
      familyDetails: "Close-knit family with roots in Chattogram.",
      guardianPhone: "+17180000000",
      profileCompletionPct: 82,
      profileOwnerType: ProfileOwnerType.SELF,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      partnerPreference: {
        create: {
          gender: "WOMAN",
          religions: ["Islam"],
          motherTongues: ["Bangla"],
        },
      },
    },
  });

  const ghotokUser = await prisma.user.upsert({
    where: { email: "ghotok@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.BN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "ghotok@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.BN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(ghotokUser.id, RoleKey.GHOTOK);

  const ghotokProfile = await prisma.ghotokProfile.upsert({
    where: { userId: ghotokUser.id },
    update: {
      displayName: "Osman Ghotok",
      email: "ghotok@borbodhu.local",
      phone: "+8801800000000",
      status: GhotokStatus.ACTIVE,
      bioEn: "Trusted local matchmaker with family-guided introductions.",
      bioBn: "বিশ্বস্ত ঘটক, পরিবারভিত্তিক পরিচয়ের অভিজ্ঞতা আছে।",
    },
    create: {
      userId: ghotokUser.id,
      displayName: "Osman Ghotok",
      email: "ghotok@borbodhu.local",
      phone: "+8801800000000",
      status: GhotokStatus.ACTIVE,
      bioEn: "Trusted local matchmaker with family-guided introductions.",
      bioBn: "বিশ্বস্ত ঘটক, পরিবারভিত্তিক পরিচয়ের অভিজ্ঞতা আছে।",
    },
  });

  await prisma.ghotokCreditWallet.upsert({
    where: { ghotokProfileId: ghotokProfile.id },
    update: {
      balance: 25,
    },
    create: {
      ghotokProfileId: ghotokProfile.id,
      balance: 25,
    },
  });

  const managedMemberUser = await prisma.user.upsert({
    where: { email: "managed@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.BN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "managed@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.BN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(managedMemberUser.id, RoleKey.MEMBER);

  const managedMemberProfile = await prisma.memberProfile.upsert({
    where: { userId: managedMemberUser.id },
    update: {
      firstName: "Shila",
      lastName: "Sultana",
      displayName: "Shila Sultana",
      gender: "WOMAN",
      lookingFor: "MAN",
      profileOwnerType: ProfileOwnerType.GHOTOK,
      managedByGhotokId: ghotokProfile.id,
      createdByActorType: RoleKey.GHOTOK,
      createdByActorId: ghotokProfile.id,
      currentCountryCode: "BD",
      currentCity: "Sylhet",
      homeCountryCode: "BD",
      homeDistrict: "Sylhet",
      religion: "Islam",
      educationLevel: "Honours",
      profession: "Teacher",
      guardianName: ghotokProfile.displayName,
      guardianRelation: "Ghotok",
      guardianPhone: ghotokProfile.phone,
      guardianEmail: ghotokProfile.email,
      profileCompletionPct: 78,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      userId: managedMemberUser.id,
      firstName: "Shila",
      lastName: "Sultana",
      displayName: "Shila Sultana",
      gender: "WOMAN",
      lookingFor: "MAN",
      profileOwnerType: ProfileOwnerType.GHOTOK,
      managedByGhotokId: ghotokProfile.id,
      createdByActorType: RoleKey.GHOTOK,
      createdByActorId: ghotokProfile.id,
      currentCountryCode: "BD",
      currentCity: "Sylhet",
      homeCountryCode: "BD",
      homeDistrict: "Sylhet",
      religion: "Islam",
      educationLevel: "Honours",
      profession: "Teacher",
      guardianName: ghotokProfile.displayName,
      guardianRelation: "Ghotok",
      guardianPhone: ghotokProfile.phone,
      guardianEmail: ghotokProfile.email,
      profileCompletionPct: 78,
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      partnerPreference: {
        create: {
          gender: "MAN",
          religions: ["Islam"],
          motherTongues: ["Bangla"],
        },
      },
    },
  });

  await prisma.ghotokMemberLink.upsert({
    where: {
      ghotokProfileId_memberProfileId: {
        ghotokProfileId: ghotokProfile.id,
        memberProfileId: managedMemberProfile.id,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      ghotokProfileId: ghotokProfile.id,
      memberProfileId: managedMemberProfile.id,
      status: "ACTIVE",
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@borbodhu.local" },
    update: {
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "vendor@borbodhu.local",
      passwordHash,
      preferredLocale: LocaleKey.EN,
      status: UserStatus.ACTIVE,
    },
  });

  await ensureUserRole(vendorUser.id, RoleKey.VENDOR);

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { slug: "rang-mahal-events" },
    update: {
      userId: vendorUser.id,
      businessName: "Rang Mahal Events",
      categoryName: "Event Planner",
      division: "Dhaka",
      district: "Dhaka",
      area: "Gulshan",
      phone: "+8801900000000",
      email: "vendor@borbodhu.local",
      descriptionEn: "Wedding planning, decor, and guest coordination.",
      descriptionBn: "বিয়ের পরিকল্পনা, সাজসজ্জা এবং অতিথি সমন্বয় সেবা।",
      status: VendorStatus.ACTIVE,
      billingStatus: "PAID",
    },
    create: {
      userId: vendorUser.id,
      slug: "rang-mahal-events",
      businessName: "Rang Mahal Events",
      categoryName: "Event Planner",
      division: "Dhaka",
      district: "Dhaka",
      area: "Gulshan",
      phone: "+8801900000000",
      email: "vendor@borbodhu.local",
      descriptionEn: "Wedding planning, decor, and guest coordination.",
      descriptionBn: "বিয়ের পরিকল্পনা, সাজসজ্জা এবং অতিথি সমন্বয় সেবা।",
      status: VendorStatus.ACTIVE,
      billingStatus: "PAID",
    },
  });

  await prisma.vendorPackage.upsert({
    where: {
      id:
        (
          await prisma.vendorPackage.findFirst({
            where: {
              vendorProfileId: vendorProfile.id,
              nameEn: "Classic Wedding Package",
            },
            select: { id: true },
          })
        )?.id ?? "missing-classic-package",
    },
    update: {
      vendorProfileId: vendorProfile.id,
      nameEn: "Classic Wedding Package",
      nameBn: "ক্লাসিক ওয়েডিং প্যাকেজ",
      priceBdt: "85000",
      isActive: true,
    },
    create: {
      vendorProfileId: vendorProfile.id,
      nameEn: "Classic Wedding Package",
      nameBn: "ক্লাসিক ওয়েডিং প্যাকেজ",
      descriptionEn: "Decor, stage, and guest list coordination.",
      descriptionBn: "ডেকর, স্টেজ এবং গেস্ট লিস্ট সমন্বয়।",
      priceBdt: "85000",
      isActive: true,
    },
  });

  await prisma.vendorLead.upsert({
    where: {
      id:
        (
          await prisma.vendorLead.findFirst({
            where: {
              vendorProfileId: vendorProfile.id,
              requesterEmail: "member@borbodhu.local",
            },
            select: { id: true },
          })
        )?.id ?? "missing-seed-vendor-lead",
    },
    update: {
      vendorProfileId: vendorProfile.id,
      memberProfileId: memberProfile.id,
      status: "OPEN",
      requesterName: memberProfile.displayName,
      requesterEmail: "member@borbodhu.local",
      requesterPhone: memberProfile.guardianPhone,
      source: "MEMBER_DASHBOARD",
      message: "Looking for decor and guest coordination support for a Dhaka wedding event.",
    },
    create: {
      vendorProfileId: vendorProfile.id,
      memberProfileId: memberProfile.id,
      status: "OPEN",
      requesterName: memberProfile.displayName,
      requesterEmail: "member@borbodhu.local",
      requesterPhone: memberProfile.guardianPhone,
      source: "MEMBER_DASHBOARD",
      message: "Looking for decor and guest coordination support for a Dhaka wedding event.",
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      discountType: "PERCENT",
      percent: "10",
      currencyScope: "BDT",
      appliesTo: "UPGRADE",
      maxTotalUses: 500,
      maxUsesPerUser: 1,
      isActive: true,
    },
    create: {
      code: "WELCOME10",
      discountType: "PERCENT",
      percent: "10",
      currencyScope: "BDT",
      appliesTo: "UPGRADE",
      maxTotalUses: 500,
      maxUsesPerUser: 1,
      isActive: true,
      createdByAdminId: adminUser.id,
    },
  });

  const activeMembership =
    (
      await prisma.membership.findFirst({
        where: {
          userId: memberUser.id,
          membershipPlanId: silverPlan.id,
          status: MembershipStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      })
    ) ?? null;

  if (!activeMembership) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + silverPlan.durationDays);

    await prisma.membership.create({
      data: {
        userId: memberUser.id,
        memberProfileId: memberProfile.id,
        membershipPlanId: silverPlan.id,
        status: MembershipStatus.ACTIVE,
        startsAt,
        endsAt,
      },
    });
  }

  const existingManualPayment = await prisma.payment.findFirst({
    where: {
      userId: memberTwoUser.id,
      paymentForType: PaymentForType.MEMBERSHIP,
      gateway: PaymentGateway.OFFICE,
      status: PaymentStatus.MANUAL_REVIEW,
    },
    select: {
      id: true,
    },
  });

  if (!existingManualPayment) {
    const payment = await prisma.payment.create({
      data: {
        userId: memberTwoUser.id,
        actorType: RoleKey.MEMBER,
        actorId: memberTwoProfile.id,
        paymentForType: PaymentForType.MEMBERSHIP,
        gateway: PaymentGateway.OFFICE,
        currency: "BDT",
        subtotalAmount: "1800",
        discountAmount: "0",
        finalAmount: "1800",
        status: PaymentStatus.MANUAL_REVIEW,
        metadataJson: {
          source: "seed_manual_review",
        },
      },
    });

    await prisma.membership.create({
      data: {
        userId: memberTwoUser.id,
        memberProfileId: memberTwoProfile.id,
        membershipPlanId: silverPlan.id,
        status: MembershipStatus.PENDING,
        sourcePaymentId: payment.id,
      },
    });
  }

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.MEMBER_TO_MEMBER,
      participants: {
        some: {
          userId: memberUser.id,
        },
      },
      AND: {
        participants: {
          some: {
            userId: memberTwoUser.id,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingConversation) {
    await prisma.conversation.create({
      data: {
        type: ConversationType.MEMBER_TO_MEMBER,
        participants: {
          create: [
            {
              userId: memberUser.id,
              memberProfileId: memberProfile.id,
            },
            {
              userId: memberTwoUser.id,
              memberProfileId: memberTwoProfile.id,
            },
          ],
        },
        messages: {
          create: [
            {
              senderUserId: memberUser.id,
              senderMemberProfileId: memberProfile.id,
              body: "Assalamu Alaikum. Thank you for accepting the connection.",
            },
            {
              senderUserId: memberTwoUser.id,
              senderMemberProfileId: memberTwoProfile.id,
              body: "Walaikum Assalam. Happy to connect and learn more.",
            },
          ],
        },
      },
    });
  }

  const existingPrimaryPhoto = await prisma.profileMedia.findFirst({
    where: {
      memberProfileId: memberProfile.id,
      storagePath: "seed/member-amina-primary.jpg",
    },
    select: {
      id: true,
    },
  });

  if (!existingPrimaryPhoto) {
    await prisma.profileMedia.create({
      data: {
        memberProfileId: memberProfile.id,
        uploadedByUserId: memberUser.id,
        mediaType: "PROFILE_PHOTO",
        storagePath: "seed/member-amina-primary.jpg",
        thumbnailPath: "seed/member-amina-primary-thumb.jpg",
        mimeType: "image/jpeg",
        privacyMode: MediaPrivacyMode.PUBLIC,
        isPrimary: true,
        approvalStatus: MediaApprovalStatus.APPROVED,
      },
    });
  }

  const existingPendingPhoto = await prisma.profileMedia.findFirst({
    where: {
      memberProfileId: memberTwoProfile.id,
      storagePath: "seed/member-farhan-pending.jpg",
    },
    select: {
      id: true,
    },
  });

  if (!existingPendingPhoto) {
    await prisma.profileMedia.create({
      data: {
        memberProfileId: memberTwoProfile.id,
        uploadedByUserId: memberTwoUser.id,
        mediaType: "PROFILE_PHOTO",
        storagePath: "seed/member-farhan-pending.jpg",
        thumbnailPath: "seed/member-farhan-pending-thumb.jpg",
        mimeType: "image/jpeg",
        privacyMode: MediaPrivacyMode.BLURRED_PUBLIC,
        isPrimary: true,
        approvalStatus: MediaApprovalStatus.PENDING,
      },
    });
  }

  const existingSavedSearch = await prisma.searchSave.findFirst({
    where: {
      memberProfileId: memberProfile.id,
      name: "US-based matches",
    },
    select: {
      id: true,
    },
  });

  if (!existingSavedSearch) {
    await prisma.searchSave.create({
      data: {
        memberProfileId: memberProfile.id,
        name: "US-based matches",
        criteriaJson: {
          currentCountryCode: "US",
          gender: "MAN",
          religion: "Islam",
        },
        alertEnabled: true,
      },
    });
  }

  const existingVisit = await prisma.profileVisit.findFirst({
    where: {
      viewerMemberProfileId: memberTwoProfile.id,
      viewedMemberProfileId: memberProfile.id,
      source: "seed",
    },
    select: {
      id: true,
    },
  });

  if (!existingVisit) {
    await prisma.profileVisit.create({
      data: {
        viewerMemberProfileId: memberTwoProfile.id,
        viewedMemberProfileId: memberProfile.id,
        source: "seed",
      },
    });
  }

  await prisma.weddingProject.upsert({
    where: {
      id:
        (
          await prisma.weddingProject.findFirst({
            where: {
              memberProfileId: memberProfile.id,
              title: "Amina Wedding Plan",
            },
            select: { id: true },
          })
        )?.id ?? "missing-wedding-project",
    },
    update: {
      memberProfileId: memberProfile.id,
      title: "Amina Wedding Plan",
      city: "Dhaka",
      budgetBand: "10-15 lakh",
      guestTarget: 250,
    },
    create: {
      memberProfileId: memberProfile.id,
      title: "Amina Wedding Plan",
      city: "Dhaka",
      budgetBand: "10-15 lakh",
      guestTarget: 250,
    },
  });

  console.log("Seed completed.");
  console.log("Admin login: admin@borbodhu.local / Password123!");
  console.log("Member login: member@borbodhu.local / Password123!");
  console.log("Member 2 login: member2@borbodhu.local / Password123!");
  console.log("Managed member login: managed@borbodhu.local / Password123!");
  console.log("Ghotok login: ghotok@borbodhu.local / Password123!");
  console.log("Vendor login: vendor@borbodhu.local / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
