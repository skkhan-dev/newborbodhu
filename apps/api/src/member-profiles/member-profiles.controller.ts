import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Body,
} from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { DecidePhotoRequestDto } from "./dto/decide-photo-request.dto";
import { DiscoveryQueryDto } from "./dto/discovery-query.dto";
import { SaveSearchDto } from "./dto/save-search.dto";
import { UpdateMemberProfileDto } from "./dto/update-member-profile.dto";
import { UpdatePartnerPreferenceDto } from "./dto/update-partner-preference.dto";
import { MemberProfilesService } from "./member-profiles.service";

@Controller("member-profiles")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.MEMBER)
export class MemberProfilesController {
  constructor(private readonly memberProfilesService: MemberProfilesService) {}

  @Get("me")
  getMyProfile(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.getMyProfile(userId);
  }

  @Get("me/dashboard")
  getDashboard(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.getDashboard(userId);
  }

  @Get("me/visitors")
  listVisitors(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.listVisitors(userId);
  }

  @Get("me/saved-searches")
  listSavedSearches(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.listSavedSearches(userId);
  }

  @Post("me/saved-searches")
  createSavedSearch(
    @CurrentActor("userId") userId: string,
    @Body() dto: SaveSearchDto,
  ) {
    return this.memberProfilesService.createSavedSearch(userId, dto);
  }

  @Patch("me/saved-searches/:searchSaveId")
  updateSavedSearch(
    @CurrentActor("userId") userId: string,
    @Param("searchSaveId") searchSaveId: string,
    @Body() dto: SaveSearchDto,
  ) {
    return this.memberProfilesService.updateSavedSearch(userId, searchSaveId, dto);
  }

  @Delete("me/saved-searches/:searchSaveId")
  deleteSavedSearch(
    @CurrentActor("userId") userId: string,
    @Param("searchSaveId") searchSaveId: string,
  ) {
    return this.memberProfilesService.deleteSavedSearch(userId, searchSaveId);
  }

  @Patch("me")
  updateMyProfile(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpdateMemberProfileDto,
  ) {
    return this.memberProfilesService.updateMyProfile(userId, dto);
  }

  @Patch("me/preferences")
  updatePreferences(
    @CurrentActor("userId") userId: string,
    @Body() dto: UpdatePartnerPreferenceDto,
  ) {
    return this.memberProfilesService.updatePreferences(userId, dto);
  }

  @Post("me/submit-review")
  submitForReview(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.submitForReview(userId);
  }

  @Get("discovery")
  discover(
    @CurrentActor("userId") userId: string,
    @Query() query: DiscoveryQueryDto,
  ) {
    return this.memberProfilesService.discover(userId, query);
  }

  @Get(":memberProfileId")
  getProfileDetail(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.getProfileDetail(userId, memberProfileId);
  }

  @Post(":memberProfileId/contact-unlocks")
  unlockContact(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.unlockContact(userId, memberProfileId);
  }

  @Post(":memberProfileId/interests")
  sendInterest(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.sendInterest(userId, memberProfileId);
  }

  @Post(":memberProfileId/favorites")
  addFavorite(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.addFavorite(userId, memberProfileId);
  }

  @Post(":memberProfileId/blocks")
  blockMember(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.blockMember(userId, memberProfileId);
  }

  @Post(":memberProfileId/photo-requests")
  createPhotoRequest(
    @CurrentActor("userId") userId: string,
    @Param("memberProfileId") memberProfileId: string,
  ) {
    return this.memberProfilesService.createPhotoRequest(userId, memberProfileId);
  }

  @Get("me/contact-unlocks")
  listMyContactUnlocks(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.listMyContactUnlocks(userId);
  }

  @Get("me/photo-requests")
  getMyPhotoRequests(@CurrentActor("userId") userId: string) {
    return this.memberProfilesService.getMyPhotoRequests(userId);
  }

  @Post("me/photo-requests/:photoRequestId/decision")
  decidePhotoRequest(
    @CurrentActor("userId") userId: string,
    @Param("photoRequestId") photoRequestId: string,
    @Body() dto: DecidePhotoRequestDto,
  ) {
    return this.memberProfilesService.decidePhotoRequest(userId, photoRequestId, dto);
  }
}
