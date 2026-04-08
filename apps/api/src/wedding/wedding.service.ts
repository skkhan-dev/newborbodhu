import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LeadStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { AddWeddingGuestDto } from "./dto/add-wedding-guest.dto";
import { CreateWeddingProjectDto } from "./dto/create-wedding-project.dto";
import { ShortlistVendorDto } from "./dto/shortlist-vendor.dto";

@Injectable()
export class WeddingService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyProjects(userId: string) {
    const memberProfile = await this.requireMemberProfile(userId);
    const projects = await this.prisma.weddingProject.findMany({
      where: {
        memberProfileId: memberProfile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        guestEntries: true,
        shortlists: {
          include: {
            vendorProfile: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                categoryName: true,
              },
            },
          },
        },
      },
    });

    return projects;
  }

  async createProject(userId: string, dto: CreateWeddingProjectDto) {
    const memberProfile = await this.requireMemberProfile(userId);
    return this.prisma.weddingProject.create({
      data: {
        memberProfileId: memberProfile.id,
        title: dto.title.trim(),
        weddingDate: dto.weddingDate ? new Date(dto.weddingDate) : undefined,
        city: dto.city?.trim(),
        budgetBand: dto.budgetBand?.trim(),
        guestTarget: dto.guestTarget,
      },
    });
  }

  async addGuest(
    userId: string,
    weddingProjectId: string,
    dto: AddWeddingGuestDto,
  ) {
    const project = await this.requireOwnedProject(userId, weddingProjectId);
    return this.prisma.weddingGuestEntry.create({
      data: {
        weddingProjectId: project.id,
        guestName: dto.guestName.trim(),
        guestAddress: dto.guestAddress?.trim(),
        guestPhone: dto.guestPhone?.trim(),
        guestEmail: dto.guestEmail?.trim().toLowerCase(),
        guestCount: dto.guestCount,
        invited: dto.invited ?? false,
        confirmed: dto.confirmed ?? false,
      },
    });
  }

  async shortlistVendor(
    userId: string,
    weddingProjectId: string,
    dto: ShortlistVendorDto,
  ) {
    const project = await this.requireOwnedProject(userId, weddingProjectId);
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: dto.vendorProfileId },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor was not found.");
    }

    return this.prisma.weddingVendorShortlist.upsert({
      where: {
        weddingProjectId_vendorProfileId: {
          weddingProjectId: project.id,
          vendorProfileId: vendor.id,
        },
      },
      create: {
        weddingProjectId: project.id,
        vendorProfileId: vendor.id,
        notes: dto.notes?.trim(),
        status: LeadStatus.NEW,
      },
      update: {
        notes: dto.notes?.trim(),
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            categoryName: true,
          },
        },
      },
    });
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

  private async requireOwnedProject(userId: string, weddingProjectId: string) {
    const memberProfile = await this.requireMemberProfile(userId);
    const project = await this.prisma.weddingProject.findUnique({
      where: { id: weddingProjectId },
    });

    if (!project) {
      throw new NotFoundException("Wedding project was not found.");
    }

    if (project.memberProfileId !== memberProfile.id) {
      throw new ForbiddenException("You do not own this wedding project.");
    }

    return project;
  }
}
