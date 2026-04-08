import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AddWeddingGuestDto } from "./dto/add-wedding-guest.dto";
import { CreateWeddingProjectDto } from "./dto/create-wedding-project.dto";
import { ShortlistVendorDto } from "./dto/shortlist-vendor.dto";
import { WeddingService } from "./wedding.service";

@Controller("wedding")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.MEMBER)
export class WeddingController {
  constructor(private readonly weddingService: WeddingService) {}

  @Get("projects/me")
  listMyProjects(@CurrentActor("userId") userId: string) {
    return this.weddingService.listMyProjects(userId);
  }

  @Post("projects")
  createProject(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateWeddingProjectDto,
  ) {
    return this.weddingService.createProject(userId, dto);
  }

  @Post("projects/:weddingProjectId/guests")
  addGuest(
    @CurrentActor("userId") userId: string,
    @Param("weddingProjectId") weddingProjectId: string,
    @Body() dto: AddWeddingGuestDto,
  ) {
    return this.weddingService.addGuest(userId, weddingProjectId, dto);
  }

  @Post("projects/:weddingProjectId/shortlists")
  shortlistVendor(
    @CurrentActor("userId") userId: string,
    @Param("weddingProjectId") weddingProjectId: string,
    @Body() dto: ShortlistVendorDto,
  ) {
    return this.weddingService.shortlistVendor(userId, weddingProjectId, dto);
  }
}
