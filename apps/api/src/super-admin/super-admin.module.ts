import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SuperAdminController } from "./super-admin.controller";
import { SuperAdminService } from "./super-admin.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
