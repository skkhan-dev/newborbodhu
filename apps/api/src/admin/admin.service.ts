import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ApprovalStatus,
  MediaPrivacyMode,
  PaymentStatus,
  Prisma,
  ProfileStatus,
  UserStatus,
} from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

import { BillingService } from "../billing/billing.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { ProfileReviewQueryDto } from "./dto/profile-review-query.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly storageService: StorageService,
  ) {}

  async getOverview() {
    const [activeProfiles, pendingProfiles, rejectedProfiles, cancelledProfiles, pendingManualPayments, paymentTotals, activeGhotoks, pendingGhotoks, activeVendors, pendingVendors] =
      await Promise.all([
        this.prisma.memberProfile.count({ where: { status: ProfileStatus.ACTIVE } }),
        this.prisma.memberProfile.count({ where: { approvalStatus: ApprovalStatus.PENDING } }),
        this.prisma.memberProfile.count({ where: { approvalStatus: ApprovalStatus.REJECTED } }),
        this.prisma.memberProfile.count({ where: { status: ProfileStatus.CANCELLED } }),
        this.prisma.payment.count({ where: { status: PaymentStatus.MANUAL_REVIEW } }),
        this.prisma.payment.aggregate({
          where: { status: { in: [PaymentStatus.PAID, PaymentStatus.MANUAL_APPROVED] } },
          _sum: { finalAmount: true },
        }),
        this.prisma.ghotokProfile.count({ where: { status: "ACTIVE" as any } }),
        this.prisma.ghotokProfile.count({ where: { status: "PENDING_REVIEW" as any } }),
        this.prisma.vendorProfile.count({ where: { status: "ACTIVE" as any } }),
        this.prisma.vendorProfile.count({ where: { status: "PENDING_REVIEW" as any } }),
      ]);

    return {
      profiles: {
        active: activeProfiles,
        pending: pendingProfiles,
        rejected: rejectedProfiles,
        cancelled: cancelledProfiles,
      },
      payments: {
        pendingManualReview: pendingManualPayments,
        collectedAmount: Number(paymentTotals._sum.finalAmount ?? 0),
      },
      ghotoks: {
        active: activeGhotoks,
        pending: pendingGhotoks,
      },
      vendors: {
        active: activeVendors,
        pending: pendingVendors,
      },
    };
  }

  async listProfileReviews(query: ProfileReviewQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.MemberProfileWhereInput = {
      approvalStatus: query.status ?? ApprovalStatus.PENDING,
    };

    const [items, total] = await Promise.all([
      this.prisma.memberProfile.findMany({
        where,
        orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, email: true, createdAt: true } },
          revisions: { orderBy: { revisionNumber: "desc" }, take: 1 },
          media: { take: 6, orderBy: { createdAt: "desc" } },
        },
      }),
      this.prisma.memberProfile.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: await Promise.all(
        items.map(async (item) => {
          // Quality score (0–100, formula-based)
          const qualityScore = this.computeQualityScore(item);

          // Duplicate detection: same firstName + lastName + birthDate among other approved/active profiles
          const possibleDuplicateOf = await this.findDuplicate(item);

          return {
            ...item,
            qualityScore,
            possibleDuplicateOf,
            media: await Promise.all(
              item.media.map(async (media) => ({
                ...media,
                storageUrl: await this.storageService.resolveMediaUrl(media.storagePath, {
                  privacyMode: media.privacyMode ?? MediaPrivacyMode.PUBLIC,
                  allowPrivateAccess: true,
                }),
                thumbnailUrl: await this.storageService.resolveMediaUrl(media.thumbnailPath, {
                  privacyMode: media.privacyMode ?? MediaPrivacyMode.PUBLIC,
                  allowPrivateAccess: true,
                }),
              })),
            ),
          };
        }),
      ),
    };
  }

  private computeQualityScore(profile: {
    profileCompletionPct: number;
    aboutMe: string | null;
    firstName: string;
    currentCountryCode: string | null;
    religion: string | null;
    educationLevel: string | null;
    profession: string | null;
  }): number {
    let score = profile.profileCompletionPct * 0.5; // base: completion pct is 50%
    if (profile.aboutMe && profile.aboutMe.length > 80) score += 20;
    else if (profile.aboutMe && profile.aboutMe.length > 30) score += 10;
    if (profile.currentCountryCode) score += 10;
    if (profile.religion) score += 5;
    if (profile.educationLevel) score += 8;
    if (profile.profession) score += 7;
    return Math.min(100, Math.round(score));
  }

  private async findDuplicate(profile: {
    id: string;
    firstName: string;
    lastName: string | null;
    birthDate: Date | null;
  }): Promise<string | null> {
    if (!profile.birthDate || !profile.lastName) return null;
    const duplicate = await this.prisma.memberProfile.findFirst({
      where: {
        id: { not: profile.id },
        firstName: { equals: profile.firstName, mode: "insensitive" },
        lastName: { equals: profile.lastName, mode: "insensitive" },
        birthDate: profile.birthDate,
        status: { in: [ProfileStatus.ACTIVE, ProfileStatus.PENDING_REVIEW] },
      },
      select: { displayId: true },
    });
    return duplicate?.displayId ?? null;
  }

  // ── Claude AI: Suggest rejection reason ───────────────────────────────────

  async suggestRejectionReason(memberProfileId: string): Promise<{ suggestion: string }> {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id: memberProfileId },
      include: {
        user: { select: { email: true } },
        media: { select: { mediaType: true, approvalStatus: true }, take: 10 },
      },
    });
    if (!profile) throw new NotFoundException("Profile not found.");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        suggestion:
          "Please provide a rejection reason explaining what the member needs to fix before their profile can be approved.",
      };
    }

    const client = new Anthropic({ apiKey });

    const photoCount = profile.media.filter((m) => m.mediaType === "PROFILE_PHOTO").length;
    const approvedPhotos = profile.media.filter(
      (m) => m.mediaType === "PROFILE_PHOTO" && m.approvalStatus === "APPROVED",
    ).length;

    const prompt = `You are an admin assistant for Borbodhu.com, a Bangladeshi matrimony platform.
A member profile has been submitted for review. Based on the profile data below, write a concise,
respectful rejection reason in English (2-4 sentences) that clearly tells the member what they need to fix.
Be specific about what is missing or incomplete. If photos are missing or unapproved, say so.
Do not make up information that isn't in the data.

Profile data:
- Name: ${profile.firstName} ${profile.lastName ?? ""}
- Gender: ${profile.gender}
- Completion: ${profile.profileCompletionPct}%
- About me: ${profile.aboutMe ? `"${profile.aboutMe.slice(0, 200)}"` : "Not provided"}
- Education: ${profile.educationLevel ?? "Not provided"}
- Profession: ${profile.profession ?? "Not provided"}
- Religion: ${profile.religion ?? "Not provided"}
- Location: ${[profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ") || "Not provided"}
- Photos uploaded: ${photoCount}, approved: ${approvedPhotos}

Write only the rejection reason text, nothing else.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    return { suggestion: text.trim() };
  }

  async approveProfile(adminUserId: string, memberProfileId: string, notes?: string) {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id: memberProfileId },
      include: {
        revisions: {
          orderBy: {
            revisionNumber: "desc",
          },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Member profile was not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.memberProfile.update({
        where: { id: memberProfileId },
        data: {
          status: ProfileStatus.ACTIVE,
          approvalStatus: ApprovalStatus.APPROVED,
          approvedAt: new Date(),
          approvedByAdminId: adminUserId,
        },
      });

      if (profile.revisions[0]) {
        await tx.profileRevision.update({
          where: { id: profile.revisions[0].id },
          data: {
            reviewStatus: ApprovalStatus.APPROVED,
            reviewNotes: notes?.trim(),
            reviewedByAdminId: adminUserId,
            reviewedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "PROFILE_APPROVED",
          targetType: "MemberProfile",
          targetId: memberProfileId,
          description: notes?.trim(),
        },
      });
    });

    return {
      success: true,
      memberProfileId,
      approvalStatus: ApprovalStatus.APPROVED,
      status: ProfileStatus.ACTIVE,
    };
  }

  async rejectProfile(adminUserId: string, memberProfileId: string, notes?: string) {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id: memberProfileId },
      include: {
        revisions: {
          orderBy: {
            revisionNumber: "desc",
          },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Member profile was not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.memberProfile.update({
        where: { id: memberProfileId },
        data: {
          status: ProfileStatus.REJECTED,
          approvalStatus: ApprovalStatus.REJECTED,
        },
      });

      if (profile.revisions[0]) {
        await tx.profileRevision.update({
          where: { id: profile.revisions[0].id },
          data: {
            reviewStatus: ApprovalStatus.REJECTED,
            reviewNotes: notes?.trim(),
            reviewedByAdminId: adminUserId,
            reviewedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "PROFILE_REJECTED",
          targetType: "MemberProfile",
          targetId: memberProfileId,
          description: notes?.trim(),
        },
      });
    });

    return {
      success: true,
      memberProfileId,
      approvalStatus: ApprovalStatus.REJECTED,
      status: ProfileStatus.REJECTED,
    };
  }

  listManualReviewPayments() {
    return this.billingService.listManualReviewPayments();
  }

  approveManualPayment(paymentId: string, adminUserId: string, notes?: string) {
    return this.billingService.approveManualPayment(paymentId, adminUserId, notes);
  }

  rejectManualPayment(paymentId: string, adminUserId: string, notes?: string) {
    return this.billingService.rejectManualPayment(paymentId, adminUserId, notes);
  }

  // ── Member Search ──────────────────────────────────────────────────────────

  async searchMembers(query: {
    q?: string;
    status?: string;
    gender?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 50);
    const keyword = query.q?.trim();

    const where: Prisma.MemberProfileWhereInput = {
      ...(query.status ? { status: query.status as ProfileStatus } : {}),
      ...(query.gender ? { gender: query.gender as Prisma.EnumGenderKeyFilter } : {}),
      ...(keyword
        ? {
            OR: [
              { firstName: { contains: keyword, mode: "insensitive" } },
              { lastName: { contains: keyword, mode: "insensitive" } },
              { displayName: { contains: keyword, mode: "insensitive" } },
              { displayId: { contains: keyword, mode: "insensitive" } },
              { user: { email: { contains: keyword, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.memberProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, email: true, status: true, createdAt: true },
          },
          media: {
            where: { isPrimary: true },
            take: 1,
            select: { id: true, storagePath: true, privacyMode: true, approvalStatus: true },
          },
        },
      }),
      this.prisma.memberProfile.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: await Promise.all(
        items.map(async (m) => ({
          id: m.id,
          displayId: m.displayId,
          firstName: m.firstName,
          lastName: m.lastName,
          displayName: m.displayName,
          gender: m.gender,
          status: m.status,
          approvalStatus: m.approvalStatus,
          profileCompletionPct: m.profileCompletionPct,
          currentCountryCode: m.currentCountryCode,
          currentCity: m.currentCity,
          phone: m.phone,
          createdAt: m.createdAt,
          user: m.user,
          primaryPhotoUrl: m.media[0]
            ? await this.storageService.resolveMediaUrl(m.media[0].storagePath, {
                privacyMode: m.media[0].privacyMode ?? MediaPrivacyMode.PUBLIC,
                allowPrivateAccess: true,
              })
            : null,
        })),
      ),
    };
  }

  // ── User suspension ────────────────────────────────────────────────────────

  async setUserStatus(
    adminUserId: string,
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: status as UserStatus },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
          targetType: "User",
          targetId: userId,
        },
      });
    });

    return { success: true, userId, status };
  }

  // ── Pending photo queue ────────────────────────────────────────────────────

  async listPendingPhotos() {
    const items = await this.prisma.profileMedia.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        memberProfile: {
          select: {
            id: true,
            displayId: true,
            displayName: true,
            firstName: true,
          },
        },
      },
    });

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        storageUrl: await this.storageService.resolveMediaUrl(item.storagePath, {
          privacyMode: item.privacyMode ?? MediaPrivacyMode.PUBLIC,
          allowPrivateAccess: true,
        }),
        thumbnailUrl: await this.storageService.resolveMediaUrl(item.thumbnailPath, {
          privacyMode: item.privacyMode ?? MediaPrivacyMode.PUBLIC,
          allowPrivateAccess: true,
        }),
      })),
    );
  }

  // ── Photo moderation ───────────────────────────────────────────────────────

  async moderatePhoto(
    adminUserId: string,
    mediaId: string,
    action: "approve" | "reject",
    notes?: string,
  ) {
    const media = await this.prisma.profileMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, memberProfileId: true },
    });
    if (!media) throw new NotFoundException("Photo not found.");

    const newStatus =
      action === "approve" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.profileMedia.update({
        where: { id: mediaId },
        data: { approvalStatus: newStatus },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: action === "approve" ? "PHOTO_APPROVED" : "PHOTO_REJECTED",
          targetType: "ProfileMedia",
          targetId: mediaId,
          description: notes?.trim(),
        },
      });
    });

    return { success: true, mediaId, approvalStatus: newStatus };
  }

  // ── Audit log ──────────────────────────────────────────────────────────────

  async getAuditLog(query: { page?: number; pageSize?: number; action?: string }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 30, 100);

    const where: Prisma.AuditLogWhereInput = query.action
      ? { action: { contains: query.action, mode: "insensitive" } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actorUser: { select: { email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { total, page, pageSize, items };
  }
}
