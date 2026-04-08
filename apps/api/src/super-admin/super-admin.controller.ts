import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
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
import { UpdateGhotokStatusDto } from "./dto/update-ghotok-status.dto";
import { SuperAdminService } from "./super-admin.service";

@Controller("super-admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get("overview")
  getOverview() {
    return this.superAdminService.getOverview();
  }

  @Get("admins")
  listAdmins() {
    return this.superAdminService.listAdmins();
  }

  @Post("admins")
  createAdmin(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateAdminDto,
  ) {
    return this.superAdminService.createAdmin(userId, dto);
  }

  @Patch("admins/:adminUserId")
  updateAdmin(
    @CurrentActor("userId") userId: string,
    @Param("adminUserId") adminUserId: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.superAdminService.updateAdmin(userId, adminUserId, dto);
  }

  @Get("membership-plans")
  listMembershipPlans() {
    return this.superAdminService.listMembershipPlans();
  }

  @Post("membership-plans")
  createMembershipPlan(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateMembershipPlanDto,
  ) {
    return this.superAdminService.createMembershipPlan(userId, dto);
  }

  @Patch("membership-plans/:planId")
  updateMembershipPlan(
    @CurrentActor("userId") userId: string,
    @Param("planId") planId: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.superAdminService.updateMembershipPlan(userId, planId, dto);
  }

  @Get("coupons")
  listCoupons() {
    return this.superAdminService.listCoupons();
  }

  @Post("coupons")
  createCoupon(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateCouponDto,
  ) {
    return this.superAdminService.createCoupon(userId, dto);
  }

  @Patch("coupons/:couponId")
  updateCoupon(
    @CurrentActor("userId") userId: string,
    @Param("couponId") couponId: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.superAdminService.updateCoupon(userId, couponId, dto);
  }

  @Get("revenue-summary")
  getRevenueSummary(@Query() query: DateRangeQueryDto) {
    return this.superAdminService.getRevenueSummary(query);
  }

  @Get("profile-summary")
  getProfileSummary(@Query() query: DateRangeQueryDto) {
    return this.superAdminService.getProfileSummary(query);
  }

  @Get("commercial-settings")
  getCommercialSettings() {
    return this.superAdminService.getCommercialSettings();
  }

  @Patch("commercial-settings")
  updateCommercialSettings(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpdateCommercialSettingsDto,
  ) {
    return this.superAdminService.updateCommercialSettings(userId, dto);
  }

  @Get("match-mail/settings")
  getMatchMailSettings() {
    return this.superAdminService.getMatchMailSettings();
  }

  @Patch("match-mail/settings")
  updateMatchMailSettings(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpdateMatchMailSettingsDto,
  ) {
    return this.superAdminService.updateMatchMailSettings(userId, dto);
  }

  @Get("match-mail/preview")
  previewMatchMailAudience() {
    return this.superAdminService.previewMatchMailAudience();
  }

  @Post("match-mail/queue")
  queueMatchMailNow(@CurrentActor("userId") userId: string) {
    return this.superAdminService.queueMatchMailNow(userId);
  }

  @Get("mail-campaigns")
  listMailCampaigns() {
    return this.superAdminService.listMailCampaigns();
  }

  @Post("mail-campaigns/preview")
  previewMailCampaign(@Body() dto: PreviewMailCampaignDto) {
    return this.superAdminService.previewMailCampaign(dto);
  }

  @Post("mail-campaigns")
  createMailCampaign(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateMailCampaignDto,
  ) {
    return this.superAdminService.createMailCampaign(userId, dto);
  }

  // ── Ghotok approval queue ──────────────────────────────────────────────────

  @Get("ghotoks")
  listGhotoks(@Query("status") status?: string) {
    return this.superAdminService.listGhotoks(status);
  }

  @Post("ghotoks/:id/approve")
  approveGhotok(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.approveGhotok(adminUserId, id, notes);
  }

  @Post("ghotoks/:id/reject")
  rejectGhotok(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.rejectGhotok(adminUserId, id, notes);
  }

  @Patch("ghotoks/:id/status")
  setGhotokStatus(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body() dto: UpdateGhotokStatusDto,
  ) {
    return this.superAdminService.setGhotokStatus(adminUserId, id, dto.status, dto.notes);
  }

  @Post("ghotoks/:id/credits")
  addGhotokCredits(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("amount") amount: number,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.addGhotokCredits(adminUserId, id, amount, notes);
  }

  // ── Vendor approval queue ──────────────────────────────────────────────────

  @Get("vendors")
  listVendors(@Query("status") status?: string) {
    return this.superAdminService.listVendors(status);
  }

  @Post("vendors/:id/approve")
  approveVendor(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.approveVendor(adminUserId, id, notes);
  }

  @Post("vendors/:id/reject")
  rejectVendor(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.rejectVendor(adminUserId, id, notes);
  }

  @Patch("vendors/:id/status")
  setVendorStatus(
    @CurrentActor("userId") adminUserId: string,
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("notes") notes?: string,
  ) {
    return this.superAdminService.setVendorStatus(adminUserId, id, status as any, notes);
  }
}
