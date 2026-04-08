import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { SubmitMemberVendorLeadDto } from "./dto/submit-member-vendor-lead.dto";
import { SubmitPublicVendorLeadDto } from "./dto/submit-public-vendor-lead.dto";
import { UpdateVendorLeadStatusDto } from "./dto/update-vendor-lead-status.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { UpsertVendorPackageDto } from "./dto/upsert-vendor-package.dto";
import { VendorDirectoryQueryDto } from "./dto/vendor-directory-query.dto";
import { VendorsService } from "./vendors.service";

@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  listDirectory(@Query() query: VendorDirectoryQueryDto) {
    return this.vendorsService.listDirectory(query);
  }

  @Get("me/dashboard")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.VENDOR)
  getMyDashboard(@CurrentActor("userId") userId: string) {
    return this.vendorsService.getMyDashboard(userId);
  }

  @Patch("me/profile")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.VENDOR)
  updateMyProfile(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateMyProfile(userId, dto);
  }

  @Post("me/packages")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.VENDOR)
  createPackage(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpsertVendorPackageDto,
  ) {
    return this.vendorsService.createPackage(userId, dto);
  }

  @Patch("me/packages/:packageId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.VENDOR)
  updatePackage(
    @CurrentActor("userId") userId: string,
    @Param("packageId") packageId: string,
    @Body() dto: UpsertVendorPackageDto,
  ) {
    return this.vendorsService.updatePackage(userId, packageId, dto);
  }

  @Patch("me/leads/:leadId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.VENDOR)
  updateLeadStatus(
    @CurrentActor("userId") userId: string,
    @Param("leadId") leadId: string,
    @Body() dto: UpdateVendorLeadStatusDto,
  ) {
    return this.vendorsService.updateLeadStatus(userId, leadId, dto);
  }

  @Post(":slug/leads/public")
  submitPublicLead(@Param("slug") slug: string, @Body() dto: SubmitPublicVendorLeadDto) {
    return this.vendorsService.submitPublicLead(slug, dto);
  }

  @Post(":slug/leads/member")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  submitMemberLead(
    @CurrentActor("userId") userId: string,
    @Param("slug") slug: string,
    @Body() dto: SubmitMemberVendorLeadDto,
  ) {
    return this.vendorsService.submitMemberLead(userId, slug, dto);
  }

  @Get(":slug")
  getVendorBySlug(@Param("slug") slug: string) {
    return this.vendorsService.getVendorBySlug(slug);
  }
}
