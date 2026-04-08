import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MemberProfilesController } from "./member-profiles.controller";
import { MemberProfilesService } from "./member-profiles.service";
import { PublicProfilesController } from "./public-profiles.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MemberProfilesController, PublicProfilesController],
  providers: [MemberProfilesService],
  exports: [MemberProfilesService],
})
export class MemberProfilesModule {}
