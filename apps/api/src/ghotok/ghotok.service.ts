import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ApprovalStatus,
  GhotokStatus,
  GhotokLinkStatus,
  InteractionStatus,
  InteractionType,
  PrismaClient,
  ProfileOwnerType,
  ProfileStatus,
  RoleKey,
  UserStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateGhotokMemberDto } from "./dto/create-ghotok-member.dto";
import { ManageImpersonationDto } from "./dto/manage-impersonation.dto";

@Injectable()
export class GhotokService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async listPublicGhotoks(filters?: { q?: string; gender?: string }) {
    const where: Record<string, unknown> = { status: GhotokStatus.ACTIVE };
    if (filters?.q?.trim()) {
      where["displayName"] = { contains: filters.q.trim(), mode: "insensitive" };
    }
    if (filters?.gender) {
      where["gender"] = filters.gender;
    }

    const ghotoks = await this.prisma.ghotokProfile.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            managedMembers: true,
          },
        },
      },
    });

    return Promise.all(ghotoks.map(async (ghotok) => ({
      id: ghotok.id,
      slug: this.buildPublicSlug(ghotok.displayName, ghotok.id),
      displayName: ghotok.displayName,
      status: ghotok.status,
      bioEn: ghotok.bioEn,
      bioBn: ghotok.bioBn,
      address: ghotok.address,
      phone: ghotok.phone,
      email: ghotok.email,
      photoUrl: await this.storageService.resolveMediaUrl(ghotok.photoPath, { privacyMode: "PUBLIC", allowPrivateAccess: false }),
      managedCount: ghotok._count.managedMembers,
      publicHeadline: this.buildPublicHeadline(ghotok),
    })));
  }

  async getPublicGhotokBySlug(slug: string) {
    const ghotoks = await this.prisma.ghotokProfile.findMany({
      where: {
        status: GhotokStatus.ACTIVE,
      },
      include: {
        managedMembers: {
          where: {
            status: ProfileStatus.ACTIVE,
            approvalStatus: ApprovalStatus.APPROVED,
          },
          select: {
            id: true,
            displayId: true,
            gender: true,
            religion: true,
            currentCity: true,
            currentCountryCode: true,
          },
          take: 6,
        },
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    });

    const match = ghotoks.find(
      (ghotok) => this.buildPublicSlug(ghotok.displayName, ghotok.id) === slug,
    );

    if (!match) {
      throw new NotFoundException("Public ghotok profile was not found.");
    }

    const photoUrl = await this.storageService.resolveMediaUrl(match.photoPath, { privacyMode: "PUBLIC", allowPrivateAccess: false });

    return {
      id: match.id,
      slug,
      displayName: match.displayName,
      bioEn: match.bioEn,
      bioBn: match.bioBn,
      address: match.address,
      phone: match.phone,
      email: match.email,
      photoUrl,
      managedCount: match.managedMembers.length,
      publicHeadline: this.buildPublicHeadline(match),
      seo: {
        title: `${match.displayName} | Trusted Bangladeshi Ghotok | borbodhu.com`,
        description: `${
          match.displayName
        } is a trusted Borbodhu matchmaker helping Bangladeshi families with culturally aligned introductions${
          match.address ? ` in ${match.address}.` : "."
        }`,
      },
      sampleProfiles: match.managedMembers.map((member) => ({
        displayId: member.displayId,
        gender: member.gender,
        religion: member.religion,
        location:
          [member.currentCity, member.currentCountryCode].filter(Boolean).join(", ") ||
          "Bangladesh",
      })),
      walletBalance: match.wallet?.balance ?? 0,
    };
  }

  async getDashboard(userId: string) {
    const ghotok = await this.requireGhotok(userId);
    const [managedCounts, recentLedger] = await Promise.all([
      this.prisma.memberProfile.groupBy({
        by: ["status"],
        where: {
          managedByGhotokId: ghotok.id,
        },
        _count: {
          status: true,
        },
      }),
      this.prisma.ghotokCreditLedger.findMany({
        where: {
          ghotokProfileId: ghotok.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    const photoUrl = await this.storageService.resolveMediaUrl(ghotok.photoPath, {
      privacyMode: "PUBLIC",
      allowPrivateAccess: false,
    });

    return {
      profile: {
        id: ghotok.id,
        displayName: ghotok.displayName,
        status: ghotok.status,
        email: ghotok.email,
        phone: ghotok.phone,
        bioEn: ghotok.bioEn,
        bioBn: ghotok.bioBn,
        address: ghotok.address,
        feeAmount: ghotok.feeAmount,
        feeCurrency: ghotok.feeCurrency,
        photoUrl,
      },
      wallet: {
        balance: ghotok.wallet?.balance ?? 0,
      },
      managedCounts,
      recentLedger,
    };
  }

  async listManagedMembers(userId: string) {
    const ghotok = await this.requireGhotok(userId);
    return this.prisma.memberProfile.findMany({
      where: {
        managedByGhotokId: ghotok.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        gender: true,
        lookingFor: true,
        status: true,
        approvalStatus: true,
        createdAt: true,
      },
    });
  }

  async createManagedMember(userId: string, dto: CreateGhotokMemberDto) {
    const ghotok = await this.requireGhotok(userId);
    const email =
      dto.memberEmail?.trim().toLowerCase() ??
      `managed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@managed.borbodhu.local`;

    const member = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          preferredLocale: ghotok.user.preferredLocale,
          status: UserStatus.PENDING,
          roles: {
            create: {
              role: RoleKey.MEMBER,
            },
          },
          memberProfile: {
            create: {
              firstName: dto.firstName.trim(),
              lastName: dto.lastName?.trim(),
              displayName: [dto.firstName, dto.lastName].filter(Boolean).join(" "),
              gender: dto.gender,
              lookingFor: dto.lookingFor,
              profileOwnerType: ProfileOwnerType.GHOTOK,
              managedByGhotokId: ghotok.id,
              createdByActorType: RoleKey.GHOTOK,
              createdByActorId: ghotok.id,
              currentCountryCode: dto.currentCountryCode?.trim().toUpperCase(),
              guardianName: ghotok.displayName,
              guardianRelation: "Ghotok",
              guardianPhone: dto.memberPhone?.trim() ?? ghotok.phone ?? undefined,
              guardianEmail: ghotok.email ?? undefined,
              status: ProfileStatus.PENDING_REVIEW,
              approvalStatus: ApprovalStatus.PENDING,
              partnerPreference: {
                create: {
                  gender: dto.lookingFor,
                },
              },
            },
          },
        },
        include: {
          memberProfile: true,
        },
      });

      await tx.ghotokMemberLink.create({
        data: {
          ghotokProfileId: ghotok.id,
          memberProfileId: createdUser.memberProfile!.id,
          status: GhotokLinkStatus.ACTIVE,
        },
      });

      return createdUser.memberProfile;
    });

    return member;
  }

  async getActiveImpersonation(userId: string) {
    const prisma = this.prisma as PrismaClient;
    const ghotok = await this.requireGhotok(userId);

    return prisma.ghotokImpersonationSession.findFirst({
      where: {
        ghotokProfileId: ghotok.id,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        memberProfile: {
          select: {
            id: true,
            displayId: true,
            displayName: true,
            firstName: true,
            status: true,
            approvalStatus: true,
          },
        },
      },
    });
  }

  async startImpersonation(
    userId: string,
    memberProfileId: string,
    dto: ManageImpersonationDto,
  ) {
    const prisma = this.prisma as PrismaClient;
    const ghotok = await this.requireGhotok(userId);
    const managedMember = await this.prisma.memberProfile.findFirst({
      where: {
        id: memberProfileId,
        managedByGhotokId: ghotok.id,
      },
      select: {
        id: true,
      },
    });

    if (!managedMember) {
      throw new NotFoundException("Managed member was not found.");
    }

    await prisma.ghotokImpersonationSession.updateMany({
      where: {
        ghotokProfileId: ghotok.id,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    const session = await prisma.ghotokImpersonationSession.create({
      data: {
        ghotokProfileId: ghotok.id,
        memberProfileId: managedMember.id,
        startedByUserId: userId,
        reason: dto.reason?.trim(),
      },
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

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        actorRole: RoleKey.GHOTOK,
        action: "GHOTOK_IMPERSONATION_STARTED",
        targetType: "GhotokImpersonationSession",
        targetId: session.id,
        description: dto.reason?.trim(),
        metadataJson: { memberProfileId: managedMember.id },
      },
    });

    return session;
  }

  async endImpersonation(userId: string, sessionId: string, dto: ManageImpersonationDto) {
    const prisma = this.prisma as PrismaClient;
    const session = await this.requireActiveImpersonationSession(userId, sessionId);

    const ended = await prisma.ghotokImpersonationSession.update({
      where: { id: session.id },
      data: {
        endedAt: new Date(),
        reason: dto.reason?.trim() ?? session.reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        actorRole: RoleKey.GHOTOK,
        action: "GHOTOK_IMPERSONATION_ENDED",
        targetType: "GhotokImpersonationSession",
        targetId: session.id,
        metadataJson: { memberProfileId: session.memberProfileId, creditsSpent: session.creditsSpent },
      },
    });

    return ended;
  }

  async consumeContactView(
    userId: string,
    sessionId: string,
    targetMemberProfileId: string,
  ) {
    const session = await this.requireActiveImpersonationSession(userId, sessionId);
    const ghotok = await this.requireGhotok(userId);

    if (session.memberProfileId === targetMemberProfileId) {
      throw new ForbiddenException("You cannot spend credit on the impersonated member.");
    }

    const targetProfile = await this.prisma.memberProfile.findUnique({
      where: {
        id: targetMemberProfileId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!targetProfile) {
      throw new NotFoundException("Target member was not found.");
    }

    await this.ensureNotBlocked(session.memberProfileId, targetProfile.id);

    const existingUnlock = await this.prisma.contactUnlock.findUnique({
      where: {
        viewerMemberProfileId_targetMemberProfileId: {
          viewerMemberProfileId: session.memberProfileId,
          targetMemberProfileId: targetProfile.id,
        },
      },
    });

    if (existingUnlock) {
      return {
        usedCredit: false,
        contact: this.toContactPayload(targetProfile),
      };
    }

    const wallet = await this.prisma.ghotokCreditWallet.findUnique({
      where: {
        ghotokProfileId: ghotok.id,
      },
    });

    if (!wallet || wallet.balance <= 0) {
      throw new ForbiddenException("No credit balance is available for this action.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const newBalance = wallet.balance - 1;

      await tx.ghotokCreditWallet.update({
        where: {
          ghotokProfileId: ghotok.id,
        },
        data: {
          balance: newBalance,
        },
      });

      await tx.ghotokCreditLedger.create({
        data: {
          ghotokProfileId: ghotok.id,
          entryType: "CONTACT_VIEW",
          amount: -1,
          balanceAfter: newBalance,
          referenceType: "GHOTOK_IMPERSONATION",
          referenceId: session.id,
          notes: `Viewed contact for ${targetProfile.displayId}`,
        },
      });

      await tx.contactUnlock.create({
        data: {
          viewerMemberProfileId: session.memberProfileId,
          targetMemberProfileId: targetProfile.id,
          unlockSource: "GHOTOK_IMPERSONATION_CREDIT",
        },
      });

      return {
        balanceAfter: newBalance,
      };
    });

    // Update session stats (best-effort, non-critical)
    await (this.prisma as PrismaClient).ghotokImpersonationSession.update({
      where: { id: session.id },
      data: { creditsSpent: { increment: 1 }, lastActionAt: new Date() },
    });

    return {
      usedCredit: true,
      balanceAfter: updated.balanceAfter,
      contact: this.toContactPayload(targetProfile),
    };
  }

  async updateProfile(
    userId: string,
    dto: {
      displayName?: string;
      bioEn?: string;
      bioBn?: string;
      phone?: string;
      address?: string;
      feeAmount?: number;
      feeCurrency?: string;
    },
  ) {
    const ghotok = await this.requireGhotok(userId);

    return this.prisma.ghotokProfile.update({
      where: { id: ghotok.id },
      data: {
        displayName: dto.displayName?.trim(),
        bioEn: dto.bioEn?.trim(),
        bioBn: dto.bioBn?.trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        feeAmount: dto.feeAmount,
        feeCurrency: dto.feeCurrency?.trim(),
      },
      select: {
        id: true,
        displayName: true,
        bioEn: true,
        bioBn: true,
        phone: true,
        address: true,
        feeAmount: true,
        feeCurrency: true,
        status: true,
      },
    });
  }

  async createPhotoUploadRequest(userId: string, fileName: string, mimeType: string) {
    const ghotok = await this.requireGhotok(userId);
    return this.storageService.createMemberUploadRequest({
      ownerId: ghotok.id,
      fileName,
      mimeType,
      mediaType: "PROFILE_PHOTO" as any,
    });
  }

  async commitPhoto(userId: string, storagePath: string) {
    const ghotok = await this.requireGhotok(userId);
    const normalized = this.storageService.normalizeStoragePath(storagePath);
    return this.prisma.ghotokProfile.update({
      where: { id: ghotok.id },
      data: { photoPath: normalized },
      select: { id: true, photoPath: true },
    });
  }

  private async requireGhotok(userId: string) {
    const ghotok = await this.prisma.ghotokProfile.findUnique({
      where: { userId },
      include: {
        wallet: true,
        user: {
          select: {
            preferredLocale: true,
          },
        },
      },
    });

    if (!ghotok) {
      throw new NotFoundException("Ghotok profile was not found.");
    }

    return ghotok;
  }

  private async requireActiveImpersonationSession(userId: string, sessionId: string) {
    const prisma = this.prisma as PrismaClient;
    const ghotok = await this.requireGhotok(userId);
    const session = await prisma.ghotokImpersonationSession.findFirst({
      where: {
        id: sessionId,
        ghotokProfileId: ghotok.id,
        endedAt: null,
      },
    });

    if (!session) {
      throw new NotFoundException("Active impersonation session was not found.");
    }

    return session;
  }

  private async ensureNotBlocked(
    actorMemberProfileId: string,
    targetMemberProfileId: string,
  ) {
    const block = await this.prisma.interaction.findFirst({
      where: {
        interactionType: InteractionType.BLOCK,
        status: InteractionStatus.ACTIVE,
        OR: [
          {
            actorMemberProfileId,
            targetMemberProfileId,
          },
          {
            actorMemberProfileId: targetMemberProfileId,
            targetMemberProfileId: actorMemberProfileId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (block) {
      throw new ForbiddenException("Contact is blocked between these profiles.");
    }
  }

  private toContactPayload(
    targetProfile: {
      guardianPhone: string | null;
      guardianEmail: string | null;
      user: { email: string | null };
      displayId: string;
    },
  ) {
    return {
      displayId: targetProfile.displayId,
      guardianPhone: targetProfile.guardianPhone,
      guardianEmail: targetProfile.guardianEmail ?? targetProfile.user.email,
    };
  }

  private buildPublicSlug(displayName: string, id: string) {
    return `${displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")}-${id.slice(-6)}`;
  }

  private buildPublicHeadline(ghotok: {
    address: string | null;
    bioEn: string | null;
    managedMembers?: Array<unknown>;
    _count?: { managedMembers: number };
  }) {
    const managedCount =
      ghotok._count?.managedMembers ?? ghotok.managedMembers?.length ?? 0;

    return [
      managedCount ? `${managedCount} managed profiles` : "Trusted family-guided introductions",
      ghotok.address ?? null,
      ghotok.bioEn ? ghotok.bioEn.split(".")[0] : null,
    ]
      .filter(Boolean)
      .join(" • ");
  }
}
