import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LeadStatus, Prisma, VendorStatus } from "@prisma/client";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitMemberVendorLeadDto } from "./dto/submit-member-vendor-lead.dto";
import { SubmitPublicVendorLeadDto } from "./dto/submit-public-vendor-lead.dto";
import { UpdateVendorLeadStatusDto } from "./dto/update-vendor-lead-status.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { UpsertVendorPackageDto } from "./dto/upsert-vendor-package.dto";
import { VendorDirectoryQueryDto } from "./dto/vendor-directory-query.dto";

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listDirectory(query: VendorDirectoryQueryDto) {
    const where: Prisma.VendorProfileWhereInput = {
      status: VendorStatus.ACTIVE,
      categoryName: query.category?.trim() || undefined,
      division: query.division?.trim() || undefined,
      district: query.district?.trim() || undefined,
      OR: query.search
        ? [
            {
              businessName: {
                contains: query.search.trim(),
                mode: "insensitive",
              },
            },
            {
              descriptionEn: {
                contains: query.search.trim(),
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    };

    const vendors = await this.prisma.vendorProfile.findMany({
      where,
      orderBy: [{ billingStatus: "asc" }, { businessName: "asc" }],
      include: {
        packages: {
          where: {
            isActive: true,
          },
          orderBy: {
            priceBdt: "asc",
          },
        },
      },
    });

    return vendors.map((vendor) => ({
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      categoryName: vendor.categoryName,
      division: vendor.division,
      district: vendor.district,
      area: vendor.area,
      descriptionEn: vendor.descriptionEn,
      descriptionBn: vendor.descriptionBn,
      logoPath: vendor.logoPath,
      packages: vendor.packages.map((pkg) => ({
        id: pkg.id,
        nameEn: pkg.nameEn,
        nameBn: pkg.nameBn,
        priceBdt: Number(pkg.priceBdt),
      })),
    }));
  }

  async getVendorBySlug(slug: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { slug },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { priceBdt: "asc" },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor was not found.");
    }

    return {
      ...vendor,
      packages: vendor.packages.map((pkg) => ({
        ...pkg,
        priceBdt: Number(pkg.priceBdt),
      })),
    };
  }

  async getMyDashboard(userId: string) {
    const vendor = await this.findVendorByUserId(userId);

    if (!vendor) {
      throw new NotFoundException("Vendor profile was not found.");
    }

    return {
      profile: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        status: vendor.status,
        billingStatus: vendor.billingStatus,
        categoryName: vendor.categoryName,
        division: vendor.division,
        district: vendor.district,
        area: vendor.area,
        address: vendor.address,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        email: vendor.email,
        website: vendor.website,
        descriptionEn: vendor.descriptionEn,
        descriptionBn: vendor.descriptionBn,
      },
      packages: vendor.packages.map((pkg) => ({
        id: pkg.id,
        nameEn: pkg.nameEn,
        nameBn: pkg.nameBn,
        descriptionEn: pkg.descriptionEn,
        descriptionBn: pkg.descriptionBn,
        priceBdt: Number(pkg.priceBdt),
        isActive: pkg.isActive,
      })),
      recentLeads: vendor.leads.map((lead) => ({
        id: lead.id,
        status: lead.status,
        message: lead.message,
        requesterName: lead.requesterName,
        requesterEmail: lead.requesterEmail,
        requesterPhone: lead.requesterPhone,
        source: lead.source,
        createdAt: lead.createdAt,
        memberProfile: lead.memberProfile
          ? {
              id: lead.memberProfile.id,
              displayId: lead.memberProfile.displayId,
              displayName: lead.memberProfile.displayName,
            }
          : null,
        weddingProject: lead.weddingProject
          ? {
              id: lead.weddingProject.id,
              title: lead.weddingProject.title,
            }
          : null,
      })),
    };
  }

  async updateMyProfile(userId: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.findVendorByUserId(userId);

    if (!vendor) {
      throw new NotFoundException("Vendor profile was not found.");
    }

    if (!Object.keys(dto).length) {
      throw new BadRequestException("At least one vendor profile field must be provided.");
    }

    await this.prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        businessName: dto.businessName?.trim(),
        categoryName: dto.categoryName?.trim(),
        division: dto.division?.trim(),
        district: dto.district?.trim(),
        area: dto.area?.trim(),
        address: dto.address?.trim(),
        contactPerson: dto.contactPerson?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email?.trim().toLowerCase(),
        website: dto.website?.trim(),
        descriptionEn: dto.descriptionEn?.trim(),
        descriptionBn: dto.descriptionBn?.trim(),
      },
    });

    return this.getMyDashboard(userId);
  }

  async createPackage(userId: string, dto: UpsertVendorPackageDto) {
    const vendor = await this.findVendorByUserId(userId);

    if (!vendor) {
      throw new NotFoundException("Vendor profile was not found.");
    }

    await this.prisma.vendorPackage.create({
      data: {
        vendorProfileId: vendor.id,
        nameEn: dto.nameEn.trim(),
        nameBn: dto.nameBn?.trim(),
        descriptionEn: dto.descriptionEn?.trim(),
        descriptionBn: dto.descriptionBn?.trim(),
        priceBdt: new Prisma.Decimal(dto.priceBdt.toFixed(2)),
        isActive: dto.isActive ?? true,
      },
    });

    return this.getMyDashboard(userId);
  }

  async updatePackage(userId: string, packageId: string, dto: UpsertVendorPackageDto) {
    const vendor = await this.findVendorByUserId(userId);

    if (!vendor) {
      throw new NotFoundException("Vendor profile was not found.");
    }

    const existingPackage = await this.prisma.vendorPackage.findFirst({
      where: {
        id: packageId,
        vendorProfileId: vendor.id,
      },
      select: { id: true },
    });

    if (!existingPackage) {
      throw new NotFoundException("Vendor package was not found.");
    }

    await this.prisma.vendorPackage.update({
      where: { id: packageId },
      data: {
        nameEn: dto.nameEn.trim(),
        nameBn: dto.nameBn?.trim(),
        descriptionEn: dto.descriptionEn?.trim(),
        descriptionBn: dto.descriptionBn?.trim(),
        priceBdt: new Prisma.Decimal(dto.priceBdt.toFixed(2)),
        isActive: dto.isActive ?? true,
      },
    });

    return this.getMyDashboard(userId);
  }

  async updateLeadStatus(userId: string, leadId: string, dto: UpdateVendorLeadStatusDto) {
    const vendor = await this.findVendorByUserId(userId);

    if (!vendor) {
      throw new NotFoundException("Vendor profile was not found.");
    }

    const lead = await this.prisma.vendorLead.findFirst({
      where: {
        id: leadId,
        vendorProfileId: vendor.id,
      },
      select: { id: true },
    });

    if (!lead) {
      throw new NotFoundException("Vendor lead was not found.");
    }

    await this.prisma.vendorLead.update({
      where: { id: leadId },
      data: {
        status: dto.status,
      },
    });

    return this.getMyDashboard(userId);
  }

  async submitPublicLead(slug: string, dto: SubmitPublicVendorLeadDto) {
    const vendor = await this.findVendorBySlug(slug);

    const lead = await this.prisma.vendorLead.create({
      data: {
        vendorProfileId: vendor.id,
        status: LeadStatus.NEW,
        message: dto.message?.trim(),
        requesterName: dto.requesterName.trim(),
        requesterEmail: dto.requesterEmail.trim().toLowerCase(),
        requesterPhone: dto.requesterPhone?.trim(),
        source: "PUBLIC_VENDOR_PAGE",
      },
    });

    await this.queueVendorLeadEmail(vendor, {
      leadId: lead.id,
      requesterName: dto.requesterName.trim(),
      requesterEmail: dto.requesterEmail.trim().toLowerCase(),
      requesterPhone: dto.requesterPhone?.trim() ?? null,
      message: dto.message?.trim() ?? null,
      source: "PUBLIC_VENDOR_PAGE",
    });

    return {
      success: true,
      leadId: lead.id,
      nextStep: "vendor_follow_up_pending",
    };
  }

  async submitMemberLead(userId: string, slug: string, dto: SubmitMemberVendorLeadDto) {
    const vendor = await this.findVendorBySlug(slug);
    const member = await this.prisma.memberProfile.findFirst({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member profile was not found.");
    }

    let weddingProjectId: string | undefined;
    if (dto.weddingProjectId) {
      const project = await this.prisma.weddingProject.findFirst({
        where: {
          id: dto.weddingProjectId,
          memberProfileId: member.id,
        },
        select: { id: true },
      });

      if (!project) {
        throw new BadRequestException("Wedding project was not found for this member.");
      }

      weddingProjectId = project.id;
    }

    const lead = await this.prisma.vendorLead.create({
      data: {
        vendorProfileId: vendor.id,
        memberProfileId: member.id,
        weddingProjectId,
        status: LeadStatus.NEW,
        message: dto.message?.trim(),
        requesterName: member.displayName,
        requesterEmail: member.user.email,
        requesterPhone: member.guardianPhone,
        source: weddingProjectId ? "WEDDING_PROJECT" : "MEMBER_DASHBOARD",
      },
    });

    await this.queueVendorLeadEmail(vendor, {
      leadId: lead.id,
      requesterName: member.displayName || "Borbodhu member",
      requesterEmail: member.user.email,
      requesterPhone: member.guardianPhone,
      message: dto.message?.trim() ?? null,
      source: weddingProjectId ? "WEDDING_PROJECT" : "MEMBER_DASHBOARD",
    });

    return {
      success: true,
      leadId: lead.id,
      nextStep: "vendor_follow_up_pending",
    };
  }

  private async findVendorByUserId(userId: string) {
    return this.prisma.vendorProfile.findFirst({
      where: {
        userId,
      },
      include: {
        packages: {
          orderBy: {
            priceBdt: "asc",
          },
        },
        leads: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          include: {
            memberProfile: {
              select: {
                id: true,
                displayId: true,
                displayName: true,
              },
            },
            weddingProject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  private async findVendorBySlug(slug: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        businessName: true,
        slug: true,
        email: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor was not found.");
    }

    return vendor;
  }

  private async queueVendorLeadEmail(
    vendor: { businessName: string; email: string | null; slug: string },
    input: {
      leadId: string;
      requesterName: string;
      requesterEmail: string;
      requesterPhone: string | null;
      message: string | null;
      source: string;
    },
  ) {
    if (!vendor.email) {
      return;
    }

    await this.notificationsService.queueEmail({
      recipientEmail: vendor.email,
      templateKey: "vendor.new_lead",
      subject: `New Borbodhu vendor lead for ${vendor.businessName}`,
      bodyJson: {
        vendorBusinessName: vendor.businessName,
        vendorSlug: vendor.slug,
        leadId: input.leadId,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail,
        requesterPhone: input.requesterPhone,
        message: input.message,
        source: input.source,
      },
      metadataJson: {
        leadId: input.leadId,
        source: input.source,
      },
    });
  }
}
