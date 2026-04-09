import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AssistantModule } from "./assistant/assistant.module";
import { AdminModule } from "./admin/admin.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { validateEnv } from "./config/env.validation";
import { GhotokModule } from "./ghotok/ghotok.module";
import { HealthModule } from "./health/health.module";
import { MailboxModule } from "./mailbox/mailbox.module";
import { MemberProfilesModule } from "./member-profiles/member-profiles.module";
import { MediaModule } from "./media/media.module";
import { MetaModule } from "./meta/meta.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";
import { SuperAdminModule } from "./super-admin/super-admin.module";
import { VendorsModule } from "./vendors/vendors.module";
import { WeddingModule } from "./wedding/wedding.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
    }),
    StorageModule,
    PrismaModule,
    AssistantModule,
    HealthModule,
    MetaModule,
    AnalyticsModule,
    AuthModule,
    NotificationsModule,
    MemberProfilesModule,
    MailboxModule,
    MediaModule,
    BillingModule,
    AdminModule,
    SuperAdminModule,
    VendorsModule,
    WeddingModule,
    GhotokModule,
  ],
})
export class AppModule {}
