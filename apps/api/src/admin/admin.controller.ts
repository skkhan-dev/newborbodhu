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

import { BillingService } from "../billing/billing.service";
import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AdminService } from "./admin.service";
import { ProfileReviewQueryDto } from "./dto/profile-review-query.dto";
import { ReviewProfileDto } from "./dto/review-profile.dto";
import { ReviewManualPaymentDto } from "../billing/dto/review-manual-payment.dto";

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.ADMIN, RoleKey.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly billingService: BillingService,
  ) {}

  @Get("overview")
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get("profile-reviews")
  listProfileReviews(@Query() query: ProfileReviewQueryDto) {
    return this.adminService.listProfileReviews(query);
  }

  @Post("profile-reviews/:memberProfileId/approve")
  approveProfile(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
    @Body() dto: ReviewProfileDto,
  ) {
    return this.adminService.approveProfile(userId, memberProfileId, dto.notes);
  }

  @Post("profile-reviews/:memberProfileId/reject")
  rejectProfile(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
    @Body() dto: ReviewProfileDto,
  ) {
    return this.adminService.rejectProfile(userId, memberProfileId, dto.notes);
  }

  @Get("manual-payments")
  listManualPayments() {
    return this.adminService.listManualReviewPayments();
  }

  @Post("manual-payments/:paymentId/approve")
  approveManualPayment(
    @CurrentActor("userId") userId: string,
    @Param("paymentId") paymentId: string,
    @Body() dto: ReviewManualPaymentDto,
  ) {
    return this.billingService.approveManualPayment(paymentId, userId, dto.notes);
  }

  @Post("manual-payments/:paymentId/reject")
  rejectManualPayment(
    @CurrentActor("userId") userId: string,
    @Param("paymentId") paymentId: string,
    @Body() dto: ReviewManualPaymentDto,
  ) {
    return this.billingService.rejectManualPayment(paymentId, userId, dto.notes);
  }

  // ── AI: Suggest rejection reason ──────────────────────────────────────────

  @Post("profile-reviews/:memberProfileId/suggest-rejection")
  suggestRejectionReason(@Param("memberProfileId") memberProfileId: string) {
    return this.adminService.suggestRejectionReason(memberProfileId);
  }

  // ── Member Search ──────────────────────────────────────────────────────────

  @Get("members")
  searchMembers(
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("gender") gender?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.adminService.searchMembers({
      q,
      status,
      gender,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // ── User suspension ────────────────────────────────────────────────────────

  @Patch("members/:userId/status")
  setUserStatus(
    @CurrentActor("userId") adminUserId: string,
    @Param("userId") userId: string,
    @Body("status") status: "ACTIVE" | "SUSPENDED",
  ) {
    return this.adminService.setUserStatus(adminUserId, userId, status);
  }

  // ── Photo moderation ───────────────────────────────────────────────────────

  @Get("photos/pending")
  listPendingPhotos() {
    return this.adminService.listPendingPhotos();
  }

  @Post("photos/:mediaId/approve")
  approvePhoto(
    @CurrentActor("userId") adminUserId: string,
    @Param("mediaId") mediaId: string,
    @Body("notes") notes?: string,
  ) {
    return this.adminService.moderatePhoto(adminUserId, mediaId, "approve", notes);
  }

  @Post("photos/:mediaId/reject")
  rejectPhoto(
    @CurrentActor("userId") adminUserId: string,
    @Param("mediaId") mediaId: string,
    @Body("notes") notes?: string,
  ) {
    return this.adminService.moderatePhoto(adminUserId, mediaId, "reject", notes);
  }

  // ── Audit log ──────────────────────────────────────────────────────────────

  @Get("audit-log")
  getAuditLog(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("action") action?: string,
  ) {
    return this.adminService.getAuditLog({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      action,
    });
  }
}
