import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { PrismaModule } from "../prisma/prisma.module";
import { EmailCronService } from "./email-cron.service";
import { EmailDispatcherService } from "./email-dispatcher.service";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [NotificationsService, EmailDispatcherService, EmailCronService],
  exports: [NotificationsService, EmailDispatcherService],
})
export class NotificationsModule {}
