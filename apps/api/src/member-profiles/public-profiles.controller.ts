import { Controller, Get, Param, Query } from "@nestjs/common";

import { PublicProfileDirectoryQueryDto } from "./dto/public-profile-directory-query.dto";
import { MemberProfilesService } from "./member-profiles.service";

@Controller("public/profiles")
export class PublicProfilesController {
  constructor(private readonly memberProfilesService: MemberProfilesService) {}

  @Get()
  listPublicProfiles(@Query() query: PublicProfileDirectoryQueryDto) {
    return this.memberProfilesService.listPublicProfiles(query);
  }

  @Get(":displayId")
  getPublicProfile(@Param("displayId") displayId: string) {
    return this.memberProfilesService.getPublicProfile(displayId);
  }
}
