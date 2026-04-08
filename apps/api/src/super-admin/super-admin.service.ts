import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  GenderKey,
  GhotokStatus,
  LocaleKey,
  MailCampaignStatus,
  MembershipStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  ProfileStatus,
  RoleKey,
  UserStatus,
  VendorStatus,
} from "@prisma/client";

import { PasswordService } from "../auth/password.service";
import {
  COMMERCIAL_SETTINGS_KEY,
  normalizeCommercialSettings,
  type CommercialSettings,
} from "../config/commercial-settings";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { CreateMailCampaignDto } from "./dto/create-mail-campaign.dto";
import { CreateMembershipPlanDto } from "./dto/create-membership-plan.dto";
import { DateRangeQueryDto } from "./dto/date-range-query.dto";
import { PreviewMailCampaignDto } from "./dto/preview-mail-campaign.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { UpdateCommercialSettingsDto } from "./dto/update-commercial-settings.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { UpdateMatchMailSettingsDto } from "./dto/update-match-mail-settings.dto";
import { UpdateMembershipPlanDto } from "./dto/update-membership-plan.dto";

type MatchMailSettings = {
  enabled: boolean;
  frequency: "DAILY" | "WEEKLY";
  dayOfWeek: string;
  timeZone: string;
  sendHourLocal: number;
  sendMinuteLocal: number;
  includeNewMembersDays: number;
  minimumProfileCompletionPct: number;
  maxMatchesPerRecipient: number;
  membershipState: "ANY" | "PAID" | "FREE";
  recipientGender: GenderKey | null;
  preferredLocale: LocaleKey | null;
  outsideBangladeshOnly: boolean;
};

type AudienceFilters = {
  recipientGender?: GenderKey;
  currentCountryCode?: string;
  homeCountryCode?: string;
  preferredLocale?: LocaleKey;
  membershipState?: "ANY" | "PAID" | "FREE";
  outsideBangladeshOnly?: boolean;
  minimumProfileCompletionPct?: number;
};

const MATCH_MAIL_SETTINGS_KEY = "MATCH_MAIL_SETTINGS";
const DEFAULT_MATCH_MAIL_SETTINGS: MatchMailSettings = {
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
};

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const paidStatuses = [PaymentStatus.PAID, PaymentStatus.MANUAL_APPROVED];
    const [
      adminCount,
      superAdminCount,
      memberCount,
      ghotokCount,
      vendorCount,
      activeProfiles,
      pendingProfiles,
      rejectedProfiles,
      manualPayments,
      pendingVendors,
      pendingGhotoks,
      planCount,
      activeCouponCount,
      totalCollected,
      todayCollected,
      monthCollected,
      yearCollected,
    ] = await Promise.all([
      this.prisma.adminUser.count(),
      this.prisma.adminUser.count({
        where: { isSuperAdmin: true },
      }),
      this.prisma.userRole.count({
        where: { role: RoleKey.MEMBER },
      }),
      this.prisma.ghotokProfile.count(),
      this.prisma.vendorProfile.count(),
      this.prisma.memberProfile.count({
        where: { status: ProfileStatus.ACTIVE },
      }),
      this.prisma.memberProfile.count({
        where: { approvalStatus: ApprovalStatus.PENDING },
      }),
      this.prisma.memberProfile.count({
        where: { approvalStatus: ApprovalStatus.REJECTED },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.MANUAL_REVIEW },
      }),
      this.prisma.vendorProfile.count({
        where: { status: VendorStatus.PENDING_REVIEW },
      }),
      this.prisma.ghotokProfile.count({
        where: { status: GhotokStatus.PENDING_REVIEW },
      }),
      this.prisma.membershipPlan.count(),
      this.prisma.coupon.count({
        where: { isActive: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: { in: paidStatuses } },
        _sum: { finalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: { in: paidStatuses },
          createdAt: { gte: todayStart },
        },
        _sum: { finalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: { in: paidStatuses },
          createdAt: { gte: monthStart },
        },
        _sum: { finalAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: { in: paidStatuses },
          createdAt: { gte: yearStart },
        },
        _sum: { finalAmount: true },
      }),
    ]);

    return {
      people: {
        admins: adminCount,
        superAdmins: superAdminCount,
        members: memberCount,
        ghotoks: ghotokCount,
        vendors: vendorCount,
      },
      queues: {
        pendingProfiles,
        pendingVendors,
        pendingGhotoks,
        manualPayments,
      },
      profiles: {
        active: activeProfiles,
        rejected: rejectedProfiles,
      },
      catalog: {
        membershipPlans: planCount,
        activeCoupons: activeCouponCount,
      },
      revenue: {
        totalCollected: Number(totalCollected._sum.finalAmount ?? 0),
        todayCollected: Number(todayCollected._sum.finalAmount ?? 0),
        monthCollected: Number(monthCollected._sum.finalAmount ?? 0),
        yearCollected: Number(yearCollected._sum.finalAmount ?? 0),
      },
    };
  }

  async listAdmins() {
    const admins = await this.prisma.adminUser.findMany({
      orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roles: {
              select: {
                role: true,
              },
            },
          },
        },
        permissions: {
          orderBy: {
            permissionKey: "asc",
          },
        },
      },
    });

    return admins.map((admin) => ({
      id: admin.id,
      displayName: admin.displayName,
      isSuperAdmin: admin.isSuperAdmin,
      status: admin.status,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      user: {
        id: admin.user.id,
        email: admin.user.email,
        status: admin.user.status,
        roles: admin.user.roles.map((role) => role.role),
      },
      permissions: admin.permissions.map((permission) => ({
        id: permission.id,
        key: permission.permissionKey,
        value: permission.permissionValue,
      })),
    }));
  }

  async createAdmin(actorUserId: string, dto: CreateAdminDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("A user with that email already exists.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const permissionKeys = this.normalizePermissionKeys(dto.permissions);
    const isSuperAdmin = dto.isSuperAdmin ?? false;
    const adminStatus = dto.status ?? "ACTIVE";
    const userStatus = adminStatus === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          status: userStatus,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          role: RoleKey.ADMIN,
        },
      });

      if (isSuperAdmin) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            role: RoleKey.SUPER_ADMIN,
          },
        });
      }

      const admin = await tx.adminUser.create({
        data: {
          userId: user.id,
          displayName: dto.displayName.trim(),
          isSuperAdmin,
          status: adminStatus,
          permissions: permissionKeys.length
            ? {
                createMany: {
                  data: permissionKeys.map((permissionKey) => ({
                    permissionKey,
                    permissionValue: "ALLOW",
                  })),
                },
              }
            : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actorUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "ADMIN_CREATED",
          targetType: "AdminUser",
          targetId: admin.id,
          description: `Created admin ${dto.email}`,
        },
      });

      return admin.id;
    });

    return this.getAdminById(created);
  }

  async updateAdmin(actorUserId: string, adminUserId: string, dto: UpdateAdminDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Admin user was not found.");
    }

    if (
      existing.user.id === actorUserId &&
      ((dto.isSuperAdmin === false) || (dto.status && dto.status !== "ACTIVE"))
    ) {
      throw new BadRequestException(
        "You cannot remove your own active super-admin access from this console.",
      );
    }

    const nextPasswordHash = dto.password
      ? await this.passwordService.hashPassword(dto.password)
      : null;
    const permissionKeys = dto.permissions
      ? this.normalizePermissionKeys(dto.permissions)
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: adminUserId },
        data: {
          displayName: dto.displayName?.trim(),
          isSuperAdmin: dto.isSuperAdmin,
          status: dto.status,
        },
      });

      if (dto.status) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: {
            status: dto.status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
          },
        });
      }

      if (nextPasswordHash) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: {
            passwordHash: nextPasswordHash,
          },
        });
      }

      await tx.userRole.upsert({
        where: {
          userId_role: {
            userId: existing.user.id,
            role: RoleKey.ADMIN,
          },
        },
        update: {},
        create: {
          userId: existing.user.id,
          role: RoleKey.ADMIN,
        },
      });

      if (dto.isSuperAdmin === true) {
        await tx.userRole.upsert({
          where: {
            userId_role: {
              userId: existing.user.id,
              role: RoleKey.SUPER_ADMIN,
            },
          },
          update: {},
          create: {
            userId: existing.user.id,
            role: RoleKey.SUPER_ADMIN,
          },
        });
      }

      if (dto.isSuperAdmin === false) {
        await tx.userRole.deleteMany({
          where: {
            userId: existing.user.id,
            role: RoleKey.SUPER_ADMIN,
          },
        });
      }

      if (permissionKeys) {
        await tx.adminPermission.deleteMany({
          where: { adminUserId },
        });

        if (permissionKeys.length) {
          await tx.adminPermission.createMany({
            data: permissionKeys.map((permissionKey) => ({
              adminUserId,
              permissionKey,
              permissionValue: "ALLOW",
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "ADMIN_UPDATED",
          targetType: "AdminUser",
          targetId: adminUserId,
          description: `Updated admin ${adminUserId}`,
          metadataJson: {
            updatedFields: Object.keys(dto),
          },
        },
      });
    });

    return this.getAdminById(adminUserId);
  }

  async listMembershipPlans() {
    const plans = await this.prisma.membershipPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
    });

    return plans.map((plan) => ({
      ...plan,
      bdtPrice: Number(plan.bdtPrice),
      usdPrice: Number(plan.usdPrice),
    }));
  }

  async createMembershipPlan(actorUserId: string, dto: CreateMembershipPlanDto) {
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("A membership plan with that code already exists.");
    }

    const plan = await this.prisma.membershipPlan.create({
      data: this.toMembershipPlanCreateData(dto),
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "MEMBERSHIP_PLAN_CREATED",
        targetType: "MembershipPlan",
        targetId: plan.id,
        description: dto.code,
      },
    });

    return {
      ...plan,
      bdtPrice: Number(plan.bdtPrice),
      usdPrice: Number(plan.usdPrice),
    };
  }

  async updateMembershipPlan(actorUserId: string, planId: string, dto: UpdateMembershipPlanDto) {
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Membership plan was not found.");
    }

    const plan = await this.prisma.membershipPlan.update({
      where: { id: planId },
      data: this.toMembershipPlanUpdateData(dto),
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "MEMBERSHIP_PLAN_UPDATED",
        targetType: "MembershipPlan",
        targetId: plan.id,
        description: dto.code ?? plan.code,
      },
    });

    return {
      ...plan,
      bdtPrice: Number(plan.bdtPrice),
      usdPrice: Number(plan.usdPrice),
    };
  }

  async listCoupons() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
        createdByAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      amount: coupon.amount === null ? null : Number(coupon.amount),
      percent: coupon.percent === null ? null : Number(coupon.percent),
      currencyScope: coupon.currencyScope,
      appliesTo: coupon.appliesTo,
      maxTotalUses: coupon.maxTotalUses,
      maxUsesPerUser: coupon.maxUsesPerUser,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
      notes: coupon.notes,
      createdAt: coupon.createdAt,
      usageCount: coupon._count.redemptions,
      createdByAdmin: coupon.createdByAdmin,
    }));
  }

  async createCoupon(actorUserId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("A coupon with that code already exists.");
    }

    const coupon = await this.prisma.coupon.create({
      data: this.toCouponCreateData(actorUserId, dto),
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "COUPON_CREATED",
        targetType: "Coupon",
        targetId: coupon.id,
        description: coupon.code,
      },
    });

    return {
      ...coupon,
      amount: coupon.amount === null ? null : Number(coupon.amount),
      percent: coupon.percent === null ? null : Number(coupon.percent),
    };
  }

  async updateCoupon(actorUserId: string, couponId: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Coupon was not found.");
    }

    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: this.toCouponUpdateData(dto),
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "COUPON_UPDATED",
        targetType: "Coupon",
        targetId: coupon.id,
        description: dto.code ?? coupon.code,
      },
    });

    return {
      ...coupon,
      amount: coupon.amount === null ? null : Number(coupon.amount),
      percent: coupon.percent === null ? null : Number(coupon.percent),
    };
  }

  async getRevenueSummary(query: DateRangeQueryDto) {
    const range = this.resolveDateRange(query);
    const paidStatuses = [PaymentStatus.PAID, PaymentStatus.MANUAL_APPROVED];
    const payments = await this.prisma.payment.findMany({
      where: {
        status: {
          in: paidStatuses,
        },
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      include: {
        approvedByAdmin: {
          select: {
            id: true,
            email: true,
            adminProfile: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const byGateway = new Map<
      PaymentGateway,
      {
        gateway: PaymentGateway;
        count: number;
        amount: number;
      }
    >();
    const byAdmin = new Map<
      string,
      {
        adminUserId: string | null;
        userId: string | null;
        displayName: string;
        email: string | null;
        count: number;
        amount: number;
      }
    >();

    let totalAmount = 0;

    for (const payment of payments) {
      const amount = Number(payment.finalAmount);
      totalAmount += amount;

      const gatewayCurrent = byGateway.get(payment.gateway) ?? {
        gateway: payment.gateway,
        count: 0,
        amount: 0,
      };
      gatewayCurrent.count += 1;
      gatewayCurrent.amount += amount;
      byGateway.set(payment.gateway, gatewayCurrent);

      const adminKey = payment.approvedByAdmin?.id ?? "system";
      const adminCurrent = byAdmin.get(adminKey) ?? {
        adminUserId: payment.approvedByAdmin?.adminProfile?.id ?? null,
        userId: payment.approvedByAdmin?.id ?? null,
        displayName:
          payment.approvedByAdmin?.adminProfile?.displayName ?? "System / Gateway",
        email: payment.approvedByAdmin?.email ?? null,
        count: 0,
        amount: 0,
      };
      adminCurrent.count += 1;
      adminCurrent.amount += amount;
      byAdmin.set(adminKey, adminCurrent);
    }

    return {
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      totals: {
        count: payments.length,
        amount: Number(totalAmount.toFixed(2)),
      },
      byGateway: Array.from(byGateway.values()).sort((left, right) => right.amount - left.amount),
      byAdmin: Array.from(byAdmin.values()).sort((left, right) => right.amount - left.amount),
    };
  }

  async getProfileSummary(query: DateRangeQueryDto) {
    const range = this.resolveDateRange(query);
    const profiles = await this.prisma.memberProfile.findMany({
      where: {
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      select: {
        status: true,
        approvalStatus: true,
      },
    });

    const byStatus = new Map<string, number>();
    const byApprovalStatus = new Map<string, number>();

    for (const profile of profiles) {
      byStatus.set(profile.status, (byStatus.get(profile.status) ?? 0) + 1);
      byApprovalStatus.set(
        profile.approvalStatus,
        (byApprovalStatus.get(profile.approvalStatus) ?? 0) + 1,
      );
    }

    return {
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      totals: {
        created: profiles.length,
        active: byStatus.get(ProfileStatus.ACTIVE) ?? 0,
        rejected: byStatus.get(ProfileStatus.REJECTED) ?? 0,
        cancelled: byStatus.get(ProfileStatus.CANCELLED) ?? 0,
        pendingApproval: byApprovalStatus.get(ApprovalStatus.PENDING) ?? 0,
      },
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      byApprovalStatus: Array.from(byApprovalStatus.entries()).map(
        ([approvalStatus, count]) => ({
          approvalStatus,
          count,
        }),
      ),
    };
  }

  async getCommercialSettings() {
    return this.readCommercialSettings();
  }

  async updateCommercialSettings(
    actorUserId: string,
    dto: UpdateCommercialSettingsDto,
  ) {
    const currentSettings = await this.readCommercialSettings();
    const nextSettings = normalizeCommercialSettings({
      payments: {
        ...currentSettings.payments,
        amarpayEnabled: dto.amarpayEnabled ?? currentSettings.payments.amarpayEnabled,
        paypalEnabled: dto.paypalEnabled ?? currentSettings.payments.paypalEnabled,
        officeEnabled: dto.officeEnabled ?? currentSettings.payments.officeEnabled,
        manualEnabled: dto.manualEnabled ?? currentSettings.payments.manualEnabled,
      },
      ads: {
        ...currentSettings.ads,
        enabled: dto.adsEnabled ?? currentSettings.ads.enabled,
        mode: dto.adsMode ?? currentSettings.ads.mode,
        clientId: dto.adsClientId ?? currentSettings.ads.clientId,
        homeHeroSlotId: dto.homeHeroSlotId ?? currentSettings.ads.homeHeroSlotId,
        vendorsSlotId: dto.vendorsSlotId ?? currentSettings.ads.vendorsSlotId,
        weddingSlotId: dto.weddingSlotId ?? currentSettings.ads.weddingSlotId,
        profilesSlotId: dto.profilesSlotId ?? currentSettings.ads.profilesSlotId,
        showOnHome: dto.showAdsOnHome ?? currentSettings.ads.showOnHome,
        showOnVendors: dto.showAdsOnVendors ?? currentSettings.ads.showOnVendors,
        showOnWedding: dto.showAdsOnWedding ?? currentSettings.ads.showOnWedding,
        showOnProfiles: dto.showAdsOnProfiles ?? currentSettings.ads.showOnProfiles,
      },
    });

    await this.prisma.platformSetting.upsert({
      where: {
        key: COMMERCIAL_SETTINGS_KEY,
      },
      update: {
        valueJson: nextSettings as Prisma.InputJsonValue,
        updatedByUserId: actorUserId,
      },
      create: {
        key: COMMERCIAL_SETTINGS_KEY,
        valueJson: nextSettings as Prisma.InputJsonValue,
        updatedByUserId: actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "COMMERCIAL_SETTINGS_UPDATED",
        targetType: "PlatformSetting",
        targetId: COMMERCIAL_SETTINGS_KEY,
        description: "Updated commercial settings",
        metadataJson: nextSettings as Prisma.InputJsonValue,
      },
    });

    return this.readCommercialSettings();
  }

  async getMatchMailSettings() {
    const settings = await this.readMatchMailSettings();
    const audience = await this.getAudiencePreviewFromFilters(
      {
        recipientGender: settings.recipientGender ?? undefined,
        preferredLocale: settings.preferredLocale ?? undefined,
        membershipState: settings.membershipState,
        outsideBangladeshOnly: settings.outsideBangladeshOnly,
        minimumProfileCompletionPct: settings.minimumProfileCompletionPct,
      },
      6,
    );

    return {
      settings,
      audience,
    };
  }

  async updateMatchMailSettings(
    actorUserId: string,
    dto: UpdateMatchMailSettingsDto,
  ) {
    const currentSettings = await this.readMatchMailSettings();
    const nextSettings = this.normalizeMatchMailSettings({
      ...currentSettings,
      ...dto,
    });

    await this.prisma.platformSetting.upsert({
      where: {
        key: MATCH_MAIL_SETTINGS_KEY,
      },
      update: {
        valueJson: nextSettings as Prisma.InputJsonValue,
        updatedByUserId: actorUserId,
      },
      create: {
        key: MATCH_MAIL_SETTINGS_KEY,
        valueJson: nextSettings as Prisma.InputJsonValue,
        updatedByUserId: actorUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "MATCH_MAIL_SETTINGS_UPDATED",
        targetType: "PlatformSetting",
        targetId: MATCH_MAIL_SETTINGS_KEY,
        description: "Updated match mail settings",
        metadataJson: nextSettings as Prisma.InputJsonValue,
      },
    });

    return this.getMatchMailSettings();
  }

  async previewMatchMailAudience() {
    const settings = await this.readMatchMailSettings();
    const audience = await this.getAudiencePreviewFromFilters(
      {
        recipientGender: settings.recipientGender ?? undefined,
        preferredLocale: settings.preferredLocale ?? undefined,
        membershipState: settings.membershipState,
        outsideBangladeshOnly: settings.outsideBangladeshOnly,
        minimumProfileCompletionPct: settings.minimumProfileCompletionPct,
      },
      6,
    );

    return {
      settings,
      audience,
    };
  }

  async queueMatchMailNow(actorUserId: string) {
    const settings = await this.readMatchMailSettings();

    if (!settings.enabled) {
      throw new BadRequestException("Match mail is currently disabled.");
    }

    const recipientProfiles = await this.prisma.memberProfile.findMany({
      where: this.buildAudienceWhere(
        {
          recipientGender: settings.recipientGender ?? undefined,
          preferredLocale: settings.preferredLocale ?? undefined,
          membershipState: settings.membershipState,
          outsideBangladeshOnly: settings.outsideBangladeshOnly,
          minimumProfileCompletionPct: settings.minimumProfileCompletionPct,
        },
        new Date(),
      ),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            preferredLocale: true,
          },
        },
        partnerPreference: true,
        memberships: {
          where: this.getActiveMembershipWhere(new Date()),
          include: {
            membershipPlan: {
              select: {
                code: true,
                nameEn: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [{ user: { preferredLocale: "asc" } }, { createdAt: "desc" }],
      take: 300,
    });

    const recentSince = new Date();
    recentSince.setDate(recentSince.getDate() - settings.includeNewMembersDays);
    const scheduledAt = new Date();
    const queuedEmails: Parameters<NotificationsService["queueEmails"]>[0] = [];
    let totalSuggestedMatches = 0;

    for (const profile of recipientProfiles) {
      const suggestionWhere = this.buildRecentMatchWhere(
        profile.id,
        recentSince,
        settings.minimumProfileCompletionPct,
        profile.lookingFor ?? profile.partnerPreference?.gender ?? undefined,
        profile.partnerPreference?.ageMin ?? undefined,
        profile.partnerPreference?.ageMax ?? undefined,
      );

      const matches = await this.prisma.memberProfile.findMany({
        where: suggestionWhere,
        select: {
          id: true,
          displayId: true,
          displayName: true,
          firstName: true,
          profession: true,
          currentCity: true,
          currentCountryCode: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: settings.maxMatchesPerRecipient,
      });

      if (!matches.length) {
        continue;
      }

      totalSuggestedMatches += matches.length;
      const activeMembership = profile.memberships[0]?.membershipPlan?.code ?? null;

      queuedEmails.push({
        userId: profile.user.id,
        recipientEmail: profile.user.email,
        templateKey: "match_mail_digest",
        subject:
          settings.frequency === "DAILY"
            ? "Your Borbodhu daily matches are ready"
            : "Your Borbodhu weekly matches are ready",
        scheduledAt,
        bodyJson: {
          headline: "New compatible profiles are waiting for you",
          intro: `We found ${matches.length} recent profile${matches.length === 1 ? "" : "s"} that align with your current Borbodhu preferences.`,
          frequency: settings.frequency,
          matchCount: matches.length,
          recentSince: recentSince.toISOString(),
          ctaLabel: "Review matches",
          ctaUrl: "/dashboard",
          matches: matches.map((match) => ({
            displayId: match.displayId,
            displayName: match.displayName ?? match.firstName,
            profession: match.profession,
            currentCity: match.currentCity,
            currentCountryCode: match.currentCountryCode,
          })),
        },
        metadataJson: {
          category: "MATCH_MAIL",
          recipientProfileId: profile.id,
          activeMembership,
        },
      });
    }

    if (!queuedEmails.length) {
      return {
        queuedRecipients: 0,
        totalSuggestedMatches: 0,
        campaignId: null,
      };
    }

    const campaign = await this.prisma.mailCampaign.create({
      data: {
        name: `Match Mail ${new Date().toISOString()}`,
        templateKey: "match_mail_digest",
        subject:
          settings.frequency === "DAILY"
            ? "Your Borbodhu daily matches are ready"
            : "Your Borbodhu weekly matches are ready",
        bodyJson: {
          settings,
          totalSuggestedMatches,
        } as Prisma.InputJsonValue,
        audienceFiltersJson: {
          recipientGender: settings.recipientGender,
          preferredLocale: settings.preferredLocale,
          membershipState: settings.membershipState,
          outsideBangladeshOnly: settings.outsideBangladeshOnly,
          minimumProfileCompletionPct: settings.minimumProfileCompletionPct,
          includeNewMembersDays: settings.includeNewMembersDays,
        } as Prisma.InputJsonValue,
        status: MailCampaignStatus.QUEUED,
        scheduledAt,
        queuedAt: scheduledAt,
        recipientCount: queuedEmails.length,
        createdByUserId: actorUserId,
        metadataJson: {
          mode: "MATCH_MAIL",
          maxMatchesPerRecipient: settings.maxMatchesPerRecipient,
          totalSuggestedMatches,
        } as Prisma.InputJsonValue,
      },
    });

    await this.notificationsService.queueEmails(
      queuedEmails.map((item) => ({
        ...item,
        metadataJson: {
          ...(item.metadataJson ?? {}),
          campaignId: campaign.id,
        },
      })),
    );

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "MATCH_MAIL_QUEUED",
        targetType: "MailCampaign",
        targetId: campaign.id,
        description: `Queued match mail for ${queuedEmails.length} recipients`,
        metadataJson: {
          totalSuggestedMatches,
          settings,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      queuedRecipients: queuedEmails.length,
      totalSuggestedMatches,
      campaignId: campaign.id,
    };
  }

  async listMailCampaigns() {
    const campaigns = await this.prisma.mailCampaign.findMany({
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      templateKey: campaign.templateKey,
      subject: campaign.subject,
      status: campaign.status,
      scheduledAt: campaign.scheduledAt,
      queuedAt: campaign.queuedAt,
      recipientCount: campaign.recipientCount,
      createdAt: campaign.createdAt,
      bodyJson: campaign.bodyJson,
      audienceFiltersJson: campaign.audienceFiltersJson,
      metadataJson: campaign.metadataJson,
      createdByUser: campaign.createdByUser,
    }));
  }

  async previewMailCampaign(dto: PreviewMailCampaignDto) {
    const normalizedFilters = this.normalizeAudienceFilters(dto);

    return {
      filters: normalizedFilters,
      audience: await this.getAudiencePreviewFromFilters(
        normalizedFilters,
        dto.sampleSize ?? 6,
      ),
    };
  }

  async createMailCampaign(actorUserId: string, dto: CreateMailCampaignDto) {
    const normalizedFilters = this.normalizeAudienceFilters(dto);
    const audience = await this.getAudienceMembers(normalizedFilters, 1000);

    if (!audience.length) {
      throw new BadRequestException(
        "The selected audience is empty. Adjust your campaign filters first.",
      );
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException("Invalid campaign schedule.");
    }

    const campaign = await this.prisma.mailCampaign.create({
      data: {
        name: dto.name.trim(),
        templateKey: dto.templateKey?.trim() || "super_admin_campaign",
        subject: dto.subject.trim(),
        bodyJson: {
          headline: dto.headline.trim(),
          bodyText: dto.bodyText.trim(),
          ctaLabel: dto.ctaLabel?.trim() || "Open Borbodhu",
          ctaUrl: dto.ctaUrl?.trim() || "/dashboard",
        } as Prisma.InputJsonValue,
        audienceFiltersJson: normalizedFilters as Prisma.InputJsonValue,
        status: MailCampaignStatus.QUEUED,
        scheduledAt,
        queuedAt: new Date(),
        recipientCount: audience.length,
        createdByUserId: actorUserId,
      },
    });

    await this.notificationsService.queueEmails(
      audience.map((recipient) => ({
        userId: recipient.user.id,
        recipientEmail: recipient.user.email,
        templateKey: dto.templateKey?.trim() || "super_admin_campaign",
        subject: dto.subject.trim(),
        scheduledAt,
        bodyJson: {
          headline: dto.headline.trim(),
          bodyText: dto.bodyText.trim(),
          ctaLabel: dto.ctaLabel?.trim() || "Open Borbodhu",
          ctaUrl: dto.ctaUrl?.trim() || "/dashboard",
          recipientDisplayName: recipient.displayName ?? recipient.firstName,
        },
        metadataJson: {
          category: "SUPER_ADMIN_CAMPAIGN",
          campaignId: campaign.id,
          recipientProfileId: recipient.id,
        },
      })),
    );

    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        actorRole: RoleKey.SUPER_ADMIN,
        action: "MAIL_CAMPAIGN_CREATED",
        targetType: "MailCampaign",
        targetId: campaign.id,
        description: dto.name.trim(),
        metadataJson: {
          subject: dto.subject.trim(),
          filters: normalizedFilters,
          recipientCount: audience.length,
          scheduledAt: scheduledAt.toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return {
      id: campaign.id,
      name: campaign.name,
      recipientCount: audience.length,
      scheduledAt: campaign.scheduledAt,
      status: campaign.status,
    };
  }

  private async getAdminById(adminUserId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roles: {
              select: {
                role: true,
              },
            },
          },
        },
        permissions: {
          orderBy: {
            permissionKey: "asc",
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException("Admin user was not found.");
    }

    return {
      id: admin.id,
      displayName: admin.displayName,
      isSuperAdmin: admin.isSuperAdmin,
      status: admin.status,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      user: {
        id: admin.user.id,
        email: admin.user.email,
        status: admin.user.status,
        roles: admin.user.roles.map((role) => role.role),
      },
      permissions: admin.permissions.map((permission) => ({
        id: permission.id,
        key: permission.permissionKey,
        value: permission.permissionValue,
      })),
    };
  }

  private normalizePermissionKeys(permissions?: string[]) {
    return Array.from(
      new Set(
        (permissions ?? [])
          .map((permission) => permission.trim().toUpperCase())
          .filter(Boolean),
      ),
    );
  }

  private toMembershipPlanCreateData(
    dto: CreateMembershipPlanDto,
  ): Prisma.MembershipPlanUncheckedCreateInput {
    return {
      code: dto.code,
      nameEn: dto.nameEn.trim(),
      nameBn: dto.nameBn?.trim() || null,
      durationDays: dto.durationDays,
      bdtPrice: dto.bdtPrice,
      usdPrice: dto.usdPrice,
      contactLimit: dto.contactLimit,
      messageEnabled: dto.messageEnabled ?? false,
      contactViewEnabled: dto.contactViewEnabled ?? false,
      highlightEnabled: dto.highlightEnabled ?? false,
      supportTier: dto.supportTier?.trim() || null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private toMembershipPlanUpdateData(
    dto: UpdateMembershipPlanDto,
  ): Prisma.MembershipPlanUncheckedUpdateInput {
    const data: Prisma.MembershipPlanUncheckedUpdateInput = {};

    if (dto.code !== undefined) {
      data.code = dto.code;
    }

    if (dto.nameEn !== undefined) {
      data.nameEn = dto.nameEn.trim();
    }

    if (dto.nameBn !== undefined) {
      data.nameBn = dto.nameBn.trim() || null;
    }

    if (dto.durationDays !== undefined) {
      data.durationDays = dto.durationDays;
    }

    if (dto.bdtPrice !== undefined) {
      data.bdtPrice = dto.bdtPrice;
    }

    if (dto.usdPrice !== undefined) {
      data.usdPrice = dto.usdPrice;
    }

    if (dto.contactLimit !== undefined) {
      data.contactLimit = dto.contactLimit;
    }

    if (dto.messageEnabled !== undefined) {
      data.messageEnabled = dto.messageEnabled;
    }

    if (dto.contactViewEnabled !== undefined) {
      data.contactViewEnabled = dto.contactViewEnabled;
    }

    if (dto.highlightEnabled !== undefined) {
      data.highlightEnabled = dto.highlightEnabled;
    }

    if (dto.supportTier !== undefined) {
      data.supportTier = dto.supportTier.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    return data;
  }

  private toCouponCreateData(
    actorUserId: string,
    dto: CreateCouponDto,
  ): Prisma.CouponUncheckedCreateInput {
    return {
      code: dto.code,
      discountType: dto.discountType,
      amount: dto.amount ?? null,
      percent: dto.percent ?? null,
      currencyScope: dto.currencyScope?.trim() || null,
      appliesTo: dto.appliesTo?.trim() || "UPGRADE",
      maxTotalUses: dto.maxTotalUses ?? null,
      maxUsesPerUser: dto.maxUsesPerUser ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
      notes: dto.notes?.trim() || null,
      createdByAdminId: actorUserId,
    };
  }

  private toCouponUpdateData(dto: UpdateCouponDto): Prisma.CouponUncheckedUpdateInput {
    const data: Prisma.CouponUncheckedUpdateInput = {};

    if ("code" in dto && dto.code !== undefined) {
      data.code = dto.code;
    }

    if ("discountType" in dto && dto.discountType !== undefined) {
      data.discountType = dto.discountType;
    }

    if ("amount" in dto && dto.amount !== undefined) {
      data.amount = dto.amount;
    }

    if ("percent" in dto && dto.percent !== undefined) {
      data.percent = dto.percent;
    }

    if ("currencyScope" in dto && dto.currencyScope !== undefined) {
      data.currencyScope = dto.currencyScope.trim() || null;
    }

    if ("appliesTo" in dto && dto.appliesTo !== undefined) {
      data.appliesTo = dto.appliesTo.trim() || "UPGRADE";
    }

    if ("maxTotalUses" in dto && dto.maxTotalUses !== undefined) {
      data.maxTotalUses = dto.maxTotalUses;
    }

    if ("maxUsesPerUser" in dto && dto.maxUsesPerUser !== undefined) {
      data.maxUsesPerUser = dto.maxUsesPerUser;
    }

    if ("startsAt" in dto && dto.startsAt !== undefined) {
      data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    }

    if ("expiresAt" in dto && dto.expiresAt !== undefined) {
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    if ("isActive" in dto && dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if ("notes" in dto && dto.notes !== undefined) {
      data.notes = dto.notes.trim() || null;
    }

    return data;
  }

  private async readMatchMailSettings() {
    const existing = await this.prisma.platformSetting.findUnique({
      where: {
        key: MATCH_MAIL_SETTINGS_KEY,
      },
      select: {
        valueJson: true,
      },
    });

    return this.normalizeMatchMailSettings(existing?.valueJson ?? undefined);
  }

  private async readCommercialSettings(): Promise<CommercialSettings> {
    const existing = await this.prisma.platformSetting.findUnique({
      where: {
        key: COMMERCIAL_SETTINGS_KEY,
      },
      select: {
        valueJson: true,
      },
    });

    return normalizeCommercialSettings(
      (existing?.valueJson as Prisma.JsonObject | null | undefined) ?? null,
    );
  }

  private normalizeMatchMailSettings(input?: Prisma.JsonValue) {
    const record = (typeof input === "object" && input ? input : {}) as Record<
      string,
      unknown
    >;

    return {
      enabled:
        typeof record.enabled === "boolean"
          ? record.enabled
          : DEFAULT_MATCH_MAIL_SETTINGS.enabled,
      frequency:
        record.frequency === "DAILY" || record.frequency === "WEEKLY"
          ? record.frequency
          : DEFAULT_MATCH_MAIL_SETTINGS.frequency,
      dayOfWeek:
        typeof record.dayOfWeek === "string" && record.dayOfWeek
          ? record.dayOfWeek
          : DEFAULT_MATCH_MAIL_SETTINGS.dayOfWeek,
      timeZone:
        typeof record.timeZone === "string" && record.timeZone
          ? record.timeZone
          : DEFAULT_MATCH_MAIL_SETTINGS.timeZone,
      sendHourLocal:
        typeof record.sendHourLocal === "number"
          ? Math.max(0, Math.min(23, record.sendHourLocal))
          : DEFAULT_MATCH_MAIL_SETTINGS.sendHourLocal,
      sendMinuteLocal:
        typeof record.sendMinuteLocal === "number"
          ? Math.max(0, Math.min(59, record.sendMinuteLocal))
          : DEFAULT_MATCH_MAIL_SETTINGS.sendMinuteLocal,
      includeNewMembersDays:
        typeof record.includeNewMembersDays === "number"
          ? Math.max(1, Math.min(90, record.includeNewMembersDays))
          : DEFAULT_MATCH_MAIL_SETTINGS.includeNewMembersDays,
      minimumProfileCompletionPct:
        typeof record.minimumProfileCompletionPct === "number"
          ? Math.max(0, Math.min(100, record.minimumProfileCompletionPct))
          : DEFAULT_MATCH_MAIL_SETTINGS.minimumProfileCompletionPct,
      maxMatchesPerRecipient:
        typeof record.maxMatchesPerRecipient === "number"
          ? Math.max(1, Math.min(20, record.maxMatchesPerRecipient))
          : DEFAULT_MATCH_MAIL_SETTINGS.maxMatchesPerRecipient,
      membershipState:
        record.membershipState === "PAID" ||
        record.membershipState === "FREE" ||
        record.membershipState === "ANY"
          ? record.membershipState
          : DEFAULT_MATCH_MAIL_SETTINGS.membershipState,
      recipientGender:
        record.recipientGender === GenderKey.MAN ||
        record.recipientGender === GenderKey.WOMAN
          ? record.recipientGender
          : null,
      preferredLocale:
        record.preferredLocale === LocaleKey.EN ||
        record.preferredLocale === LocaleKey.BN
          ? record.preferredLocale
          : null,
      outsideBangladeshOnly:
        typeof record.outsideBangladeshOnly === "boolean"
          ? record.outsideBangladeshOnly
          : DEFAULT_MATCH_MAIL_SETTINGS.outsideBangladeshOnly,
    } satisfies MatchMailSettings;
  }

  private normalizeAudienceFilters(dto: PreviewMailCampaignDto): AudienceFilters {
    const filters: AudienceFilters = {};

    if (dto.recipientGender) {
      filters.recipientGender = dto.recipientGender as GenderKey;
    }

    if (dto.currentCountryCode) {
      filters.currentCountryCode = dto.currentCountryCode.trim().toUpperCase();
    }

    if (dto.homeCountryCode) {
      filters.homeCountryCode = dto.homeCountryCode.trim().toUpperCase();
    }

    if (dto.preferredLocale) {
      filters.preferredLocale = dto.preferredLocale as LocaleKey;
    }

    if (dto.membershipState) {
      filters.membershipState = dto.membershipState as "ANY" | "PAID" | "FREE";
    }

    if (dto.outsideBangladeshOnly !== undefined) {
      filters.outsideBangladeshOnly = dto.outsideBangladeshOnly;
    }

    if (dto.minimumProfileCompletionPct !== undefined) {
      filters.minimumProfileCompletionPct = dto.minimumProfileCompletionPct;
    }

    return filters;
  }

  private getActiveMembershipWhere(now: Date): Prisma.MembershipWhereInput {
    return {
      status: MembershipStatus.ACTIVE,
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    };
  }

  private buildAudienceWhere(
    filters: AudienceFilters,
    now: Date,
  ): Prisma.MemberProfileWhereInput {
    const where: Prisma.MemberProfileWhereInput = {
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      user: {
        status: UserStatus.ACTIVE,
        preferredLocale: filters.preferredLocale,
      },
      gender: filters.recipientGender,
      currentCountryCode: filters.currentCountryCode,
      homeCountryCode: filters.homeCountryCode,
      profileCompletionPct:
        filters.minimumProfileCompletionPct !== undefined
          ? {
              gte: filters.minimumProfileCompletionPct,
            }
          : undefined,
    };

    if (filters.membershipState === "PAID") {
      where.memberships = {
        some: this.getActiveMembershipWhere(now),
      };
    }

    if (filters.membershipState === "FREE") {
      where.memberships = {
        none: this.getActiveMembershipWhere(now),
      };
    }

    if (filters.outsideBangladeshOnly) {
      where.NOT = [{ currentCountryCode: "BD" }];
    }

    return where;
  }

  private async getAudienceMembers(filters: AudienceFilters, maxResults: number) {
    return this.prisma.memberProfile.findMany({
      where: this.buildAudienceWhere(filters, new Date()),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            preferredLocale: true,
          },
        },
        memberships: {
          where: this.getActiveMembershipWhere(new Date()),
          include: {
            membershipPlan: {
              select: {
                code: true,
                nameEn: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: maxResults,
    });
  }

  private async getAudiencePreviewFromFilters(
    filters: AudienceFilters,
    sampleSize: number,
  ) {
    const audience = await this.getAudienceMembers(filters, 1000);
    const sampleRecipients = audience.slice(0, sampleSize).map((profile) => ({
      userId: profile.user.id,
      email: profile.user.email,
      displayName: profile.displayName ?? profile.firstName,
      currentCountryCode: profile.currentCountryCode,
      preferredLocale: profile.user.preferredLocale,
      profileCompletionPct: profile.profileCompletionPct,
      activeMembershipCode: profile.memberships[0]?.membershipPlan?.code ?? null,
    }));

    const byLocale = sampleRecipients.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.preferredLocale] = (accumulator[item.preferredLocale] ?? 0) + 1;
      return accumulator;
    }, {});

    return {
      count: audience.length,
      sampleRecipients,
      byLocale,
    };
  }

  private buildRecentMatchWhere(
    recipientProfileId: string,
    recentSince: Date,
    minimumProfileCompletionPct: number,
    targetGender?: GenderKey,
    ageMin?: number,
    ageMax?: number,
  ): Prisma.MemberProfileWhereInput {
    const where: Prisma.MemberProfileWhereInput = {
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      id: {
        not: recipientProfileId,
      },
      createdAt: {
        gte: recentSince,
      },
      profileCompletionPct: {
        gte: minimumProfileCompletionPct,
      },
      gender: targetGender,
    };

    const birthDateRange = this.resolveBirthDateRange(ageMin, ageMax);

    if (birthDateRange) {
      where.birthDate = birthDateRange;
    }

    return where;
  }

  private resolveBirthDateRange(ageMin?: number, ageMax?: number) {
    if (ageMin === undefined && ageMax === undefined) {
      return undefined;
    }

    const now = new Date();
    const birthDate: Prisma.DateTimeFilter = {};

    if (ageMin !== undefined) {
      const latestBirthDate = new Date(
        now.getFullYear() - ageMin,
        now.getMonth(),
        now.getDate(),
      );
      birthDate.lte = latestBirthDate;
    }

    if (ageMax !== undefined) {
      const earliestBirthDate = new Date(
        now.getFullYear() - ageMax - 1,
        now.getMonth(),
        now.getDate() + 1,
      );
      birthDate.gte = earliestBirthDate;
    }

    return birthDate;
  }

  // ── Ghotok approval queue ──────────────────────────────────────────────────

  async listGhotoks(status?: string) {
    const where =
      status && status !== "ALL"
        ? { status: status as GhotokStatus }
        : undefined;

    const ghotoks = await this.prisma.ghotokProfile.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, email: true } },
        wallet: { select: { balance: true } },
        _count: { select: { managedMembers: true } },
      },
    });

    return ghotoks.map((g) => ({
      ...g,
      creditBalance: g.wallet?.balance ?? 0,
      managedMemberCount: g._count.managedMembers,
    }));
  }

  async listPendingGhotoks() {
    return this.listGhotoks("PENDING_REVIEW");
  }

  async approveGhotok(adminUserId: string, id: string, notes?: string) {
    const ghotok = await this.prisma.ghotokProfile.findUnique({ where: { id } });
    if (!ghotok) throw new NotFoundException("Ghotok profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.ghotokProfile.update({
        where: { id },
        data: { status: GhotokStatus.ACTIVE },
      });
      // Auto-create credit wallet with 0 balance if not already present
      await tx.ghotokCreditWallet.upsert({
        where: { ghotokProfileId: id },
        create: { ghotokProfileId: id, balance: 0 },
        update: {},
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "GHOTOK_APPROVED",
          targetType: "GhotokProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return g;
    });

    return { success: true, ghotok: updated };
  }

  async rejectGhotok(adminUserId: string, id: string, notes?: string) {
    const ghotok = await this.prisma.ghotokProfile.findUnique({ where: { id } });
    if (!ghotok) throw new NotFoundException("Ghotok profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.ghotokProfile.update({
        where: { id },
        data: { status: GhotokStatus.INACTIVE },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "GHOTOK_REJECTED",
          targetType: "GhotokProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return g;
    });

    return { success: true, ghotok: updated };
  }

  async setGhotokStatus(adminUserId: string, id: string, status: GhotokStatus, notes?: string) {
    const ghotok = await this.prisma.ghotokProfile.findUnique({ where: { id } });
    if (!ghotok) throw new NotFoundException("Ghotok profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.ghotokProfile.update({ where: { id }, data: { status } });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: `GHOTOK_STATUS_CHANGED_${status}`,
          targetType: "GhotokProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return g;
    });

    return { success: true, ghotok: updated };
  }

  async addGhotokCredits(adminUserId: string, id: string, amount: number, notes?: string) {
    if (amount <= 0) throw new BadRequestException("Amount must be positive.");
    const ghotok = await this.prisma.ghotokProfile.findUnique({ where: { id } });
    if (!ghotok) throw new NotFoundException("Ghotok profile not found.");

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.ghotokCreditWallet.upsert({
        where: { ghotokProfileId: id },
        create: { ghotokProfileId: id, balance: amount },
        update: { balance: { increment: amount } },
      });

      await tx.ghotokCreditLedger.create({
        data: {
          ghotokProfileId: id,
          entryType: "ADMIN_TOPUP",
          amount,
          balanceAfter: wallet.balance,
          notes: notes?.trim() ?? `Admin top-up of ${amount} credits`,
          createdByAdminId: adminUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "GHOTOK_CREDITS_ADDED",
          targetType: "GhotokProfile",
          targetId: id,
          description: `Added ${amount} credits. ${notes?.trim() ?? ""}`.trim(),
        },
      });

      return { success: true, newBalance: wallet.balance };
    });
  }

  // ── Vendor approval queue ──────────────────────────────────────────────────

  async listPendingVendors() {
    return this.prisma.vendorProfile.findMany({
      where: { status: VendorStatus.PENDING_REVIEW },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
  }

  async approveVendor(adminUserId: string, id: string, notes?: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vendorProfile.update({
        where: { id },
        data: { status: VendorStatus.ACTIVE },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "VENDOR_APPROVED",
          targetType: "VendorProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return v;
    });

    return { success: true, vendor: updated };
  }

  async rejectVendor(adminUserId: string, id: string, notes?: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vendorProfile.update({
        where: { id },
        data: { status: VendorStatus.REJECTED },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: "VENDOR_REJECTED",
          targetType: "VendorProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return v;
    });

    return { success: true, vendor: updated };
  }

  async listVendors(status?: string) {
    const where =
      status && status !== "ALL"
        ? { status: status as VendorStatus }
        : undefined;

    return this.prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { leads: true } },
      },
    });
  }

  async setVendorStatus(adminUserId: string, id: string, status: VendorStatus, notes?: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const v = await tx.vendorProfile.update({ where: { id }, data: { status } });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.SUPER_ADMIN,
          action: `VENDOR_STATUS_CHANGED_${status}`,
          targetType: "VendorProfile",
          targetId: id,
          description: notes?.trim(),
        },
      });
      return v;
    });

    return { success: true, vendor: updated };
  }

  private resolveDateRange(query: DateRangeQueryDto) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : now;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException("Invalid date range.");
    }

    if (query.to && query.to.length === 10) {
      to.setHours(23, 59, 59, 999);
    }

    if (from > to) {
      throw new BadRequestException("The `from` date must be before the `to` date.");
    }

    return { from, to };
  }
}
