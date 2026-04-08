import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  InteractionStatus,
  InteractionType,
  MediaApprovalStatus,
  MediaPrivacyMode,
  MediaType,
  MembershipStatus,
  PhotoRequestStatus,
  Prisma,
  ProfileStatus,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { DecidePhotoRequestDto } from "./dto/decide-photo-request.dto";
import { DiscoveryQueryDto } from "./dto/discovery-query.dto";
import { PublicProfileDirectoryQueryDto } from "./dto/public-profile-directory-query.dto";
import { SaveSearchDto } from "./dto/save-search.dto";
import { UpdateMemberProfileDto } from "./dto/update-member-profile.dto";
import { UpdatePartnerPreferenceDto } from "./dto/update-partner-preference.dto";

type MemberProfileRecord = Prisma.MemberProfileGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        preferredLocale: true;
        lastLoginAt: true;
      };
    };
    partnerPreference: true;
    media: {
      where: {
        isPrimary: true;
      };
      take: 1;
    };
  };
}>;

type PublicProfileSummaryInput = {
  id: string;
  displayId: string;
  firstName: string;
  displayName: string | null;
  birthDate: Date | null;
  gender: string;
  lookingFor: string | null;
  maritalStatus: string | null;
  religion: string | null;
  motherTongue: string | null;
  educationLevel: string | null;
  profession: string | null;
  designation: string | null;
  currentCity: string | null;
  currentCountryCode: string | null;
  homeDivision: string | null;
  homeDistrict: string | null;
  homeCountryCode: string | null;
  familyInvolvementLevel: string | null;
  profileCompletionPct: number;
  aboutMe: string | null;
  familyDetails: string | null;
  user: {
    preferredLocale: string;
    lastLoginAt: Date | null;
  };
  media: Array<{
    id: string;
    isPrimary: boolean;
    privacyMode: MediaPrivacyMode;
    storagePath: string;
  }>;
};

@Injectable()
export class MemberProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);
    return this.toProfilePayload(profile);
  }

  async getDashboard(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);
    const [receivedInterests, receivedFavorites, profileVisits, photoRequests] =
      await Promise.all([
        this.prisma.interaction.count({
          where: {
            targetMemberProfileId: profile.id,
            interactionType: InteractionType.INTEREST,
            status: InteractionStatus.ACTIVE,
          },
        }),
        this.prisma.interaction.count({
          where: {
            targetMemberProfileId: profile.id,
            interactionType: InteractionType.FAVORITE,
            status: InteractionStatus.ACTIVE,
          },
        }),
        this.prisma.profileVisit.count({
          where: {
            viewedMemberProfileId: profile.id,
          },
        }),
        this.prisma.photoAccessRequest.count({
          where: {
            ownerMemberProfileId: profile.id,
            status: PhotoRequestStatus.PENDING,
          },
        }),
      ]);

    /* ---- membership & ghotok info for welcome bar ---- */
    const [activeMembership, assignedGhotok] = await Promise.all([
      this.prisma.membership.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { membershipPlan: { select: { nameEn: true, nameBn: true, code: true, supportTier: true } } },
        orderBy: { endsAt: "desc" },
      }),
      profile.managedByGhotokId
        ? this.prisma.ghotokProfile.findUnique({
            where: { id: profile.managedByGhotokId },
            select: { displayName: true, email: true, phone: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      profile: await this.toProfilePayload(profile),
      activity: {
        receivedInterests,
        receivedFavorites,
        profileVisits,
        pendingPhotoRequests: photoRequests,
      },
      membership: activeMembership
        ? {
            id: activeMembership.id,
            status: activeMembership.status,
            startsAt: activeMembership.startsAt?.toISOString() ?? null,
            endsAt: activeMembership.endsAt?.toISOString() ?? null,
            plan: activeMembership.membershipPlan,
          }
        : null,
      assignedGhotok,
    };
  }

  async listPublicProfiles(query: PublicProfileDirectoryQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = this.buildProfileSearchWhere(query, {
      publicOnly: true,
    });

    const [profiles, total] = await Promise.all([
      this.prisma.memberProfile.findMany({
        where,
        include: {
          user: {
            select: {
              preferredLocale: true,
              lastLoginAt: true,
            },
          },
          media: {
            where: {
              isPrimary: true,
              approvalStatus: MediaApprovalStatus.APPROVED,
            },
            take: 1,
          },
        },
        orderBy: this.getProfileDirectoryOrderBy(query.sortBy),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.memberProfile.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      results: await Promise.all(
        profiles.map((profile) => this.toPublicProfileSummary(profile)),
      ),
    };
  }

  async getPublicProfile(displayId: string) {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { displayId },
      include: {
        user: {
          select: {
            preferredLocale: true,
            lastLoginAt: true,
          },
        },
        partnerPreference: true,
        media: {
          where: {
            approvalStatus: MediaApprovalStatus.APPROVED,
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (
      !profile ||
      profile.status !== ProfileStatus.ACTIVE ||
      profile.approvalStatus !== ApprovalStatus.APPROVED ||
      !profile.isProfilePublic
    ) {
      throw new NotFoundException("Public profile was not found.");
    }

    const summary = await this.toPublicProfileSummary(profile);
    const gallery = await Promise.all(
      profile.media
        .filter(
          (item) =>
            item.privacyMode === MediaPrivacyMode.PUBLIC &&
            item.approvalStatus === MediaApprovalStatus.APPROVED,
        )
        .slice(0, 4)
        .map(async (item) => ({
          id: item.id,
          isPrimary: item.isPrimary,
          storageUrl: await this.storageService.resolveMediaUrl(item.storagePath, {
            privacyMode: item.privacyMode,
            allowPrivateAccess: false,
          }),
        })),
    );

    const age = profile.birthDate ? this.calculateAge(profile.birthDate) : null;
    const heightCm = profile.heightCm;
    const heightFtIn = heightCm ? this.cmToFtIn(heightCm) : null;

    // Partner preferences (safe subset for public view)
    const pp = profile.partnerPreference;
    const partnerPreferences = pp
      ? {
          ageMin: pp.ageMin,
          ageMax: pp.ageMax,
          heightMinCm: pp.heightMinCm,
          heightMaxCm: pp.heightMaxCm,
          heightMinFtIn: pp.heightMinCm ? this.cmToFtIn(pp.heightMinCm) : null,
          heightMaxFtIn: pp.heightMaxCm ? this.cmToFtIn(pp.heightMaxCm) : null,
          maritalStatuses: pp.maritalStatuses,
          religions: pp.religions,
          motherTongues: pp.motherTongues,
          educationLevels: pp.educationLevels,
          professions: pp.professions,
          homeCountryCodes: pp.homeCountryCodes,
          livingCountryCodes: pp.livingCountryCodes,
        }
      : null;

    return {
      ...summary,
      // Additional detail fields (not in summary)
      age,
      heightCm,
      heightFtIn,
      bodyType: profile.bodyType,
      complexion: profile.complexion,
      bloodGroup: profile.bloodGroup,
      maritalStatus: profile.maritalStatus,
      motherTongue: profile.motherTongue,
      religionSubgroup: profile.religionSubgroup,
      aboutMe: this.sanitizePublicText(profile.aboutMe),
      familyDetails: this.sanitizePublicText(profile.familyDetails),
      fatherStatus: profile.fatherStatus,
      motherStatus: profile.motherStatus,
      brothersCount: profile.brothersCount,
      sistersCount: profile.sistersCount,
      profileOwnerType: profile.profileOwnerType,
      lastLoginAt: profile.user.lastLoginAt,
      partnerPreferences,
      gallery,
      seo: {
        title: `${summary.publicName}${age ? `, ${age}` : ""} — ${summary.profession ?? "Profile"} | Bangladeshi Matrimony | borbodhu.com`,
        description: summary.seoDescription,
      },
    };
  }

  private cmToFtIn(cm: number): string {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${ft} ft ${inches} in`;
  }

  async getProfileDetail(userId: string, targetMemberProfileId: string) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);
    const targetProfile = await this.prisma.memberProfile.findUnique({
      where: { id: targetMemberProfileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            lastLoginAt: true,
          },
        },
        partnerPreference: true,
        media: {
          where: {
            approvalStatus: ApprovalStatus.APPROVED,
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!targetProfile || targetProfile.status === ProfileStatus.DELETED) {
      throw new NotFoundException("Member profile was not found.");
    }

    const isSelf = actorProfile.id === targetProfile.id;
    const hasPrivatePhotoAccess = isSelf
      ? true
      : Boolean(
          await this.prisma.photoAccessRequest.findFirst({
            where: {
              ownerMemberProfileId: targetProfile.id,
              requesterMemberProfileId: actorProfile.id,
              status: PhotoRequestStatus.APPROVED,
            },
            select: {
              id: true,
            },
          }),
        );
    const existingContactUnlock = isSelf
      ? true
      : Boolean(
          await this.prisma.contactUnlock.findUnique({
            where: {
              viewerMemberProfileId_targetMemberProfileId: {
                viewerMemberProfileId: actorProfile.id,
                targetMemberProfileId: targetProfile.id,
              },
            },
            select: {
              id: true,
            },
          }),
        );

    if (!isSelf) {
      await this.prisma.profileVisit.create({
        data: {
          viewerMemberProfileId: actorProfile.id,
          viewedMemberProfileId: targetProfile.id,
          source: "PROFILE_DETAIL",
        },
      });
    }

    const media = await Promise.all(
      targetProfile.media.map(async (item) => {
        const canViewMedia =
          item.privacyMode !== MediaPrivacyMode.PRIVATE || hasPrivatePhotoAccess;

        const [storageUrl, thumbnailUrl] = await Promise.all([
          this.storageService.resolveMediaUrl(item.storagePath, {
            privacyMode: item.privacyMode,
            allowPrivateAccess: canViewMedia,
          }),
          this.storageService.resolveMediaUrl(item.thumbnailPath, {
            privacyMode: item.privacyMode,
            allowPrivateAccess: canViewMedia,
          }),
        ]);

        return {
          id: item.id,
          mediaType: item.mediaType,
          storagePath: canViewMedia ? item.storagePath : null,
          storageUrl: canViewMedia ? storageUrl : null,
          thumbnailPath: canViewMedia ? item.thumbnailPath : null,
          thumbnailUrl: canViewMedia ? thumbnailUrl : null,
          privacyMode: item.privacyMode,
          isPrimary: item.isPrimary,
        };
      }),
    );

    return {
      id: targetProfile.id,
      displayId: targetProfile.displayId,
      displayName: targetProfile.displayName ?? targetProfile.firstName,
      status: targetProfile.status,
      approvalStatus: targetProfile.approvalStatus,
      gender: targetProfile.gender,
      lookingFor: targetProfile.lookingFor,
      religion: targetProfile.religion,
      religionSubgroup: targetProfile.religionSubgroup,
      motherTongue: targetProfile.motherTongue,
      educationLevel: targetProfile.educationLevel,
      educationMajor: targetProfile.educationMajor,
      profession: targetProfile.profession,
      designation: targetProfile.designation,
      currentCountryCode: targetProfile.currentCountryCode,
      currentCity: targetProfile.currentCity,
      homeCountryCode: targetProfile.homeCountryCode,
      homeDivision: targetProfile.homeDivision,
      homeDistrict: targetProfile.homeDistrict,
      aboutMe: targetProfile.aboutMe,
      familyDetails: targetProfile.familyDetails,
      familyInvolvementLevel: targetProfile.familyInvolvementLevel,
      lastLoginAt: targetProfile.user.lastLoginAt,
      media,
      privatePhotoAccess: {
        granted: hasPrivatePhotoAccess,
        requiresRequest: !hasPrivatePhotoAccess,
      },
      contact: existingContactUnlock
        ? {
            unlocked: true,
            guardianPhone: targetProfile.guardianPhone,
            guardianEmail: targetProfile.guardianEmail ?? targetProfile.user.email,
          }
        : {
            unlocked: false,
            guardianPhone: null,
            guardianEmail: null,
            upgradeMessage:
              "Upgrade and use a contact unlock to view contact details.",
          },
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMemberProfileDto) {
    const currentProfile = await this.getOwnProfileOrThrow(userId);
    const data: Prisma.MemberProfileUpdateInput = {
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      displayName: dto.displayName?.trim(),
      gender: dto.gender,
      lookingFor: dto.lookingFor,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      maritalStatus: dto.maritalStatus?.trim(),
      childrenStatus: dto.childrenStatus?.trim(),
      heightCm: dto.heightCm,
      religion: dto.religion?.trim(),
      religionSubgroup: dto.religionSubgroup?.trim(),
      motherTongue: dto.motherTongue?.trim(),
      educationLevel: dto.educationLevel?.trim(),
      educationMajor: dto.educationMajor?.trim(),
      profession: dto.profession?.trim(),
      designation: dto.designation?.trim(),
      annualIncomeBand: dto.annualIncomeBand?.trim(),
      currentCountryCode: dto.currentCountryCode?.trim().toUpperCase(),
      currentCity: dto.currentCity?.trim(),
      homeCountryCode: dto.homeCountryCode?.trim().toUpperCase(),
      homeDivision: dto.homeDivision?.trim(),
      homeDistrict: dto.homeDistrict?.trim(),
      familyDetails: dto.familyDetails?.trim(),
      aboutMe: dto.aboutMe?.trim(),
      guardianName: dto.guardianName?.trim(),
      guardianRelation: dto.guardianRelation?.trim(),
      guardianPhone: dto.guardianPhone?.trim(),
      guardianEmail: dto.guardianEmail?.trim().toLowerCase(),
      familyInvolvementLevel: dto.familyInvolvementLevel?.trim(),
      isProfilePublic: dto.isProfilePublic,
    };

    const completion = this.calculateProfileCompletion({
      firstName: dto.firstName ?? currentProfile.firstName,
      gender: dto.gender ?? currentProfile.gender,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : currentProfile.birthDate,
      religion: dto.religion ?? currentProfile.religion,
      educationLevel: dto.educationLevel ?? currentProfile.educationLevel,
      profession: dto.profession ?? currentProfile.profession,
      currentCountryCode:
        dto.currentCountryCode ?? currentProfile.currentCountryCode,
      homeCountryCode: dto.homeCountryCode ?? currentProfile.homeCountryCode,
      aboutMe: dto.aboutMe ?? currentProfile.aboutMe,
      guardianPhone: dto.guardianPhone ?? currentProfile.guardianPhone,
      familyDetails: dto.familyDetails ?? currentProfile.familyDetails,
    });

    const updatedProfile = await this.prisma.memberProfile.update({
      where: { userId },
      data: {
        ...data,
        displayName:
          dto.displayName?.trim() ??
          currentProfile.displayName ??
          [dto.firstName ?? currentProfile.firstName, dto.lastName ?? currentProfile.lastName]
            .filter(Boolean)
            .join(" "),
        profileCompletionPct: completion,
      },
      include: this.memberProfileInclude(),
    });

    return this.toProfilePayload(updatedProfile);
  }

  async updatePreferences(userId: string, dto: UpdatePartnerPreferenceDto) {
    const profile = await this.getOwnProfileOrThrow(userId);
    const preference = await this.prisma.partnerPreference.upsert({
      where: {
        memberProfileId: profile.id,
      },
      create: {
        memberProfileId: profile.id,
        gender: dto.gender,
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
        heightMinCm: dto.heightMinCm,
        heightMaxCm: dto.heightMaxCm,
        maritalStatuses: dto.maritalStatuses,
        religions: dto.religions,
        motherTongues: dto.motherTongues,
        educationLevels: dto.educationLevels,
        professions: dto.professions,
        homeCountryCodes: dto.homeCountryCodes,
        livingCountryCodes: dto.livingCountryCodes,
        aboutPartner: dto.aboutPartner?.trim(),
      },
      update: {
        gender: dto.gender,
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
        heightMinCm: dto.heightMinCm,
        heightMaxCm: dto.heightMaxCm,
        maritalStatuses: dto.maritalStatuses,
        religions: dto.religions,
        motherTongues: dto.motherTongues,
        educationLevels: dto.educationLevels,
        professions: dto.professions,
        homeCountryCodes: dto.homeCountryCodes,
        livingCountryCodes: dto.livingCountryCodes,
        aboutPartner: dto.aboutPartner?.trim(),
      },
    });

    return {
      success: true,
      preference,
    };
  }

  async submitForReview(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);

    if (profile.profileCompletionPct < 40) {
      throw new BadRequestException(
        "Complete more of the profile before requesting review.",
      );
    }

    const latestRevision = await this.prisma.profileRevision.findFirst({
      where: {
        memberProfileId: profile.id,
      },
      orderBy: {
        revisionNumber: "desc",
      },
      select: {
        revisionNumber: true,
      },
    });

    await this.prisma.$transaction([
      this.prisma.profileRevision.create({
        data: {
          memberProfileId: profile.id,
          revisionNumber: (latestRevision?.revisionNumber ?? 0) + 1,
          submittedByUserId: userId,
          submittedPayload: {
            profile: this.toRevisionPayload(profile),
          },
        },
      }),
      this.prisma.memberProfile.update({
        where: { id: profile.id },
        data: {
          status: ProfileStatus.PENDING_REVIEW,
          approvalStatus: ApprovalStatus.PENDING,
        },
      }),
    ]);

    return {
      success: true,
      status: ProfileStatus.PENDING_REVIEW,
      approvalStatus: ApprovalStatus.PENDING,
    };
  }

  async discover(userId: string, query: DiscoveryQueryDto) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);
    const blockedProfileIds = await this.getBlockedProfileIds(actorProfile.id);
    const targetGender =
      query.gender ?? actorProfile.partnerPreference?.gender ?? undefined;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = this.buildProfileSearchWhere(query, {
      publicOnly: false,
      excludeProfileIds: [actorProfile.id, ...blockedProfileIds],
      targetGender,
    });

    const profiles = await this.prisma.memberProfile.findMany({
      where,
      include: this.memberProfileInclude(),
      orderBy: this.getProfileDirectoryOrderBy(query.sortBy),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.prisma.memberProfile.count({ where });

    return {
      total,
      page,
      pageSize,
      results: await Promise.all(
        profiles.map(async (profile) => {
          const primaryMedia = profile.media[0];
          const primaryPhotoPath = primaryMedia?.storagePath ?? null;
          const primaryPhotoUrl =
            primaryMedia?.privacyMode === MediaPrivacyMode.PRIVATE
              ? null
              : await this.storageService.resolveMediaUrl(primaryPhotoPath, {
                  privacyMode: primaryMedia?.privacyMode,
                  allowPrivateAccess: false,
                });

          return {
            id: profile.id,
            displayId: profile.displayId,
            displayName: profile.displayName ?? profile.firstName,
            age: profile.birthDate ? this.calculateAge(profile.birthDate) : null,
            gender: profile.gender,
            maritalStatus: profile.maritalStatus,
            religion: profile.religion,
            motherTongue: profile.motherTongue,
            profession: profile.profession,
            educationLevel: profile.educationLevel,
            currentCity: profile.currentCity,
            currentCountryCode: profile.currentCountryCode,
            lastLoginAt: profile.user.lastLoginAt,
            primaryPhoto: primaryPhotoPath,
            primaryPhotoUrl,
          };
        }),
      ),
    };
  }

  async sendInterest(userId: string, targetMemberProfileId: string) {
    return this.upsertInteraction(
      userId,
      targetMemberProfileId,
      InteractionType.INTEREST,
    );
  }

  async addFavorite(userId: string, targetMemberProfileId: string) {
    return this.upsertInteraction(
      userId,
      targetMemberProfileId,
      InteractionType.FAVORITE,
    );
  }

  async blockMember(userId: string, targetMemberProfileId: string) {
    return this.upsertInteraction(userId, targetMemberProfileId, InteractionType.BLOCK);
  }

  async createPhotoRequest(userId: string, targetMemberProfileId: string) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);

    if (actorProfile.id === targetMemberProfileId) {
      throw new BadRequestException("You cannot request access to your own photos.");
    }

    const targetProfile = await this.prisma.memberProfile.findUnique({
      where: { id: targetMemberProfileId },
      select: {
        id: true,
      },
    });

    if (!targetProfile) {
      throw new NotFoundException("Target profile was not found.");
    }

    const existingRequest = await this.prisma.photoAccessRequest.findFirst({
      where: {
        ownerMemberProfileId: targetMemberProfileId,
        requesterMemberProfileId: actorProfile.id,
        status: {
          in: [PhotoRequestStatus.PENDING, PhotoRequestStatus.APPROVED],
        },
      },
    });

    if (existingRequest) {
      return {
        success: true,
        request: existingRequest,
      };
    }

    const request = await this.prisma.photoAccessRequest.create({
      data: {
        ownerMemberProfileId: targetMemberProfileId,
        requesterMemberProfileId: actorProfile.id,
        status: PhotoRequestStatus.PENDING,
      },
    });

    return {
      success: true,
      request,
    };
  }

  async listMyContactUnlocks(userId: string) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);
    const unlocks = await this.prisma.contactUnlock.findMany({
      where: { viewerMemberProfileId: actorProfile.id },
      orderBy: { createdAt: "desc" },
      include: {
        targetMemberProfile: {
          include: {
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    const results = await Promise.all(
      unlocks.map(async (u) => {
        const p = u.targetMemberProfile;
        const primaryMedia = p.media[0];
        const photoUrl = primaryMedia
          ? await this.storageService.resolveMediaUrl(primaryMedia.storagePath, {
              privacyMode: primaryMedia.privacyMode as any,
              allowPrivateAccess: false,
            })
          : null;
        return {
          id: u.id,
          unlockedAt: u.createdAt.toISOString(),
          profile: {
            id: p.id,
            displayId: p.displayId,
            displayName: p.displayName ?? p.firstName,
            gender: p.gender,
            age: p.birthDate ? Math.floor((Date.now() - p.birthDate.getTime()) / 31557600000) : null,
            currentCity: p.currentCity,
            currentCountryCode: p.currentCountryCode,
            primaryPhotoUrl: photoUrl,
          },
        };
      }),
    );

    return { total: results.length, results };
  }

  async getMyPhotoRequests(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);

    const [incoming, outgoing] = await Promise.all([
      this.prisma.photoAccessRequest.findMany({
        where: {
          ownerMemberProfileId: profile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          requesterMemberProfile: {
            select: {
              id: true,
              displayId: true,
              displayName: true,
              firstName: true,
            },
          },
        },
      }),
      this.prisma.photoAccessRequest.findMany({
        where: {
          requesterMemberProfileId: profile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          ownerMemberProfile: {
            select: {
              id: true,
              displayId: true,
              displayName: true,
              firstName: true,
            },
          },
        },
      }),
    ]);

    return {
      incoming,
      outgoing,
    };
  }

  async unlockContact(userId: string, targetMemberProfileId: string) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);

    if (actorProfile.id === targetMemberProfileId) {
      throw new BadRequestException("You already have access to your own contact details.");
    }

    const existingUnlock = await this.prisma.contactUnlock.findUnique({
      where: {
        viewerMemberProfileId_targetMemberProfileId: {
          viewerMemberProfileId: actorProfile.id,
          targetMemberProfileId,
        },
      },
    });

    if (existingUnlock) {
      return this.getProfileDetail(userId, targetMemberProfileId);
    }

    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        membershipPlan: {
          contactViewEnabled: true,
        },
      },
      include: {
        membershipPlan: true,
      },
      orderBy: {
        endsAt: "desc",
      },
    });

    if (!activeMembership) {
      throw new ForbiddenException({
        code: "UPGRADE_REQUIRED",
        message:
          "An active paid membership is required to unlock contact details.",
      });
    }

    const currentUnlockCount = await this.prisma.contactUnlock.count({
      where: {
        membershipId: activeMembership.id,
      },
    });

    if (
      activeMembership.membershipPlan.contactLimit > 0 &&
      currentUnlockCount >= activeMembership.membershipPlan.contactLimit
    ) {
      throw new ForbiddenException("Your plan contact limit has been reached.");
    }

    await this.prisma.contactUnlock.create({
      data: {
        viewerMemberProfileId: actorProfile.id,
        targetMemberProfileId,
        membershipId: activeMembership.id,
        unlockSource: "MEMBERSHIP_CONTACT_UNLOCK",
      },
    });

    return this.getProfileDetail(userId, targetMemberProfileId);
  }

  async listSavedSearches(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);

    return this.prisma.searchSave.findMany({
      where: {
        memberProfileId: profile.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async createSavedSearch(userId: string, dto: SaveSearchDto) {
    const profile = await this.getOwnProfileOrThrow(userId);

    return this.prisma.searchSave.create({
      data: {
        memberProfileId: profile.id,
        name: dto.name.trim(),
        criteriaJson: dto.criteriaJson as Prisma.InputJsonValue,
        alertEnabled: dto.alertEnabled ?? false,
      },
    });
  }

  async updateSavedSearch(userId: string, searchSaveId: string, dto: SaveSearchDto) {
    const searchSave = await this.requireOwnedSearchSave(userId, searchSaveId);

    return this.prisma.searchSave.update({
      where: {
        id: searchSave.id,
      },
      data: {
        name: dto.name.trim(),
        criteriaJson: dto.criteriaJson as Prisma.InputJsonValue,
        alertEnabled: dto.alertEnabled ?? searchSave.alertEnabled,
      },
    });
  }

  async deleteSavedSearch(userId: string, searchSaveId: string) {
    const searchSave = await this.requireOwnedSearchSave(userId, searchSaveId);

    await this.prisma.searchSave.delete({
      where: {
        id: searchSave.id,
      },
    });

    return {
      success: true,
      deletedId: searchSave.id,
    };
  }

  async listVisitors(userId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);

    return this.prisma.profileVisit.findMany({
      where: {
        viewedMemberProfileId: profile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        viewerMemberProfile: {
          select: {
            id: true,
            displayId: true,
            displayName: true,
            firstName: true,
            gender: true,
            currentCountryCode: true,
            currentCity: true,
          },
        },
      },
    });
  }

  async decidePhotoRequest(
    userId: string,
    photoRequestId: string,
    dto: DecidePhotoRequestDto,
  ) {
    const profile = await this.getOwnProfileOrThrow(userId);
    const request = await this.prisma.photoAccessRequest.findUnique({
      where: { id: photoRequestId },
      select: {
        id: true,
        ownerMemberProfileId: true,
        status: true,
      },
    });

    if (!request || request.ownerMemberProfileId !== profile.id) {
      throw new NotFoundException("Photo access request was not found.");
    }

    const updated = await this.prisma.photoAccessRequest.update({
      where: { id: photoRequestId },
      data: {
        status:
          dto.decision === "approve"
            ? PhotoRequestStatus.APPROVED
            : PhotoRequestStatus.DENIED,
        decisionReason: dto.reason?.trim(),
        decisionByUserId: userId,
        decidedAt: new Date(),
      },
    });

    return {
      success: true,
      request: updated,
    };
  }

  private async upsertInteraction(
    userId: string,
    targetMemberProfileId: string,
    interactionType: InteractionType,
  ) {
    const actorProfile = await this.getOwnProfileOrThrow(userId);

    if (actorProfile.id === targetMemberProfileId) {
      throw new BadRequestException("You cannot perform this action on yourself.");
    }

    const targetProfile = await this.prisma.memberProfile.findUnique({
      where: { id: targetMemberProfileId },
      select: { id: true, status: true },
    });

    if (!targetProfile || targetProfile.status === ProfileStatus.DELETED) {
      throw new NotFoundException("Target profile was not found.");
    }

    const interaction = await this.prisma.interaction.upsert({
      where: {
        actorMemberProfileId_targetMemberProfileId_interactionType: {
          actorMemberProfileId: actorProfile.id,
          targetMemberProfileId,
          interactionType,
        },
      },
      create: {
        actorMemberProfileId: actorProfile.id,
        targetMemberProfileId,
        interactionType,
        status: InteractionStatus.ACTIVE,
      },
      update: {
        status: InteractionStatus.ACTIVE,
      },
    });

    return {
      success: true,
      interaction,
    };
  }

  private async getOwnProfileOrThrow(userId: string) {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { userId },
      include: this.memberProfileInclude(),
    });

    if (!profile) {
      throw new NotFoundException("Member profile was not found.");
    }

    return profile;
  }

  private async requireOwnedSearchSave(userId: string, searchSaveId: string) {
    const profile = await this.getOwnProfileOrThrow(userId);
    const searchSave = await this.prisma.searchSave.findUnique({
      where: {
        id: searchSaveId,
      },
    });

    if (!searchSave || searchSave.memberProfileId !== profile.id) {
      throw new NotFoundException("Saved search was not found.");
    }

    return searchSave;
  }

  private async getBlockedProfileIds(memberProfileId: string) {
    const interactions = await this.prisma.interaction.findMany({
      where: {
        interactionType: InteractionType.BLOCK,
        status: InteractionStatus.ACTIVE,
        OR: [
          { actorMemberProfileId: memberProfileId },
          { targetMemberProfileId: memberProfileId },
        ],
      },
      select: {
        actorMemberProfileId: true,
        targetMemberProfileId: true,
      },
    });

    return interactions.map((interaction) =>
      interaction.actorMemberProfileId === memberProfileId
        ? interaction.targetMemberProfileId
        : interaction.actorMemberProfileId,
    );
  }

  private calculateProfileCompletion(profile: {
    firstName?: string | null;
    gender?: unknown;
    birthDate?: Date | null;
    religion?: string | null;
    educationLevel?: string | null;
    profession?: string | null;
    currentCountryCode?: string | null;
    homeCountryCode?: string | null;
    aboutMe?: string | null;
    guardianPhone?: string | null;
    familyDetails?: string | null;
  }) {
    const checkpoints = [
      Boolean(profile.firstName),
      Boolean(profile.gender),
      Boolean(profile.birthDate),
      Boolean(profile.religion),
      Boolean(profile.educationLevel),
      Boolean(profile.profession),
      Boolean(profile.currentCountryCode),
      Boolean(profile.homeCountryCode),
      Boolean(profile.aboutMe),
      Boolean(profile.guardianPhone),
      Boolean(profile.familyDetails),
    ];

    const completeCount = checkpoints.filter(Boolean).length;
    return Math.round((completeCount / checkpoints.length) * 100);
  }

  private async toPublicProfileSummary(profile: PublicProfileSummaryInput) {
    const primaryMedia = profile.media.find(
      (item) =>
        item.isPrimary &&
        (item.privacyMode === MediaPrivacyMode.PUBLIC ||
          item.privacyMode === MediaPrivacyMode.BLURRED_PUBLIC),
    );
    const primaryPhotoUrl = primaryMedia
      ? await this.storageService.resolveMediaUrl(primaryMedia.storagePath, {
          privacyMode: primaryMedia.privacyMode,
          allowPrivateAccess: false,
        })
      : null;
    const publicName = this.buildPublicName(profile.firstName, profile.displayId, profile.displayName);
    const age = profile.birthDate ? this.calculateAge(profile.birthDate) : null;
    const broadLocation =
      [profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ") ||
      [profile.homeDistrict, profile.homeCountryCode].filter(Boolean).join(", ") ||
      "Location shared after login";
    const publicSummary =
      this.sanitizePublicText(profile.aboutMe) ||
      this.sanitizePublicText(profile.familyDetails) ||
      "Profile summary is available after sign-in and profile verification.";
    const publicHeadline = [
      age ? `${age} years` : null,
      profile.profession,
      profile.religion,
      broadLocation,
    ]
      .filter(Boolean)
      .join(" • ");

    return {
      id: profile.id,
      displayId: profile.displayId,
      publicName,
      age,
      gender: profile.gender,
      lookingFor: profile.lookingFor,
      maritalStatus: profile.maritalStatus,
      religion: profile.religion,
      motherTongue: profile.motherTongue,
      educationLevel: profile.educationLevel,
      profession: profile.profession,
      designation: profile.designation,
      currentCity: profile.currentCity,
      currentCountryCode: profile.currentCountryCode,
      homeDivision: profile.homeDivision,
      homeDistrict: profile.homeDistrict,
      homeCountryCode: profile.homeCountryCode,
      familyInvolvementLevel: profile.familyInvolvementLevel,
      preferredLocale: profile.user.preferredLocale,
      profileCompletionPct: profile.profileCompletionPct,
      primaryPhotoUrl,
      publicHeadline,
      publicSummary,
      seoDescription: this.buildPublicSeoDescription({
        publicName,
        age,
        religion: profile.religion,
        profession: profile.profession,
        location: broadLocation,
      }),
      lastLoginAt: profile.user.lastLoginAt,
    };
  }

  private multiFilter(field: string, value: string | undefined, uppercase = false): Record<string, unknown> {
    if (!value?.trim()) return {};
    const parts = value.split(",").map((v) => (uppercase ? v.trim().toUpperCase() : v.trim())).filter(Boolean);
    if (parts.length === 0) return {};
    if (parts.length === 1) return { [field]: parts[0] };
    return { [field]: { in: parts } };
  }

  private buildProfileSearchWhere(
    query: PublicProfileDirectoryQueryDto | DiscoveryQueryDto,
    options: {
      publicOnly: boolean;
      excludeProfileIds?: string[];
      targetGender?: string;
    },
  ): Prisma.MemberProfileWhereInput {
    const keyword = query.keyword?.trim();
    const birthDateFilter = this.buildBirthDateFilter(query.ageMin, query.ageMax);
    const photoPrivacyModes = options.publicOnly
      ? [MediaPrivacyMode.PUBLIC, MediaPrivacyMode.BLURRED_PUBLIC]
      : [MediaPrivacyMode.PUBLIC, MediaPrivacyMode.BLURRED_PUBLIC, MediaPrivacyMode.PRIVATE];

    return {
      status: ProfileStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      ...(options.publicOnly ? { isProfilePublic: true } : {}),
      ...(options.excludeProfileIds?.length
        ? {
            id: {
              notIn: options.excludeProfileIds,
            },
          }
        : {}),
      gender:
        options.targetGender && (options.targetGender === "MAN" || options.targetGender === "WOMAN")
          ? options.targetGender
          : query.gender,
      ...this.multiFilter("religion", query.religion),
      ...this.multiFilter("currentCountryCode", query.currentCountryCode, true),
      ...this.multiFilter("motherTongue", query.motherTongue),
      ...this.multiFilter("maritalStatus", query.maritalStatus),
      ...this.multiFilter("educationLevel", query.educationLevel),
      ...this.multiFilter("profession", query.profession),
      birthDate: birthDateFilter,
      ...(query.hasPhoto
        ? {
            media: {
              some: {
                mediaType: MediaType.PROFILE_PHOTO,
                approvalStatus: MediaApprovalStatus.APPROVED,
                isPrimary: true,
                privacyMode: {
                  in: photoPrivacyModes,
                },
              },
            },
          }
        : {}),
      ...(keyword
        ? {
            OR: [
              {
                firstName: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                displayName: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                profession: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                educationLevel: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                currentCity: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                homeDistrict: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
              {
                motherTongue: {
                  contains: keyword,
                  mode: "insensitive" as Prisma.QueryMode,
                },
              },
            ],
          }
        : {}),
    };
  }

  private buildBirthDateFilter(ageMin?: number, ageMax?: number): Prisma.DateTimeFilter | undefined {
    if (!ageMin && !ageMax) {
      return undefined;
    }

    const now = new Date();
    const filter: Prisma.DateTimeFilter = {};

    if (ageMin) {
      const latestBirthDate = new Date(now);
      latestBirthDate.setFullYear(latestBirthDate.getFullYear() - ageMin);
      filter.lte = latestBirthDate;
    }

    if (ageMax) {
      const earliestBirthDate = new Date(now);
      earliestBirthDate.setFullYear(earliestBirthDate.getFullYear() - ageMax - 1);
      earliestBirthDate.setDate(earliestBirthDate.getDate() + 1);
      filter.gte = earliestBirthDate;
    }

    return filter;
  }

  private getProfileDirectoryOrderBy(sortBy: "new_signups" | "recent_login" | "most_active" | undefined) {
    switch (sortBy) {
      case "new_signups":
        return [{ createdAt: "desc" as const }, { updatedAt: "desc" as const }];
      case "most_active":
        return [
          { visitsReceived: { _count: "desc" as const } },
          { user: { lastLoginAt: "desc" as const } },
          { updatedAt: "desc" as const },
        ];
      default:
        return [
          { user: { lastLoginAt: "desc" as const } },
          { updatedAt: "desc" as const },
        ];
    }
  }

  private calculateAge(birthDate: Date) {
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDelta = now.getMonth() - birthDate.getMonth();

    if (
      monthDelta < 0 ||
      (monthDelta === 0 && now.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  }

  private buildPublicName(firstName: string, displayId: string, displayName?: string | null) {
    const isBlank = (s: string | null | undefined) =>
      !s ||
      s.trim() === "" ||
      s.trim() === "—" ||
      s
        .trim()
        .split(/\s+/)
        .every((w) => w.toUpperCase() === "NULL" || w === "—" || w === "");

    const firstNameOnly = firstName?.trim().split(/\s+/)[0];
    if (firstNameOnly && !isBlank(firstNameOnly)) {
      return firstNameOnly;
    }

    if (displayName && !isBlank(displayName)) {
      return displayName.trim().split(/\s+/)[0];
    }

    return displayId;
  }

  private sanitizePublicText(value?: string | null) {
    if (!value) {
      return null;
    }

    const withoutEmails = value.replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[hidden email]",
    );
    const withoutPhones = withoutEmails.replace(
      /(?:\+?\d[\d\s().-]{7,}\d)/g,
      "[hidden number]",
    );
    const normalized = withoutPhones.replace(/\s+/g, " ").trim();

    if (!normalized) {
      return null;
    }

    return normalized.slice(0, 260);
  }

  private buildPublicSeoDescription(input: {
    publicName: string;
    age: number | null;
    religion?: string | null;
    profession?: string | null;
    location: string;
  }) {
    const parts = [
      input.age ? `${input.age}-year-old` : null,
      input.religion,
      input.profession,
      input.location,
    ]
      .filter(Boolean)
      .join(" ");

    return `${input.publicName} has a privacy-safe Bangladeshi matrimony profile on borbodhu.com${parts ? `, including ${parts}.` : "."}`;
  }

  private memberProfileInclude() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          preferredLocale: true,
          lastLoginAt: true,
        },
      },
      partnerPreference: true,
      media: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
    } satisfies Prisma.MemberProfileInclude;
  }

  private async toProfilePayload(profile: MemberProfileRecord) {
    const primaryMedia = profile.media[0];
    const primaryPhotoPath = primaryMedia?.storagePath ?? null;
    const primaryPhotoUrl = await this.storageService.resolveMediaUrl(primaryPhotoPath, {
      privacyMode: primaryMedia?.privacyMode ?? MediaPrivacyMode.PUBLIC,
      allowPrivateAccess: true,
    });

    return {
      id: profile.id,
      displayId: profile.displayId,
      status: profile.status,
      approvalStatus: profile.approvalStatus,
      profileOwnerType: profile.profileOwnerType,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      gender: profile.gender,
      lookingFor: profile.lookingFor,
      birthDate: profile.birthDate,
      maritalStatus: profile.maritalStatus,
      childrenStatus: profile.childrenStatus,
      heightCm: profile.heightCm,
      religion: profile.religion,
      religionSubgroup: profile.religionSubgroup,
      motherTongue: profile.motherTongue,
      educationLevel: profile.educationLevel,
      educationMajor: profile.educationMajor,
      profession: profile.profession,
      designation: profile.designation,
      annualIncomeBand: profile.annualIncomeBand,
      currentCountryCode: profile.currentCountryCode,
      currentCity: profile.currentCity,
      homeCountryCode: profile.homeCountryCode,
      homeDivision: profile.homeDivision,
      homeDistrict: profile.homeDistrict,
      familyDetails: profile.familyDetails,
      aboutMe: profile.aboutMe,
      guardianName: profile.guardianName,
      guardianRelation: profile.guardianRelation,
      guardianPhone: profile.guardianPhone,
      guardianEmail: profile.guardianEmail,
      familyInvolvementLevel: profile.familyInvolvementLevel,
      isProfilePublic: profile.isProfilePublic,
      profileCompletionPct: profile.profileCompletionPct,
      primaryPhoto: primaryPhotoPath,
      primaryPhotoUrl,
      user: profile.user,
      partnerPreference: profile.partnerPreference,
    };
  }

  private toRevisionPayload(profile: MemberProfileRecord) {
    return {
      id: profile.id,
      displayId: profile.displayId,
      status: profile.status,
      approvalStatus: profile.approvalStatus,
      profileOwnerType: profile.profileOwnerType,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      gender: profile.gender,
      lookingFor: profile.lookingFor,
      birthDate: profile.birthDate?.toISOString() ?? null,
      maritalStatus: profile.maritalStatus,
      childrenStatus: profile.childrenStatus,
      religion: profile.religion,
      religionSubgroup: profile.religionSubgroup,
      motherTongue: profile.motherTongue,
      educationLevel: profile.educationLevel,
      educationMajor: profile.educationMajor,
      profession: profile.profession,
      designation: profile.designation,
      annualIncomeBand: profile.annualIncomeBand,
      currentCountryCode: profile.currentCountryCode,
      currentCity: profile.currentCity,
      homeCountryCode: profile.homeCountryCode,
      homeDivision: profile.homeDivision,
      homeDistrict: profile.homeDistrict,
      familyDetails: profile.familyDetails,
      aboutMe: profile.aboutMe,
      guardianName: profile.guardianName,
      guardianRelation: profile.guardianRelation,
      guardianPhone: profile.guardianPhone,
      guardianEmail: profile.guardianEmail,
      familyInvolvementLevel: profile.familyInvolvementLevel,
      profileCompletionPct: profile.profileCompletionPct,
      partnerPreference: profile.partnerPreference,
      primaryPhoto: profile.media[0]?.storagePath ?? null,
      indexingMode: profile.indexingMode,
      contactVisibilityMode: profile.contactVisibilityMode,
      hasPrivatePhotos: profile.media.some(
        (media) => media.privacyMode === MediaPrivacyMode.PRIVATE,
      ),
    };
  }
}
