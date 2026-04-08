import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { BkashGateway } from "./gateways/bkash.gateway";
import { SslcommerzGateway } from "./gateways/sslcommerz.gateway";
import { StripeGateway } from "./gateways/stripe.gateway";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [BillingController],
  providers: [BillingService, BkashGateway, SslcommerzGateway, StripeGateway],
  exports: [BillingService],
})
export class BillingModule {}
