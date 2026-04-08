import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MediaApprovalStatus, MediaPrivacyMode, MediaType, RoleKey } from "@prisma/client";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateMediaUploadRequestDto } from "./dto/create-media-upload-request.dto";
import { ModerationService } from "./moderation.service";
import { RegisterMemberMediaDto } from "./dto/register-member-media.dto";
import { ReviewMediaDto } from "./dto/review-media.dto";
import { UpdateMemberMediaDto } from "./dto/update-member-media.dto";

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
    private readonly moderationService: ModerationService,
  ) {}

  async listMyMedia(userId: string) {
    const memberProfile = await this.requireMemberProfile(userId);
    const items = await this.prisma.profileMedia.findMany({
      where: {
        memberProfileId: memberProfile.id,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return Promise.all(items.map((item) => this.enrichMediaPayload(item, true)));
  }

  async createUploadRequest(userId: string, dto: CreateMediaUploadRequestDto) {
    const memberProfile = await this.requireMemberProfile(userId);

    return this.storageService.createMemberUploadRequest({
      ownerId: memberProfile.id,
      fileName: dto.fileName.trim(),
      mimeType: dto.mimeType.trim(),
      mediaType: dto.mediaType,
      privacyMode: dto.privacyMode,
    });
  }

  async registerMyMedia(userId: string, dto: RegisterMemberMediaDto) {
    const memberProfile = await this.requireMemberProfile(userId);
    this.storageService.assertMemberOwnedStoragePath(memberProfile.id, dto.storagePath);

    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary && dto.mediaType === MediaType.PROFILE_PHOTO) {
        await tx.profileMedia.updateMany({
          where: {
            memberProfileId: memberProfile.id,
            mediaType: MediaType.PROFILE_PHOTO,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.profileMedia.create({
        data: {
          memberProfileId: memberProfile.id,
          uploadedByUserId: userId,
          mediaType: dto.mediaType,
          storagePath: this.storageService.normalizeStoragePath(dto.storagePath),
          thumbnailPath: dto.thumbnailPath
            ? this.storageService.normalizeStoragePath(dto.thumbnailPath)
            : undefined,
          mimeType: dto.mimeType?.trim(),
          privacyMode: dto.privacyMode,
          isPrimary: dto.isPrimary ?? false,
          approvalStatus: MediaApprovalStatus.PENDING,
        },
      });
    });

    // Fire-and-forget Vision SafeSearch — don't await, don't block the response
    const bucket = process.env.MEDIA_BUCKET_NAME;
    if (bucket && created.mediaType === "PROFILE_PHOTO") {
      const gcsUri = `gs://${bucket}/${created.storagePath}`;
      this.moderationService.checkPhoto(gcsUri).then((result) => {
        if (result) {
          void (this.prisma.profileMedia as unknown as { update: (args: { where: { id: string }; data: { aiModerationResult: object } }) => Promise<unknown> }).update({
            where: { id: created.id },
            data: { aiModerationResult: result as object },
          });
        }
      }).catch(() => { /* non-critical */ });
    }

    return this.enrichMediaPayload(created, true);
  }

  async updateMyMedia(userId: string, mediaId: string, dto: UpdateMemberMediaDto) {
    const media = await this.requireOwnedMedia(userId, mediaId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary && media.mediaType === MediaType.PROFILE_PHOTO) {
        await tx.profileMedia.updateMany({
          where: {
            memberProfileId: media.memberProfileId,
            mediaType: MediaType.PROFILE_PHOTO,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.profileMedia.update({
        where: {
          id: mediaId,
        },
        data: {
          privacyMode: dto.privacyMode,
          isPrimary: dto.isPrimary,
        },
      });
    });

    return this.enrichMediaPayload(updated, true);
  }

  async deleteMyMedia(userId: string, mediaId: string) {
    const media = await this.requireOwnedMedia(userId, mediaId);
    await this.prisma.profileMedia.delete({ where: { id: media.id } });
    // Attempt GCS cleanup (best-effort)
    try {
      await this.storageService.deleteObject(media.storagePath);
    } catch {
      // Ignore storage deletion failures — record is already removed
    }
    return { deleted: true };
  }

  async listPendingMediaReviews() {
    const items = await this.prisma.profileMedia.findMany({
      where: {
        approvalStatus: MediaApprovalStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        memberProfile: {
          select: {
            id: true,
            displayId: true,
            displayName: true,
            firstName: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return Promise.all(items.map((item) => this.enrichMediaPayload(item, true)));
  }

  async reviewMedia(adminUserId: string, mediaId: string, dto: ReviewMediaDto) {
    const media = await this.prisma.profileMedia.findUnique({
      where: { id: mediaId },
      include: {
        memberProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException("Media record was not found.");
    }

    const approvalStatus =
      dto.decision === "approve"
        ? MediaApprovalStatus.APPROVED
        : MediaApprovalStatus.REJECTED;

    const updatedMedia = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.profileMedia.update({
        where: { id: mediaId },
        data: {
          approvalStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          actorRole: RoleKey.ADMIN,
          action:
            approvalStatus === MediaApprovalStatus.APPROVED
              ? "MEDIA_APPROVED"
              : "MEDIA_REJECTED",
          targetType: "ProfileMedia",
          targetId: mediaId,
          description: dto.notes?.trim(),
          metadataJson: {
            memberProfileId: media.memberProfileId,
          },
        },
      });

      return updated;
    });

    if (media.memberProfile.user.email) {
      await this.notificationsService.queueEmail({
        userId: media.memberProfile.user.id,
        recipientEmail: media.memberProfile.user.email,
        templateKey:
          approvalStatus === MediaApprovalStatus.APPROVED
            ? "MEDIA_APPROVED"
            : "MEDIA_REJECTED",
        subject:
          approvalStatus === MediaApprovalStatus.APPROVED
            ? "Your Borbodhu photo was approved"
            : "Your Borbodhu photo needs changes",
        bodyJson: {
          mediaId,
          decision: dto.decision,
          notes: dto.notes?.trim() ?? null,
        },
      });
    }

    return {
      success: true,
      media: await this.enrichMediaPayload(updatedMedia, true),
    };
  }

  private async requireMemberProfile(userId: string) {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Member profile was not found.");
    }

    return profile;
  }

  private async requireOwnedMedia(userId: string, mediaId: string) {
    const media = await this.prisma.profileMedia.findUnique({
      where: {
        id: mediaId,
      },
      include: {
        memberProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException("Media record was not found.");
    }

    if (media.memberProfile.userId !== userId) {
      throw new ForbiddenException("This media item does not belong to you.");
    }

    return media;
  }

  private async enrichMediaPayload<
    T extends {
      legacyId?: bigint | null;
      storagePath: string | null;
      thumbnailPath: string | null;
      privacyMode: MediaPrivacyMode | null;
    },
  >(media: T, allowPrivateAccess: boolean) {
    const [storageUrl, thumbnailUrl] = await Promise.all([
      this.storageService.resolveMediaUrl(media.storagePath, {
        privacyMode: media.privacyMode ?? MediaPrivacyMode.PUBLIC,
        allowPrivateAccess,
      }),
      this.storageService.resolveMediaUrl(media.thumbnailPath, {
        privacyMode: media.privacyMode ?? MediaPrivacyMode.PUBLIC,
        allowPrivateAccess,
      }),
    ]);

    return {
      ...media,
      legacyId:
        typeof media.legacyId === "bigint" ? media.legacyId.toString() : media.legacyId,
      storageUrl,
      thumbnailUrl,
    };
  }
}
