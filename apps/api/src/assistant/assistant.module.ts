import { Module } from "@nestjs/common";

import { AdminModule } from "../admin/admin.module";
import { AuthModule } from "../auth/auth.module";
import { MailboxModule } from "../mailbox/mailbox.module";
import { MemberProfilesModule } from "../member-profiles/member-profiles.module";
import { PrismaModule } from "../prisma/prisma.module";
import { VendorsModule } from "../vendors/vendors.module";
import { WeddingModule } from "../wedding/wedding.module";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";

@Module({
  imports: [PrismaModule, AuthModule, MailboxModule, WeddingModule, AdminModule, MemberProfilesModule, VendorsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
