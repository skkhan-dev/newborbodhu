import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateGhotokMemberDto } from "./dto/create-ghotok-member.dto";
import { ManageImpersonationDto } from "./dto/manage-impersonation.dto";
import { GhotokService } from "./ghotok.service";

@Controller("ghotok")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.GHOTOK)
export class GhotokController {
  constructor(private readonly ghotokService: GhotokService) {}

  @Get("me/dashboard")
  getDashboard(@CurrentActor("userId") userId: string) {
    return this.ghotokService.getDashboard(userId);
  }

  @Post("me/photo/upload-request")
  createPhotoUploadRequest(
    @CurrentActor("userId") userId: string,
    @Body() body: { fileName: string; mimeType: string },
  ) {
    return this.ghotokService.createPhotoUploadRequest(userId, body.fileName, body.mimeType);
  }

  @Patch("me/photo")
  commitPhoto(
    @CurrentActor("userId") userId: string,
    @Body() body: { storagePath: string },
  ) {
    return this.ghotokService.commitPhoto(userId, body.storagePath);
  }

  @Patch("me/profile")
  updateProfile(
    @CurrentActor("userId") userId: string,
    @Body() body: {
      displayName?: string;
      bioEn?: string;
      bioBn?: string;
      phone?: string;
      address?: string;
      feeAmount?: number;
      feeCurrency?: string;
    },
  ) {
    return this.ghotokService.updateProfile(userId, body);
  }

  @Get("me/members")
  listManagedMembers(@CurrentActor("userId") userId: string) {
    return this.ghotokService.listManagedMembers(userId);
  }

  @Post("me/members")
  createManagedMember(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateGhotokMemberDto,
  ) {
    return this.ghotokService.createManagedMember(userId, dto);
  }

  @Get("me/member-search")
  searchAllMembers(
    @CurrentActor("userId") userId: string,
    @Query("q") q?: string,
  ) {
    return this.ghotokService.searchAllMembers(userId, q);
  }

  @Post("me/link-member/:memberProfileId")
  linkExistingMember(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.ghotokService.linkExistingMember(userId, memberProfileId);
  }

  @Delete("me/link-member/:memberProfileId")
  unlinkMember(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.ghotokService.unlinkMember(userId, memberProfileId);
  }

  @Get("me/impersonation")
  getActiveImpersonation(@CurrentActor("userId") userId: string) {
    return this.ghotokService.getActiveImpersonation(userId);
  }

  @Post("me/impersonation/:memberProfileId/start")
  startImpersonation(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
    @Body() dto: ManageImpersonationDto,
  ) {
    return this.ghotokService.startImpersonation(userId, memberProfileId, dto);
  }

  @Post("me/impersonation/:sessionId/end")
  endImpersonation(
    @CurrentActor("userId") userId: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: ManageImpersonationDto,
  ) {
    return this.ghotokService.endImpersonation(userId, sessionId, dto);
  }

  @Post("me/impersonation/:sessionId/contact-view/:targetMemberProfileId")
  consumeContactView(
    @CurrentActor("userId") userId: string,
    @Param("sessionId") sessionId: string,
    @Param("targetMemberProfileId") targetMemberProfileId: string,
  ) {
    return this.ghotokService.consumeContactView(
      userId,
      sessionId,
      targetMemberProfileId,
    );
  }
}
