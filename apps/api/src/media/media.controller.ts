import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateMediaUploadRequestDto } from "./dto/create-media-upload-request.dto";
import { MediaService } from "./media.service";
import { RegisterMemberMediaDto } from "./dto/register-member-media.dto";
import { ReviewMediaDto } from "./dto/review-media.dto";
import { UpdateMemberMediaDto } from "./dto/update-member-media.dto";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get("member/me")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  listMyMedia(@CurrentActor("userId") userId: string) {
    return this.mediaService.listMyMedia(userId);
  }

  @Post("member/me/upload-request")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  createUploadRequest(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateMediaUploadRequestDto,
  ) {
    return this.mediaService.createUploadRequest(userId, dto);
  }

  @Post("member/me")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  registerMyMedia(
    @CurrentActor("userId") userId: string,
    @Body() dto: RegisterMemberMediaDto,
  ) {
    return this.mediaService.registerMyMedia(userId, dto);
  }

  @Patch("member/me/:mediaId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  updateMyMedia(
    @CurrentActor("userId") userId: string,
    @Param("mediaId") mediaId: string,
    @Body() dto: UpdateMemberMediaDto,
  ) {
    return this.mediaService.updateMyMedia(userId, mediaId, dto);
  }

  @Delete("member/me/:mediaId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  deleteMyMedia(
    @CurrentActor("userId") userId: string,
    @Param("mediaId") mediaId: string,
  ) {
    return this.mediaService.deleteMyMedia(userId, mediaId);
  }

  @Get("admin/pending")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.ADMIN, RoleKey.SUPER_ADMIN)
  listPendingMediaReviews() {
    return this.mediaService.listPendingMediaReviews();
  }

  @Post("admin/:mediaId/review")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.ADMIN, RoleKey.SUPER_ADMIN)
  reviewMedia(
    @CurrentActor("userId") userId: string,
    @Param("mediaId") mediaId: string,
    @Body() dto: ReviewMediaDto,
  ) {
    return this.mediaService.reviewMedia(userId, mediaId, dto);
  }
}
