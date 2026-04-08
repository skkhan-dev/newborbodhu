import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { MailboxController } from "./mailbox.controller";
import { MailboxService } from "./mailbox.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [MailboxController],
  providers: [MailboxService],
})
export class MailboxModule {}
