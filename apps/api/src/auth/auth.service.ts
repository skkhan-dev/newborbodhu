import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ApprovalStatus,
  LocaleKey,
  Prisma,
  PrismaClient,
  ProfileOwnerType,
  ProfileStatus,
  RoleKey,
  UserStatus,
} from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterMemberDto } from "./dto/register-member.dto";
import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SocialLoginDto } from "./dto/social-login.dto";
import { PasswordService } from "./password.service";

type AuthUserRecord = Prisma.UserGetPayload<{
  include: {
    roles: true;
    memberProfile: {
      select: {
        id: true;
        displayId: true;
        status: true;
        approvalStatus: true;
      };
    };
    ghotokProfile: {
      select: {
        id: true;
        displayName: true;
        status: true;
      };
    };
    vendorProfile: {
      select: {
        id: true;
        slug: true;
        status: true;
      };
    };
    adminProfile: {
      select: {
        id: true;
        displayName: true;
        isSuperAdmin: true;
        status: true;
      };
    };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly notifications: NotificationsService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException("An account with this email already exists.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          preferredLocale: dto.preferredLocale ?? LocaleKey.EN,
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
              phone: dto.phone.trim(),
              birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
              currentCountryCode: dto.currentCountryCode?.trim().toUpperCase(),
              homeCountryCode: dto.homeCountryCode?.trim().toUpperCase(),
              status: ProfileStatus.DRAFT,
              approvalStatus: ApprovalStatus.PENDING,
              profileOwnerType: ProfileOwnerType.SELF,
              partnerPreference: {
                create: {
                  gender: dto.lookingFor,
                },
              },
            },
          },
        },
        include: this.authUserInclude(),
      });

      return createdUser as AuthUserRecord;
    });

    const accessToken = await this.issueAccessToken(user);

    // Queue welcome email (non-blocking)
    this.notifications.queueEmail({
      userId: user.id,
      recipientEmail: user.email,
      templateKey: "welcome",
      subject: "Welcome to Borbodhu!",
      bodyJson: {
        name: dto.firstName,
        ctaUrl: `${this.configService.get("WEB_BASE_URL", "https://borbodhu.com")}/dashboard`,
        ctaLabel: "Complete Your Profile",
      },
    }).catch(() => { /* non-critical */ });

    // Generate magic link token for email verification (non-blocking)
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationExpiry,
      },
    });

    const webBaseUrl = this.configService.get("WEB_APP_URL", "https://borbodhu.com");
    const verifyUrl = `${webBaseUrl}/verify-email?token=${verificationToken}`;
    this.notifications.queueEmail({
      userId: user.id,
      recipientEmail: email,
      templateKey: "email_verification",
      subject: "Verify your Borbodhu account",
      bodyJson: {
        name: dto.firstName,
        verifyUrl,
      },
    }).catch(() => { /* non-critical */ });

    return {
      accessToken,
      user: this.toAuthUserPayload(user),
      nextStep: "complete_profile",
    };
  }

  async verifyEmailByToken(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        emailVerifiedAt: true,
        emailVerificationTokenExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired verification link.");
    }

    if (user.emailVerifiedAt) {
      return { verified: true };
    }

    if (!user.emailVerificationTokenExpiresAt || new Date() > user.emailVerificationTokenExpiresAt) {
      throw new BadRequestException("This verification link has expired. Please request a new one from your dashboard.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        status: UserStatus.ACTIVE,
      },
    });

    return { verified: true };
  }

  async resendVerificationLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true, memberProfile: { select: { firstName: true } } },
    });

    if (!user) throw new NotFoundException("User not found.");
    if (user.emailVerifiedAt) return { message: "Email is already verified." };

    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationExpiry,
      },
    });

    const webBaseUrl = this.configService.get("WEB_APP_URL", "https://borbodhu.com");
    const verifyUrl = `${webBaseUrl}/verify-email?token=${verificationToken}`;
    await this.notifications.queueEmail({
      userId: user.id,
      recipientEmail: user.email,
      templateKey: "email_verification",
      subject: "Verify your Borbodhu account",
      bodyJson: {
        name: user.memberProfile?.firstName ?? "Member",
        verifyUrl,
      },
    });

    return { message: "Verification email sent." };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        emailVerificationCode: true,
        emailVerificationExpiresAt: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException("Account not found.");
    }

    if (user.emailVerifiedAt) {
      return { verified: true, message: "Email is already verified." };
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw new BadRequestException("No verification code was sent. Please request a new one.");
    }

    if (new Date() > user.emailVerificationExpiresAt) {
      throw new BadRequestException("Verification code has expired. Please request a new one.");
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException("Invalid verification code.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { verified: true, message: "Email verified successfully." };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new BadRequestException("Account not found.");
    }

    if (user.emailVerifiedAt) {
      return { message: "Email is already verified." };
    }

    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: verificationExpiry,
      },
    });

    this.notifications.queueEmail({
      userId: user.id,
      recipientEmail: email.toLowerCase(),
      templateKey: "email_verification",
      subject: "Verify your Borbodhu account",
      bodyJson: { code: verificationCode },
    }).catch(() => {});

    return { message: "Verification code sent." };
  }

  async registerVendor(dto: RegisterVendorDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException("An account with this email already exists.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);
    const slug = await this.createUniqueVendorSlug(dto.businessName);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          preferredLocale: dto.preferredLocale ?? LocaleKey.EN,
          status: UserStatus.ACTIVE,
          roles: {
            create: {
              role: RoleKey.VENDOR,
            },
          },
          vendorProfile: {
            create: {
              businessName: dto.businessName.trim(),
              slug,
              categoryName: dto.categoryName?.trim(),
              division: dto.division?.trim(),
              district: dto.district?.trim(),
              area: dto.area?.trim(),
              address: dto.address?.trim(),
              contactPerson: dto.contactPerson?.trim(),
              phone: dto.phone?.trim(),
              email,
              website: dto.website?.trim(),
              descriptionEn: dto.descriptionEn?.trim(),
              descriptionBn: dto.descriptionBn?.trim(),
              status: "PENDING_REVIEW",
              billingStatus: "FREE",
            },
          },
        },
        include: this.authUserInclude(),
      });

      return createdUser as AuthUserRecord;
    });

    const accessToken = await this.issueAccessToken(user);

    return {
      accessToken,
      user: this.toAuthUserPayload(user),
      nextStep: "complete_vendor_profile_and_publish_packages",
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (user.status === UserStatus.DELETED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("This account is not currently allowed to sign in.");
    }

    const isValidPassword = user.passwordHash
      ? await this.passwordService.verifyPassword(dto.password, user.passwordHash)
      : false;
    const isValidLegacyPassword =
      !isValidPassword &&
      (await this.passwordService.verifyLegacyPassword(
        dto.password,
        user.legacyHash,
        user.legacyHashType,
      ));

    if (!isValidPassword && !isValidLegacyPassword) {
      if (!user.passwordHash && !user.legacyHash) {
        throw new UnauthorizedException({
          code: "RESET_REQUIRED",
          message: "This account must reset its password before signing in.",
        });
      }

      throw new UnauthorizedException("Invalid email or password.");
    }

    const nextPasswordHash = isValidLegacyPassword
      ? await this.passwordService.hashPassword(dto.password)
      : undefined;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(nextPasswordHash
          ? {
              passwordHash: nextPasswordHash,
              legacyHash: null,
              legacyHashType: null,
            }
          : {}),
        status:
          user.status === UserStatus.RESET_REQUIRED
            ? UserStatus.ACTIVE
            : user.status,
      },
    });

    const refreshedUser = await this.findUserById(user.id);

    if (!refreshedUser) {
      throw new UnauthorizedException("User session could not be created.");
    }

    const accessToken = await this.issueAccessToken(refreshedUser);

    return {
      accessToken,
      user: this.toAuthUserPayload(refreshedUser),
    };
  }

  async getMe(userId: string) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    return {
      user: this.toAuthUserPayload(user),
    };
  }

  async socialLogin(dto: SocialLoginDto) {
    const prisma = this.prisma as PrismaClient;

    // Check if user with this email already exists
    let user = await this.findUserByEmail(dto.email);

    if (user) {
      // Existing user — update last login and return token
      if (user.status === UserStatus.DELETED || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException("This account is not currently allowed to sign in.");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          status:
            user.status === UserStatus.RESET_REQUIRED
              ? UserStatus.ACTIVE
              : user.status,
        },
      });
    } else {
      // New user — create account with MEMBER role, pending profile
      const created = await prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          preferredLocale: LocaleKey.EN,
          status: UserStatus.ACTIVE,
          lastLoginAt: new Date(),
          roles: {
            create: {
              role: RoleKey.MEMBER,
            },
          },
          memberProfile: {
            create: {
              displayId: `social-${Date.now()}`,
              firstName: dto.name?.split(" ")[0] ?? dto.email.split("@")[0],
              lastName: dto.name?.split(" ").slice(1).join(" ") ?? null,
              displayName: dto.name ?? dto.email.split("@")[0],
              gender: "MAN",
              status: ProfileStatus.PENDING_REVIEW,
              approvalStatus: ApprovalStatus.PENDING,
              profileOwnerType: ProfileOwnerType.SELF,
              isProfilePublic: false,
              profileCompletionPct: 15,
            },
          },
        },
      });

      user = await this.findUserById(created.id);
    }

    if (!user) {
      throw new UnauthorizedException("Social login could not complete.");
    }

    const accessToken = await this.issueAccessToken(user);

    return {
      accessToken,
      user: this.toAuthUserPayload(user),
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const prisma = this.prisma as PrismaClient;
    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      return {
        accepted: true,
        message:
          "If the account exists, a password reset link will be prepared for delivery.",
      };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const ttlMinutes = Number(
      this.configService.get("PASSWORD_RESET_TTL_MINUTES") ?? 30,
    );
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          status:
            user.status === UserStatus.DELETED
              ? user.status
              : UserStatus.RESET_REQUIRED,
        },
      }),
    ]);

    const webBaseUrl =
      this.configService.get<string>("WEB_BASE_URL") ?? "https://borbodhu.com";
    const resetUrl = `${webBaseUrl}/reset-password?token=${rawToken}`;

    // Queue the reset email (fire-and-forget; delivery failure must not block the response)
    this.notifications
      .queueEmail({
        userId: user.id,
        recipientEmail: user.email,
        templateKey: "password_reset",
        subject: "Reset your Borbodhu password",
        bodyJson: {
          name: user.email,
          resetUrl,
          expiresAt: expiresAt.toISOString(),
        },
      })
      .catch(() => undefined);

    return {
      accepted: true,
      expiresAt,
      deliveryChannel: "email",
      resetTokenPreview:
        this.configService.get("NODE_ENV") === "development" ? rawToken : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const prisma = this.prisma as PrismaClient;
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new BadRequestException("Password reset token is invalid or expired.");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          legacyHash: null,
          legacyHashType: null,
          status:
            resetToken.user.status === UserStatus.DELETED
              ? UserStatus.DELETED
              : UserStatus.ACTIVE,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: "Password has been reset successfully.",
    };
  }

  private async issueAccessToken(user: AuthUserRecord) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.role),
    });
  }

  private toAuthUserPayload(user: AuthUserRecord) {
    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      preferredLocale: user.preferredLocale,
      status: user.status,
      roles: user.roles.map((role) => role.role),
      memberProfile: user.memberProfile,
      ghotokProfile: user.ghotokProfile,
      vendorProfile: user.vendorProfile,
      adminProfile: user.adminProfile,
    };
  }

  private authUserInclude() {
    return {
      roles: true,
      memberProfile: {
        select: {
          id: true,
          displayId: true,
          status: true,
          approvalStatus: true,
        },
      },
      ghotokProfile: {
        select: {
          id: true,
          displayName: true,
          status: true,
        },
      },
      vendorProfile: {
        select: {
          id: true,
          slug: true,
          status: true,
        },
      },
      adminProfile: {
        select: {
          id: true,
          displayName: true,
          isSuperAdmin: true,
          status: true,
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
      include: this.authUserInclude(),
    });
  }

  private findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: this.authUserInclude(),
    });
  }

  private async createUniqueVendorSlug(businessName: string) {
    const baseSlug =
      businessName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "vendor";

    const existing = await this.prisma.vendorProfile.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing) {
      return baseSlug;
    }

    return `${baseSlug}-${randomBytes(3).toString("hex")}`;
  }
}
