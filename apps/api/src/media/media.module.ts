import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { ModerationService } from "./moderation.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [MediaController],
  providers: [MediaService, ModerationService],
})
export class MediaModule {}
